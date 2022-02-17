from pyteal import *


def approval_program():
    account_key = Bytes("account")
    plto_id = Bytes("plto_id")
    id_app_id = Bytes("id_app")

    user_type_eater = Int(1)
    user_type_store = Int(2)
    user_type_courier = Int(3)

    # Issue reward
    @Subroutine(TealType.none)
    def issueReward(assetID: Expr, account: Expr, amount: Expr) -> Expr:
        return Seq(
                    InnerTxnBuilder.Begin(),
                    InnerTxnBuilder.SetFields(
                        {
                            TxnField.type_enum: TxnType.AssetTransfer,
                            TxnField.xfer_asset: assetID,
                            TxnField.asset_amount: amount,
                            TxnField.asset_receiver: account,
                        }
                    ),
                    InnerTxnBuilder.Submit(),
                )

    ## optInPLTO logic (opt-in to PLTO asset)
    # Foreign assets:
    # [0]: PLTO asset ID
    @Subroutine(TealType.uint64)
    def optInPLTO() -> Expr:
        return Seq(
                    InnerTxnBuilder.Begin(),
                    InnerTxnBuilder.SetFields(
                        {
                            TxnField.type_enum: TxnType.AssetTransfer,
                            TxnField.xfer_asset: Txn.assets[0],
                            TxnField.asset_amount: Int(0),
                            TxnField.asset_receiver: Global.current_application_address(),
                        }
                    ),
                    InnerTxnBuilder.Submit(),
                    Int(1),
                )

    # Pull count reward count from account local storage on id app
    @Subroutine(TealType.uint64)
    def getRewardNum(account: Expr, id_app: Expr, tracker_type: Expr) -> Expr:
        query= App.localGetEx(account, Btoi(id_app), tracker_type)
        return Seq(
                    query,
                    Assert(query.hasValue()),
                    query.value()
                )

    # Pull next milestone count from account local storage on id app
    @Subroutine(TealType.uint64)
    def getRewardNext(account: Expr, id_app: Expr, tracker_type: Expr) -> Expr:
        return If(tracker_type == Bytes("buyer_orders")).Then(
            Int(1)
        ).ElseIf(tracker_type == Bytes("store_orders")).Then(
            Int(5)
        ).ElseIf(tracker_type == Bytes("couri_deliveries")).Then(
            Int(1)
        )

    

    # Return reward amount owed to the given account (0 if milestone not met)
    @Subroutine(TealType.uint64)
    def getRewardAmount(account: Expr, tracker_type: Expr, reward_type: Expr, id_app: Expr) -> Expr:
        current_progress = getRewardNum(account, id_app, tracker_type)
        next_reward = getRewardNext(account, id_app, tracker_type)
        return If(
            And(current_progress == next_reward, next_reward != Int(0))).Then(
                If(reward_type == Bytes("eater_referral")).Then(
                    Int(10)
                ).ElseIf(reward_type == Bytes("resto_referral")).Then(
                    Int(50)
                ).ElseIf(reward_type == Bytes("courier_referral")).Then(
                    Int(25)
                ).Else(
                    Int(0) # If the reward type does not match anything, return 0
                )
            ).Else(
                Int(0) # If reward milestone is not met, return 0
            )


    ## on_create logic (creation steps)
    # Creation application args:
    # [0]: account address
    # [1]: PLTO asset ID
    # [2]: create time
    # [3]: identity contract app ID 
    @Subroutine(TealType.uint64)
    def on_create():
        on_create_start_time = Btoi(Txn.application_args[2])
        return Seq(
            App.globalPut(account_key, Txn.application_args[0]),
            App.globalPut(plto_id, Txn.assets[0]),
            App.globalPut(id_app_id, Txn.application_args[3]),
            Assert(Global.latest_timestamp() < on_create_start_time),
            Int(1),
            )

    ## on_optin logic (account opt-in)
    # Creation application args:
    # [0]: account address
    # [1]: create time
    @Subroutine(TealType.uint64)
    def opt_in():
        return Int(1)

    # on_check logic (when prompted to consider reward status)
    # Application args:
    # [0]: method to run
    # [1]: account address
    # [2]: referred account address
    # [3]: create time 
    # [4]: reward type
    @Subroutine(TealType.uint64)
    def on_check():
        account_key = Txn.application_args[1]
        ref_account_key = Txn.accounts[0]
        account_type_query = App.localGetEx(ref_account_key, Btoi(App.globalGet(id_app_id)), Bytes("type"))
        account_type = Seq(
                    account_type_query,
                    Assert(account_type_query.hasValue()),
                    account_type_query.value()
                )

        tracker_type = If(
            account_type == Int(1)
        ).Then(
            Bytes("buyer_orders")
        ).ElseIf(
            account_type == Int(2)
        ).Then(
            Bytes("store_orders")
        ).ElseIf(
            account_type == Int(3)
        ).Then(
            Bytes("couri_deliveries")
        )
        reward_type = Txn.application_args[4]
        reward_amount = getRewardAmount(account_key, tracker_type, reward_type, App.globalGet(id_app_id))

        # account_key_query = App.localGetEx(ref_account_key, Btoi(App.globalGet(id_app_id)), Bytes("referer"))
        # account_key_check = Seq(
        #             account_key_query,
        #             Assert(account_key_query.hasValue()),
        #             account_key_query.value()
        #         )

        return Seq(
            # Assert(account_key == account_key_check),
            If(
                reward_amount > Int(0)
            ).Then(
                Seq(
                    issueReward(App.globalGet(plto_id), account_key, reward_amount),
                    Int(1)
                )
            ).Else(
                Int(0)
            ),
        )
            

    ## on_active logic (for testing)
    # Application args:
    # [0]: method to run
    # [1]: account address
    # [2]: account type (1:buyer, 2:store, 3:courier)
    # [3]: create time 
    @Subroutine(TealType.uint64)
    def on_active():
        account_type = Btoi(Txn.application_args[2])
        return If(
            account_type == user_type_courier
        ).Then(
            Int(3)
        ).ElseIf(
            account_type == user_type_eater
        ).Then(
            Int(1)
        ).ElseIf(
            account_type == user_type_store
        ).Then(
            Int(2)
        ).Else(
            Int(0)
        )

    # Router
    on_call_method = Txn.application_args[0]
    on_call = Cond(
        [on_call_method == Bytes("check_reward"), on_check()],
        [on_call_method == Bytes("check_active"), on_active()],
        [on_call_method == Bytes("asset_opt_in"), optInPLTO()],
        # Can add more branches for other methods
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create()],
        [Txn.on_completion() == OnComplete.NoOp, on_call],
        [Txn.on_completion() == OnComplete.OptIn, opt_in()],
        [Txn.on_completion() == OnComplete.DeleteApplication, Int(0)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Int(0)],
        [Txn.on_completion() == OnComplete.CloseOut, Int(1)],
    )

    return program


def clear_state_program():
    return Approve()

if __name__ == "__main__":
    with open("./dist/rewards_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=5)
        f.write(compiled)

    with open("./dist/rewards_clear_state.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=5)
        f.write(compiled)