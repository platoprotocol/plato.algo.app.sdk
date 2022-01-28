from pyteal import *

from utils.inner_txn_utils import *
from enums import *

@Subroutine(TealType.uint64)
def can_complete_order():
    order_status = App.globalGet(GlobalState.Variables.ORDER_STATUS)
    return Seq(
        Assert(Txn.sender() == Global.creator_address()),
        Assert(Or(order_status == OrderStatus.DELIVERED, order_status == OrderStatus.DISPUTE)),
        Int(1)
    )

@Subroutine(TealType.uint64)
def can_claim_funds():
    courier_address = App.globalGet(GlobalState.Variables.COURIER_ADDRESS)
    order_status = App.globalGet(GlobalState.Variables.ORDER_STATUS)
    delivered_timestamp = App.globalGet(GlobalState.Variables.DELIVERED_TIMESTAMP)
    confirmation_dead_line = Add(delivered_timestamp, AppParams.ACCEPT_DELIVERY_WINDOW)
    return Seq(
        Assert(Txn.sender() == courier_address),
        Assert(order_status == OrderStatus.DELIVERED),
        Assert(Global.latest_timestamp() >= confirmation_dead_line),
        Int(1)
    )

@Subroutine(TealType.uint64)
def can_mark_as_delivered():
    courier_address = App.globalGet(GlobalState.Variables.COURIER_ADDRESS)
    order_status = App.globalGet(GlobalState.Variables.ORDER_STATUS)
    return Seq(
        Assert(Txn.sender() == courier_address),
        Assert(order_status == OrderStatus.DELIVERING),
        Int(1)
    )

@Subroutine(TealType.uint64)
def can_start_disput():
    order_status = App.globalGet(GlobalState.Variables.ORDER_STATUS)
    return Seq(
        Assert(Txn.sender() == Global.creator_address()),
        Assert(order_status == OrderStatus.DELIVERED),
        Int(1)
    )

@Subroutine(TealType.uint64)
def can_pick_up_order():
    courier_address = App.globalGet(GlobalState.Variables.COURIER_ADDRESS)
    order_status = App.globalGet(GlobalState.Variables.ORDER_STATUS)
    return Seq(
        Assert(Txn.sender() == courier_address),
        Assert(order_status == OrderStatus.COOKING),
        Int(1)
    )

@Subroutine(TealType.uint64)
def pick_up_order():
    return Seq(
        App.globalPut(GlobalState.Variables.ORDER_STATUS, OrderStatus.DELIVERING),
        Int(1)
    )

@Subroutine(TealType.uint64)
def start_disput():
    return Seq(
        App.globalPut(GlobalState.Variables.ORDER_STATUS, OrderStatus.DISPUTE),
        Int(1)
    )

@Subroutine(TealType.uint64)
def handle_creation():
    courier_address = Txn.application_args[AppParams.COURIER_ADDRESS_INDEX]
    restaurant_address = Txn.application_args[AppParams.RESTAURANT_ADDRESS_INDEX]
    reward_amount = Btoi(Txn.application_args[AppParams.COURIER_REWARD_AMOUNT_INDEX])
    return Seq(
        App.globalPut(GlobalState.Variables.COURIER_ADDRESS, courier_address),
        App.globalPut(GlobalState.Variables.RESTAURANT_ADDRESS, restaurant_address),
        App.globalPut(GlobalState.Variables.COURIER_REWARD_AMOUNT, reward_amount),
        App.globalPut(GlobalState.Variables.ORDER_STATUS, OrderStatus.DELIVERING),
        Int(1)
    )

@Subroutine(TealType.none)
def send_tip_to(address):
    # Transfer all available PLATO tokens to a courier and close the holding ASA to close the escrow account.
    # https://developer.algorand.org/docs/get-details/transactions/#close-an-account
    return inner_asset_transfer_txn(AppParams.ASA_ID, Int(0), address, address)

@Subroutine(TealType.none)
def release_funds():
    amount = App.globalGet(GlobalState.Variables.COURIER_REWARD_AMOUNT)
    courier_address = App.globalGet(GlobalState.Variables.COURIER_ADDRESS)
    restaurant_address = App.globalGet(GlobalState.Variables.RESTAURANT_ADDRESS)
    return Seq(
        send_tip_to(courier_address),
        inner_payment_txn(amount, courier_address, restaurant_address)
    )

@Subroutine(TealType.uint64)
def complete_order():
    return Seq(
        App.globalPut(GlobalState.Variables.ORDER_STATUS, OrderStatus.COMPLETED),
        release_funds(),
        Int(1)
    )

@Subroutine(TealType.uint64)
def claim_funds():
    return Seq(
        App.globalPut(GlobalState.Variables.ORDER_STATUS, OrderStatus.COMPLETED),
        release_funds(),
        Int(1)
    )

@Subroutine(TealType.uint64)
def food_delivered():
    return Seq(
        App.globalPut(GlobalState.Variables.DELIVERED_TIMESTAMP, Global.latest_timestamp()),
        App.globalPut(GlobalState.Variables.ORDER_STATUS, OrderStatus.DELIVERED),
        Int(1)
    )

@Subroutine(TealType.uint64)
def asa_opt_in():
    return Seq(
        inner_asset_opt_in(
            AppParams.ASA_ID,
            Global.current_application_address()
        ),
        Int(1)
    )

def approval_program():
    # Mode.Application specifies that this is a smart contract

    handle_optin = Return(Int(1))
    handle_closeout = Return(Int(1))
    handle_updateapp = Return(Seq(
        App.globalPut(GlobalState.Variables.ORDER_STATUS, OrderStatus.DELIVERING),
        Int(1)
    ))
    handle_deleteapp = Return(Int(1))
    handle_claim_funds = And(can_claim_funds(), claim_funds())
    handle_complete_order = And(can_complete_order(), complete_order())
    handle_delivered = And(can_mark_as_delivered(), food_delivered())
    handle_start_dispute = And(can_start_disput(), start_disput())
    handle_pick_up_order = And(can_pick_up_order(), pick_up_order())

    action_type = Txn.application_args[AppParams.ACTION_TYPE_PARAM_INDEX]
    handle_noop = Cond(
       [BytesEq(action_type, ActionType.PICK_UP_ORDER), Return(handle_pick_up_order)],
       [BytesEq(action_type, ActionType.START_DISPUTE), Return(handle_start_dispute)],
       [BytesEq(action_type, ActionType.COMPLETE_ORDER), Return(handle_complete_order)],
       [BytesEq(action_type, ActionType.DELIVERED), Return(handle_delivered)],
       [BytesEq(action_type, ActionType.CLAIM_FUNDS), Return(handle_claim_funds)],
       [BytesEq(action_type, ActionType.ASA_OPT_IN), Return(asa_opt_in())],
   )

    return Cond(
        [Txn.application_id() == Int(0), Return(handle_creation())],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, handle_closeout],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_updateapp],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_deleteapp],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop]
    )

def clear_program():
    return Return(Int(1))

if __name__ == "__main__":
    with open("./dist/escrow_approval.teal", "w", encoding="UTF-8") as f:
        f.write(compileTeal(approval_program(), mode=Mode.Application, version=5))
    with open("./dist/escrow_clear_program.teal", "w", encoding="UTF-8") as f:
        f.write(compileTeal(clear_program(), mode=Mode.Application, version=5))
