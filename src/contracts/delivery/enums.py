from pyteal import TealType, Int, Bytes

class ActionType:
    """ ActionType the list of supported actions """
    COMPLETE_ORDER: TealType.bytes = Bytes("COMPLETE_ORDER")
    DELIVERED: TealType.bytes = Bytes("DELIVERED")
    CLAIM_FUNDS: TealType.bytes = Bytes("CLAIM_FUNDS")
    ASA_OPT_IN: TealType.bytes = Bytes("ASA_OPT_IN")
    START_DISPUTE: TealType.bytes = Bytes("START_DISPUTE")

class OrderStatus:
    PENDING_DELIVERY: TealType.uint64 = Int(1)
    DELIVERED: TealType.uint64 = Int(2)
    DISPUTE: TealType.uint64 = Int(3)
    COMPLETED: TealType.uint64 = Int(4)

class AppParams:
    ASA_ID: TealType.uint64 = Int(1)
    ACCEPT_DELIVERY_WINDOW: TealType.uint64 = Int(30) # seconds
    ACTION_TYPE_PARAM_INDEX = 0
    COURIER_ADDRESS_INDEX = 0
    RESTAURANT_ADDRESS_INDEX = 1
    COURIER_REWARD_AMOUNT_INDEX = 2

class GlobalState:
    """ wrapper class for access to predetermined Global State properties"""
    class Schema:
        """ Global State Schema """
        NUM_UINTS: TealType.uint64 = Int(3)
        NUM_BYTESLICES: TealType.uint64 = Int(2)

    class Variables:
        """ Global State Variables """
        COURIER_ADDRESS: TealType.bytes = Bytes("courierAddr")
        RESTAURANT_ADDRESS: TealType.bytes = Bytes("restaurantAddr")
        DELIVERED_TIMESTAMP: TealType.bytes = Bytes("deliveredTime")
        COURIER_REWARD_AMOUNT: TealType.bytes = Bytes("courierRewardAmount")
        ORDER_STATUS: TealType.bytes = Bytes("orderStatus")
