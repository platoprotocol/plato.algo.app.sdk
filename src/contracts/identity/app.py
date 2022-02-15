import os
from pyteal import *

# user type values: 1=buyer;2=store;3=courier

# Opt In applications arguments array
#  0 - sender address
#  1 - user type values (1=buyer, 2=store, 3=courier)
#  2 - time (for validation)
#  3 - latitude (for store only, on opt in)
#  4 - longitude (for store only, on opt in)
#  5 - referer address

# Store attestation applications arguments array
#  0 - call text
#  1 - user type values (1=buyer, 2=store, 3=courier)
#  2 - time (for validation)
#  0 - sender and also the buyer's address
#
# Accounts - [store_addr]

# Courier attestation applications arguments array
#  0 - sender can be any user reviewing other user type, the second argument is the user type to be reviewed
#  1 - user type values (1=buyer, 2=store, 3=courier)
#  2 - time (for validation)
#  3 - to be reviewed address
#  4 - review type (need to figure out all the use case)
#  5 - review delta (1-5)

def approval_program():
    v1_key = Bytes("v1")
    v2_key = Bytes("v2")
    v3_key = Bytes("v3")
    v4_key = Bytes("v4")
    v5_key = Bytes("v5")
    user_type = Bytes("type")
    user_state = Bytes("state")
    lat_key = Bytes("lat")
    lng_key = Bytes("lng")

    buyer_num_orders = Bytes("buyer_orders")
    store_num_orders = Bytes("store_orders")
    couri_num_deliveries = Bytes("couri_deliveries")

    referer = Bytes("referer")

    user_type_val = Btoi(Txn.application_args[1])
    user_type_buyer = Int(1)
    user_type_store = Int(2)
    user_type_courier = Int(3)

    action_store_attest = Bytes("sto_val")
    action_courier_attest = Bytes("cou_val")

    sender_a = Txn.sender()

    @Subroutine(TealType.uint64)
    def on_create():
        on_create_start_time = Btoi(Txn.application_args[0])
        return Seq(
            Assert(
                Global.latest_timestamp() < on_create_start_time
            ),
            Int(1),
        )

    @Subroutine(TealType.uint64)
    def is_creator():
        return If(Txn.sender() == Global.creator_address(), Int(1), Int(0))

    @Subroutine(TealType.uint64)
    def is_sender_user_type(needed_user_type):
        return If(App.localGet(Txn.sender(), user_type) == needed_user_type, Int(1), Int(0))

    @Subroutine(TealType.uint64)
    def is_arg_user_type(arg_pos, needed_user_type):
        return If(Btoi(Txn.application_args[arg_pos]) == needed_user_type, Int(1), Int(0))

    @Subroutine(TealType.uint64)
    def is_addr_user_type(addr, needed_user_type):
        return If(App.localGet(addr, user_type) == needed_user_type, Int(1), Int(0))

    @Subroutine(TealType.uint64)
    def opt_in():
        return If(
            is_arg_user_type(Int(1), user_type_store)
        ).Then(
            Seq(
                App.localPut(sender_a, Bytes("state"), Int(0)),
                App.localPut(sender_a, user_type, user_type_val),
                App.localPut(sender_a, v1_key, Global.zero_address()),
                App.localPut(sender_a, v2_key, Global.zero_address()),
                App.localPut(sender_a, v3_key, Global.zero_address()),
                App.localPut(sender_a, v4_key, Global.zero_address()),
                App.localPut(sender_a, v5_key, Global.zero_address()),
                App.localPut(sender_a, lat_key, Txn.application_args[3]),
                App.localPut(sender_a, lng_key, Txn.application_args[4]),
                If(user_type_val == user_type_buyer).Then(
                    App.localPut(sender_a, buyer_num_orders, Int(1))
                ).ElseIf(user_type_val == user_type_store).Then(
                    App.localPut(sender_a, store_num_orders, Int(5))
                ).ElseIf(user_type_val == user_type_courier).Then(
                    App.localPut(sender_a, couri_num_deliveries, Int(1))
                ),
                App.localPut(sender_a, referer, Txn.application_args[5]),
                Int(1),
            )
        ).ElseIf(
            is_arg_user_type(Int(1), user_type_buyer)
        ).Then(
            Seq(
                App.localPut(sender_a, user_type, Int(1)),
                Int(1),
            )
        ).ElseIf(
            is_arg_user_type(Int(1), user_type_courier)
        ).Then(
            Seq(
                App.localPut(sender_a, user_type, Int(3)),
                App.localPut(sender_a, v1_key, Global.zero_address()),
                Int(1),
            )
        ).Else(
            Int(1)
        )

    @Subroutine(TealType.uint64)
    def store_state(store_addr, buyer_key, buyer_addr, new_state):
        return Seq(
            App.localPut(store_addr, buyer_key, buyer_addr),
            App.localPut(store_addr, user_state, new_state),
            Int(1),
        )

    @Subroutine(TealType.uint64)
    def store_no_dups_buyer(store_addr, buyer_addr):
        return And(
            App.localGet(store_addr, v1_key) != buyer_addr,
            App.localGet(store_addr, v2_key) != buyer_addr,
            App.localGet(store_addr, v3_key) != buyer_addr,
            App.localGet(store_addr, v4_key) != buyer_addr,
            App.localGet(store_addr, v5_key) != buyer_addr,
        )

    @Subroutine(TealType.uint64)
    def has_empty_buyer(store_addr, empty_buyer_addr):
        return Or(
            App.localGet(store_addr, v1_key) == empty_buyer_addr,
            App.localGet(store_addr, v2_key) == empty_buyer_addr,
            App.localGet(store_addr, v3_key) == empty_buyer_addr,
            App.localGet(store_addr, v4_key) == empty_buyer_addr,
            App.localGet(store_addr, v5_key) == empty_buyer_addr,
        )

    @Subroutine(TealType.uint64)
    def is_store_empty(courier_addr, empty_store_addr):
        return If(
            App.localGet(courier_addr, v1_key) == empty_store_addr,
        ).Then(Int(1)).Else(Int(0))

    @Subroutine(TealType.uint64)
    def fill_empty_buyer(store_addr, buyer_addr, empty_buyer_addr):
        return Cond(
            [App.localGet(store_addr, v1_key) == empty_buyer_addr, store_state(store_addr, v1_key, buyer_addr, Int(0))],
            [App.localGet(store_addr, v2_key) == empty_buyer_addr, store_state(store_addr, v2_key, buyer_addr, Int(0))],
            [App.localGet(store_addr, v3_key) == empty_buyer_addr, store_state(store_addr, v3_key, buyer_addr, Int(0))],
            [App.localGet(store_addr, v4_key) == empty_buyer_addr, store_state(store_addr, v4_key, buyer_addr, Int(0))],
            [App.localGet(store_addr, v5_key) == empty_buyer_addr, store_state(store_addr, v5_key, buyer_addr, Int(1))]
        )

    @Subroutine(TealType.uint64)
    def store_validate():
        buyer_addr = Txn.sender()
        store_addr = Txn.application_args[3]
        empty_buyer_addr = Global.zero_address()

        return Cond(
            [And(
                is_addr_user_type(buyer_addr, user_type_buyer),
                is_addr_user_type(store_addr, user_type_store),
                store_no_dups_buyer(store_addr, buyer_addr),
                has_empty_buyer(store_addr, empty_buyer_addr)
            ),fill_empty_buyer(store_addr, buyer_addr, empty_buyer_addr)]
        )

    @Subroutine(TealType.uint64)
    def fill_empty_store(store_addr, buyer_addr, empty_buyer_addr):
        return Cond(
            [App.localGet(store_addr, v1_key) == empty_buyer_addr, store_state(store_addr, v1_key, buyer_addr, Int(0))],
            [App.localGet(store_addr, v2_key) == empty_buyer_addr, store_state(store_addr, v2_key, buyer_addr, Int(0))],
            [App.localGet(store_addr, v3_key) == empty_buyer_addr, store_state(store_addr, v3_key, buyer_addr, Int(0))],
            [App.localGet(store_addr, v4_key) == empty_buyer_addr, store_state(store_addr, v4_key, buyer_addr, Int(0))],
            [App.localGet(store_addr, v5_key) == empty_buyer_addr, store_state(store_addr, v5_key, buyer_addr, Int(1))]
        )

    @Subroutine(TealType.uint64)
    def store_courier_state(courier_addr, store_addr, new_state):
        return Seq(
            App.localPut(courier_addr, v1_key, store_addr),
            App.localPut(courier_addr, user_state, new_state),
            Int(1),
        )        

    @Subroutine(TealType.uint64)
    def courier_validate():
        store_addr = Txn.sender()
        courier_addr = Txn.application_args[3]
        empty_store_addr = Global.zero_address()

        return Cond(
            [And(
                is_addr_user_type(courier_addr, user_type_courier),
                is_addr_user_type(store_addr, user_type_store),
                is_store_empty(courier_addr, empty_store_addr)
            ),store_courier_state(courier_addr, store_addr, Int(1))]
        )

    router = Cond(
        [Txn.application_args[0] == action_store_attest, store_validate()],
        [Txn.application_args[0] == action_courier_attest, courier_validate()],
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create()],
        [Txn.on_completion() == OnComplete.DeleteApplication, Int(0)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Int(0)],
        [Txn.on_completion() == OnComplete.CloseOut, Int(1)],
        [Txn.on_completion() == OnComplete.OptIn, opt_in()],
        [Txn.on_completion() == OnComplete.NoOp, router],
    )

    return program

def clear():
    return Return(Int(1))

if __name__ == "__main__":
    with open("./dist/identity_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=5)
        f.write(compiled)

    with open("./dist/identity_clear_program.teal", "w") as f:
        compiled = compileTeal(clear(), mode=Mode.Application, version=5)
        f.write(compiled)
