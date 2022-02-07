import { mnemonicToSecretKey } from "algosdk";
import AlgoAppManager from "../../algo/AlgoAppManager";
import AlgoClient from "../../algo/AlogClient";
import StringAppArgument from "../../algo/types/app/arguments/StringAppArgument";
import { DeliveryActionType } from "./types";

export default class CourierDeliveryClient {
  private readonly algoAppManager: AlgoAppManager;

  constructor(
    algoClient: AlgoClient,
    private readonly appId: number,
    private readonly courierMnemonic: string,
    private readonly customerAddress: string,
    private readonly merchantAddress: string,
    private readonly tipsAsaId: number
  ) {
    this.algoAppManager = new AlgoAppManager(algoClient);
  }

  async pickUpOrder(): Promise<void> {
    const actionType: DeliveryActionType = "PICK_UP_ORDER";
    await this.algoAppManager.invoke({
      senderMnemonic: this.courierMnemonic,
      appId: this.appId,
      appArgs: [new StringAppArgument(actionType)],
    });
  }

  async delivered(): Promise<void> {
    const actionType: DeliveryActionType = "DELIVERED";
    await this.algoAppManager.invoke({
      senderMnemonic: this.courierMnemonic,
      appId: this.appId,
      appArgs: [new StringAppArgument(actionType)],
    });
  }

  async claimFunds(): Promise<void> {
    const courierAccount = mnemonicToSecretKey(this.courierMnemonic);
    const actionType: DeliveryActionType = "CLAIM_FUNDS";
    await this.algoAppManager.invoke({
      senderMnemonic: this.courierMnemonic,
      appId: this.appId,
      appArgs: [new StringAppArgument(actionType)],
      foreignAssets: [this.tipsAsaId],
      accounts: [courierAccount.addr, this.merchantAddress],
    });
  }

  async cancelOrder(): Promise<void> {
    const actionType: DeliveryActionType = "CANCEL";
    await this.algoAppManager.invoke({
      senderMnemonic: this.courierMnemonic,
      appId: this.appId,
      appArgs: [new StringAppArgument(actionType)],
      foreignAssets: [this.tipsAsaId],
      accounts: [this.customerAddress],
    });
  }
}
