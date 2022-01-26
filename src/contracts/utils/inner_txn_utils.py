from pyteal import *

@Subroutine(TealType.none)
def inner_asset_opt_in(asset_id: TealType.uint64, asset_receiver: TealType.bytes) -> Expr:
    return Seq([
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            #TxnField.note: Bytes("TUT_ITXN_AT"),
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.asset_amount: Int(0),
            TxnField.xfer_asset: asset_id,
            TxnField.asset_receiver: asset_receiver
            }),
        InnerTxnBuilder.Submit()
    ])

@Subroutine(TealType.none)
def inner_asset_transfer_txn(
    asset_id: TealType.uint64,
    asset_amount: TealType.uint64,
    asset_receiver: TealType.bytes,
    close_to: TealType.bytes):
    return Seq([
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: asset_id,
            TxnField.asset_amount: asset_amount,
            TxnField.asset_receiver: asset_receiver,
            TxnField.asset_close_to: close_to
            }),
        InnerTxnBuilder.Submit()
    ])

@Subroutine(TealType.none)
def inner_payment_txn(
    amount: TealType.uint64,
    receiver: TealType.bytes,
    close_to: TealType.bytes):
    return Seq([
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.amount: amount,
            TxnField.receiver: receiver,
            TxnField.close_remainder_to: close_to
            }),
        InnerTxnBuilder.Submit()
    ])
