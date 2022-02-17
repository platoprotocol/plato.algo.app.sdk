import {
  ALGORAND_MIN_TX_FEE,
  getApplicationAddress,
  mnemonicToSecretKey,
} from "algosdk";
import { promises as fs } from "fs";
import AlgoMonetaryManager from "../../algo/AlgoMonetaryManager";
import AlgoAppManager from "../../algo/AlgoAppManager";
import AddressAppArgument from "../../algo/types/app/arguments/AddressAppArgument";
import NumberAppArgument from "../../algo/types/app/arguments/NumberAppArgument";
import StringAppArgument from "../../algo/types/app/arguments/StringAppArgument";
import AlgoClient from "../../algo/AlogClient";
import { ALGO_MIN_ACCOUNT_BALANCE } from "../../algo/constants";
import { TransactionWrapperFactory } from "../../algo/types/transactions/types";
import { StateSchema } from "../../algo/types/app/types";
import { getFutureTime } from "../../utils/date";
import { RewardActionType, RewardType } from "./types";

const APPROVAL_PROGRAM_FILE_PATH = "../../../dist/rewards_approval.teal";
const CLEAR_PROGRAM_FILE_PATH = "../../../dist/rewards_clear_state.teal";

export default class RewardClient {
  private readonly algoAppManager: AlgoAppManager;
  private readonly algoMonetaryManager: AlgoMonetaryManager;

  constructor(
    private readonly algoClient: AlgoClient,
    private readonly appId: number,
    private readonly platoAsaId: number
  ) {
    this.algoAppManager = new AlgoAppManager(algoClient);
    this.algoMonetaryManager = new AlgoMonetaryManager(algoClient);
  }

  get applicationId(): number {
    return this.appId;
  }

  get applicationAddress(): string {
    return getApplicationAddress(this.appId);
  }

  static async deploy(
    algoClient: AlgoClient,
    ownerMnemonic: string,
    identityAppId: number,
    platoAsaId: number,
    initialPlatoAsaAmount: number,
    initialAlgoAmount: number
  ): Promise<{ id: number }> {
    const algoAppManager = new AlgoAppManager(algoClient);
    const [approvalProgramSource, clearProgramSource] = await Promise.all([
      fs.readFile(APPROVAL_PROGRAM_FILE_PATH, "utf8"),
      fs.readFile(CLEAR_PROGRAM_FILE_PATH, "utf8"),
    ]);
    const localState: StateSchema = { ints: 0, bytes: 0 };
    const globalState: StateSchema = { ints: 3, bytes: 3 };
    const { addr: ownerAddress } = mnemonicToSecretKey(ownerMnemonic);
    const startTime = getFutureTime();
    const appArgs = [
      new AddressAppArgument(ownerAddress),
      new NumberAppArgument(platoAsaId),
      new NumberAppArgument(startTime),
      new NumberAppArgument(identityAppId),
    ];
    const appInfo = await algoAppManager.create({
      creatorMnemonic: ownerMnemonic,
      approvalProgramSource,
      clearProgramSource,
      localState,
      globalState,
      appArgs,
      foreignAssets: [platoAsaId],
    });
    const app = new RewardClient(algoClient, appInfo.id, platoAsaId);
    await app.fundApp(
      ownerMnemonic,
      platoAsaId,
      initialPlatoAsaAmount,
      initialAlgoAmount
    );
    return { id: appInfo.id };
  }

  private async fundApp(
    userMnemonic: string,
    platoAsaId: number,
    initialPlatoAsaAmount: number,
    initialAlgoAmount: number
  ): Promise<void> {
    const numberOfInternalAppTransactions = 3;
    const numberOfHoldingAssets = 2; // Algo Coin + Plato token
    const transactionFees =
      numberOfInternalAppTransactions * ALGORAND_MIN_TX_FEE;
    const minAlgoBalance =
      ALGO_MIN_ACCOUNT_BALANCE * numberOfHoldingAssets + transactionFees;
    if (initialAlgoAmount < minAlgoBalance) {
      throw new Error(
        `initialAlgoAmount should not be less than ${minAlgoBalance} microAlgos.`
      );
    }
    if (initialPlatoAsaAmount < 0) {
      throw new Error(`initialAsaAmount is required`);
    }
    const { addr: userAddress } = mnemonicToSecretKey(userMnemonic);
    const accountInfo = await this.algoClient.accountInformation(userAddress);
    if (accountInfo.amount < minAlgoBalance) {
      throw new Error(
        `Owner account has insufficient Algos. Minimum account balance${minAlgoBalance} microAlgos`
      );
    }
    const algoTransferTxn =
      this.algoMonetaryManager.createAlgoTransferTransaction(
        userMnemonic,
        this.applicationAddress,
        initialAlgoAmount
      );
    const optInAsaTxn = this.createOptInAsaTransaction(
      userMnemonic,
      platoAsaId
    );
    const asaTransferTxn =
      this.algoMonetaryManager.createAssetTransferTransaction(
        userMnemonic,
        this.applicationAddress,
        platoAsaId,
        initialPlatoAsaAmount
      );
    await this.algoClient.sendAtomicTransaction(
      algoTransferTxn,
      optInAsaTxn,
      asaTransferTxn
    );
  }

  async checkCustomerReward(
    customerMnemonic: string,
    merchantAddress: string,
    identityAppId: number
  ): Promise<void> {
    const actionType: RewardActionType = "check_reward";
    const rewardType: RewardType = "resto_referral";
    const { addr: customerAddress } = mnemonicToSecretKey(customerMnemonic);
    const startTime = getFutureTime();
    await this.algoAppManager.invoke({
      senderMnemonic: customerMnemonic,
      appId: this.appId,
      appArgs: [
        new StringAppArgument(actionType),
        new AddressAppArgument(customerAddress),
        new AddressAppArgument(merchantAddress),
        new NumberAppArgument(startTime),
        new StringAppArgument(rewardType),
      ],
      accounts: [merchantAddress],
      foreignApps: [identityAppId],
      foreignAssets: [this.platoAsaId],
    });
  }

  private createOptInAsaTransaction(
    ownerMnemonic: string,
    asaId: number
  ): TransactionWrapperFactory {
    const actionType: RewardActionType = "asset_opt_in";
    return this.algoAppManager.createAppInvokeTransaction({
      senderMnemonic: ownerMnemonic,
      appId: this.appId,
      appArgs: [new StringAppArgument(actionType)],
      foreignAssets: [asaId],
    });
  }
}
