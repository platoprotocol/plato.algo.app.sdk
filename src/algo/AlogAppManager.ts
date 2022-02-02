import algosdk from "algosdk";
import AlgoClient from "./AlogClient";
import AppArgument from "./types/app/arguments/AppArgument";

export default class AlogAppManager {
  constructor(private readonly algoClient: AlgoClient) {}

  /**
   * Compiles and deploys the provided stateful application
   * @returns An ID of the newly created application
   */
  async create(
    creatorMnemonic: string,
    approvalProgramSource: string,
    clearProgramSource: string,
    localInts: number,
    localBytes: number,
    globalInts: number,
    globalBytes: number,
    appArgs?: AppArgument[],
    accounts?: string[],
    foreignApps?: number[],
    foreignAssets?: number[],
    note?: AppArgument,
    lease?: AppArgument,
    rekeyTo?: string,
    extraPages?: number
  ): Promise<{ id: number; address: string }> {
    const senderAccount = algosdk.mnemonicToSecretKey(creatorMnemonic);
    const [approvalProgram, clearProgram, params] = await Promise.all([
      this.algoClient.compileProgram(approvalProgramSource),
      this.algoClient.compileProgram(clearProgramSource),
      this.algoClient.getDefaultParams(),
    ]);
    const txn = algosdk.makeApplicationCreateTxn(
      senderAccount.addr,
      params,
      algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram,
      clearProgram,
      localInts,
      localBytes,
      globalInts,
      globalBytes,
      appArgs?.map((appArg) => appArg.toBinary()),
      accounts,
      foreignApps,
      foreignAssets,
      note?.toBinary(),
      lease?.toBinary(),
      rekeyTo,
      extraPages
    );
    await this.algoClient.sendRawTransaction(txn, senderAccount.sk);
    const appId = await this.algoClient.getApplicationId(txn);
    return {
      id: appId,
      address: algosdk.getApplicationAddress(appId),
    };
  }

  /**
   * Updates an application's approval and clear programs
   */
  async update(
    creatorMnemonic: string,
    appId: number,
    approvalProgramSource: string,
    clearProgramSource: string,
    appArgs?: AppArgument[],
    accounts?: string[],
    foreignApps?: number[],
    foreignAssets?: number[],
    note?: AppArgument,
    lease?: AppArgument,
    rekeyTo?: string
  ): Promise<void> {
    const [approvalProgram, clearProgram] = await Promise.all([
      this.algoClient.compileProgram(approvalProgramSource),
      this.algoClient.compileProgram(clearProgramSource),
    ]);
    await this.algoClient.sendTransaction(
      creatorMnemonic,
      (fromAddress, params) =>
        algosdk.makeApplicationUpdateTxn(
          fromAddress,
          params,
          appId,
          approvalProgram,
          clearProgram,
          appArgs?.map((appArg) => appArg.toBinary()),
          accounts,
          foreignApps,
          foreignAssets,
          note?.toBinary(),
          lease?.toBinary(),
          rekeyTo
        )
    );
  }

  /**
   * Calls an app with the provided set of parameters
   * @param senderMnemonic
   * @param appId
   * @param appArgs
   * @param accounts
   * @param foreignApps
   * @param foreignAssets
   * @param note
   * @param lease
   * @param rekeyTo
   */
  async invoke(
    senderMnemonic: string,
    appId: number,
    appArgs?: AppArgument[],
    accounts?: string[],
    foreignApps?: number[],
    foreignAssets?: number[],
    note?: AppArgument,
    lease?: AppArgument,
    rekeyTo?: string
  ): Promise<void> {
    await this.algoClient.sendTransaction(
      senderMnemonic,
      (fromAddress, params) =>
        algosdk.makeApplicationNoOpTxn(
          fromAddress,
          params,
          appId,
          appArgs?.map((appArg) => appArg.toBinary()),
          accounts,
          foreignApps,
          foreignAssets,
          note?.toBinary(),
          lease?.toBinary(),
          rekeyTo
        )
    );
  }

  /**
   * Opts in to use an application
   */
  async optIn(
    senderMnemonic: string,
    appId: number,
    appArgs?: AppArgument[],
    accounts?: string[],
    foreignApps?: number[],
    foreignAssets?: number[],
    note?: AppArgument,
    lease?: AppArgument,
    rekeyTo?: string
  ): Promise<void> {
    await this.algoClient.sendTransaction(
      senderMnemonic,
      (fromAddress, params) =>
        algosdk.makeApplicationOptInTxn(
          fromAddress,
          params,
          appId,
          appArgs?.map((appArg) => appArg.toBinary()),
          accounts,
          foreignApps,
          foreignAssets,
          note?.toBinary(),
          lease?.toBinary(),
          rekeyTo
        )
    );
  }

  /**
   * Make a transaction that deletes an application
   */
  async delete(
    senderMnemonic: string,
    appId: number,
    appArgs?: AppArgument[],
    accounts?: string[],
    foreignApps?: number[],
    foreignAssets?: number[],
    note?: AppArgument,
    lease?: AppArgument,
    rekeyTo?: string
  ): Promise<void> {
    await this.algoClient.sendTransaction(
      senderMnemonic,
      (fromAddress, params) =>
        algosdk.makeApplicationDeleteTxn(
          fromAddress,
          params,
          appId,
          appArgs?.map((appArg) => appArg.toBinary()),
          accounts,
          foreignApps,
          foreignAssets,
          note?.toBinary(),
          lease?.toBinary(),
          rekeyTo
        )
    );
  }
}
