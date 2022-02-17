import { ALGORAND_MIN_TX_FEE, getApplicationAddress } from "algosdk";
import { promises as fs } from "fs";
import AlgoMonetaryManager from "../../algo/AlgoMonetaryManager";
import AlgoAppManager from "../../algo/AlgoAppManager";
import AddressAppArgument from "../../algo/types/app/arguments/AddressAppArgument";
import NumberAppArgument from "../../algo/types/app/arguments/NumberAppArgument";
import { DeliveryActionType } from "./types";
import StringAppArgument from "../../algo/types/app/arguments/StringAppArgument";
import AlgoClient from "../../algo/AlogClient";
import { TransactionWrapperFactory } from "../../algo/types/transactions/types";
import { StateSchema } from "../../algo/types/app/types";
import { ALGO_MIN_ACCOUNT_BALANCE } from "../../algo/constants";

const APPROVAL_PROGRAM_FILE_PATH = "./dist/escrow_approval.teal";
const CLEAR_PROGRAM_FILE_PATH = "./dist/escrow_clear_program.teal";

export default class CustomerDeliveryClient {
  private readonly algoAppManager: AlgoAppManager;

  constructor(
    algoClient: AlgoClient,
    private readonly appId: number,
    private readonly customerMnemonic: string,
    private readonly merchantAddress: string,
    private readonly courierAddress: string,
    private readonly tipsAsaId: number
  ) {
    this.algoAppManager = new AlgoAppManager(algoClient);
  }

  get applicationId(): number {
    return this.appId;
  }

  get escrowAddress(): string {
    return getApplicationAddress(this.appId);
  }

  static async deploy(
    algoClient: AlgoClient,
    customerMnemonic: string,
    merchantAddress: string,
    courierAddress: string,
    orderTotalPrice: number,
    courierRewardAmount: number,
    tips: { amount: number; asaId: number }
  ): Promise<CustomerDeliveryClient> {
    if (orderTotalPrice <= 0) {
      throw new Error("orderTotalPrice should be greater than zero");
    }
    if (courierRewardAmount <= 0) {
      throw new Error("courierRewardAmount should be greater than zero");
    }
    if (courierRewardAmount >= orderTotalPrice) {
      throw new Error(
        "orderTotalPrice should be greater than courierRewardAmount"
      );
    }
    const algoAppManager = new AlgoAppManager(algoClient);
    const algoMonetaryManager = new AlgoMonetaryManager(algoClient);
    const [approvalProgramSource, clearProgramSource] = await Promise.all([
      fs.readFile(APPROVAL_PROGRAM_FILE_PATH, "utf8"),
      fs.readFile(CLEAR_PROGRAM_FILE_PATH, "utf8"),
    ]);
    const localState: StateSchema = { ints: 0, bytes: 0 };
    const globalState: StateSchema = { ints: 3, bytes: 2 };
    const numberOfInternalAppTransactions = 3;
    const numberOfHoldingAssets = 2; // Algo Coin + Plato token
    const appArgs = [
      new AddressAppArgument(courierAddress),
      new AddressAppArgument(merchantAddress),
      new NumberAppArgument(courierRewardAmount),
    ];
    const escrow = await algoAppManager.create({
      creatorMnemonic: customerMnemonic,
      approvalProgramSource,
      clearProgramSource,
      localState,
      globalState,
      appArgs,
    });
    const app = new CustomerDeliveryClient(
      algoClient,
      escrow.id,
      customerMnemonic,
      merchantAddress,
      courierAddress,
      tips.asaId
    );
    const minAccountBalance = ALGO_MIN_ACCOUNT_BALANCE * numberOfHoldingAssets;
    const transactionFees =
      numberOfInternalAppTransactions * ALGORAND_MIN_TX_FEE;
    const escrowBalance = minAccountBalance + transactionFees + orderTotalPrice;
    const algoTransferTxn = algoMonetaryManager.createAlgoTransferTransaction(
      customerMnemonic,
      escrow.address,
      escrowBalance
    );
    const optInAsaTxn = app.createOptInAsaTransaction();
    const asaTransferTxn = algoMonetaryManager.createAssetTransferTransaction(
      customerMnemonic,
      escrow.address,
      tips.asaId,
      tips.amount
    );
    await algoClient.sendAtomicTransaction(
      algoTransferTxn,
      optInAsaTxn,
      asaTransferTxn
    );
    return app;
  }

  async completeOrder(): Promise<void> {
    const actionType: DeliveryActionType = "COMPLETE_ORDER";
    await this.algoAppManager.invoke({
      senderMnemonic: this.customerMnemonic,
      appId: this.appId,
      appArgs: [new StringAppArgument(actionType)],
      foreignAssets: [this.tipsAsaId],
      accounts: [this.courierAddress, this.merchantAddress],
    });
  }

  async cancelOrder(): Promise<void> {
    const actionType: DeliveryActionType = "CANCEL";
    await this.algoAppManager.invoke({
      senderMnemonic: this.customerMnemonic,
      appId: this.appId,
      appArgs: [new StringAppArgument(actionType)],
      foreignAssets: [this.tipsAsaId],
    });
  }
  async startDispute(): Promise<void> {
    const actionType: DeliveryActionType = "START_DISPUTE";
    await this.algoAppManager.invoke({
      senderMnemonic: this.customerMnemonic,
      appId: this.appId,
      appArgs: [new StringAppArgument(actionType)],
    });
  }

  private createOptInAsaTransaction(): TransactionWrapperFactory {
    const actionType: DeliveryActionType = "ASA_OPT_IN";
    return this.algoAppManager.createAppInvokeTransaction({
      senderMnemonic: this.customerMnemonic,
      appId: this.appId,
      appArgs: [new StringAppArgument(actionType)],
      foreignAssets: [this.tipsAsaId],
    });
  }
}
