import algosdk from "algosdk";
import AlgoClient from "./AlogClient";
import AppArgument from "./types/app/arguments/AppArgument";
import { TransactionBuilder } from "./types/transactions/TransactionBuilder";
import { TransactionWrapperFactory } from "./types/transactions/types";

export default class AlgoAppManager {
  constructor(private readonly algoClient: AlgoClient) {}

  /**
   * Compiles and deploys the provided stateful application
   * @returns An ID of the newly created application
   */
  async create(args: {
    creatorMnemonic: string;
    approvalProgramSource: string;
    clearProgramSource: string;
    localInts: number;
    localBytes: number;
    globalInts: number;
    globalBytes: number;
    appArgs?: AppArgument[];
    accounts?: string[];
    foreignApps?: number[];
    foreignAssets?: number[];
    note?: AppArgument;
    lease?: AppArgument;
    rekeyTo?: string;
    extraPages?: number;
  }): Promise<{ id: number; address: string }> {
    console.time("create app");
    const senderAccount = algosdk.mnemonicToSecretKey(args.creatorMnemonic);
    const [approvalProgram, clearProgram, params] = await Promise.all([
      this.algoClient.compileProgram(args.approvalProgramSource),
      this.algoClient.compileProgram(args.clearProgramSource),
      this.algoClient.getDefaultParams(),
    ]);
    const txn = algosdk.makeApplicationCreateTxn(
      senderAccount.addr,
      params,
      algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram,
      clearProgram,
      args.localInts,
      args.localBytes,
      args.globalInts,
      args.globalBytes,
      args.appArgs?.map((appArg) => appArg.toBinary()),
      args.accounts,
      args.foreignApps,
      args.foreignAssets,
      args.note?.toBinary(),
      args.lease?.toBinary(),
      args.rekeyTo,
      args.extraPages
    );
    await this.algoClient.sendRawTransaction(txn, senderAccount.sk);
    const appId = await this.algoClient.getApplicationId(txn);
    console.timeEnd("create app");
    return {
      id: appId,
      address: algosdk.getApplicationAddress(appId),
    };
  }

  /**
   * Updates an application's approval and clear programs
   */
  async update(args: {
    creatorMnemonic: string;
    appId: number;
    approvalProgramSource: string;
    clearProgramSource: string;
    appArgs?: AppArgument[];
    accounts?: string[];
    foreignApps?: number[];
    foreignAssets?: number[];
    note?: AppArgument;
    lease?: AppArgument;
    rekeyTo?: string;
  }): Promise<void> {
    const [approvalProgram, clearProgram] = await Promise.all([
      this.algoClient.compileProgram(args.approvalProgramSource),
      this.algoClient.compileProgram(args.clearProgramSource),
    ]);
    await this.algoClient.sendTransaction(
      args.creatorMnemonic,
      (fromAddress, params) =>
        algosdk.makeApplicationUpdateTxn(
          fromAddress,
          params,
          args.appId,
          approvalProgram,
          clearProgram,
          args.appArgs?.map((appArg) => appArg.toBinary()),
          args.accounts,
          args.foreignApps,
          args.foreignAssets,
          args.note?.toBinary(),
          args.lease?.toBinary(),
          args.rekeyTo
        )
    );
  }

  /**
   * Calls an app with the provided set of parameters
   */
  async invoke(args: {
    senderMnemonic: string;
    appId: number;
    appArgs?: AppArgument[];
    accounts?: string[];
    foreignApps?: number[];
    foreignAssets?: number[];
    note?: AppArgument;
    lease?: AppArgument;
    rekeyTo?: string;
  }): Promise<void> {
    await this.algoClient.sendTransaction(
      args.senderMnemonic,
      (fromAddress, params) =>
        algosdk.makeApplicationNoOpTxn(
          fromAddress,
          params,
          args.appId,
          args.appArgs?.map((appArg) => appArg.toBinary()),
          args.accounts,
          args.foreignApps,
          args.foreignAssets,
          args.note?.toBinary(),
          args.lease?.toBinary(),
          args.rekeyTo
        )
    );
  }

  /**
   * Opts in to use an application
   */
  async optIn(args: {
    senderMnemonic: string;
    appId: number;
    appArgs?: AppArgument[];
    accounts?: string[];
    foreignApps?: number[];
    foreignAssets?: number[];
    note?: AppArgument;
    lease?: AppArgument;
    rekeyTo?: string;
  }): Promise<void> {
    await this.algoClient.sendTransaction(
      args.senderMnemonic,
      (fromAddress, params) =>
        algosdk.makeApplicationOptInTxn(
          fromAddress,
          params,
          args.appId,
          args.appArgs?.map((appArg) => appArg.toBinary()),
          args.accounts,
          args.foreignApps,
          args.foreignAssets,
          args.note?.toBinary(),
          args.lease?.toBinary(),
          args.rekeyTo
        )
    );
  }

  /**
   * Make a transaction that deletes an application
   */
  async delete(args: {
    creatorMnemonic: string;
    appId: number;
    appArgs?: AppArgument[];
    accounts?: string[];
    foreignApps?: number[];
    foreignAssets?: number[];
    note?: AppArgument;
    lease?: AppArgument;
    rekeyTo?: string;
  }): Promise<void> {
    await this.algoClient.sendTransaction(
      args.creatorMnemonic,
      (fromAddress, params) =>
        algosdk.makeApplicationDeleteTxn(
          fromAddress,
          params,
          args.appId,
          args.appArgs?.map((appArg) => appArg.toBinary()),
          args.accounts,
          args.foreignApps,
          args.foreignAssets,
          args.note?.toBinary(),
          args.lease?.toBinary(),
          args.rekeyTo
        )
    );
  }

  createAppInvokeTransaction(args: {
    senderMnemonic: string;
    appId: number;
    appArgs?: AppArgument[];
    accounts?: string[];
    foreignApps?: number[];
    foreignAssets?: number[];
    note?: AppArgument;
    lease?: AppArgument;
    rekeyTo?: string;
  }): TransactionWrapperFactory {
    return new TransactionBuilder(args.senderMnemonic, (fromAddress, params) =>
      algosdk.makeApplicationNoOpTxn(
        fromAddress,
        params,
        args.appId,
        args.appArgs?.map((appArg) => appArg.toBinary()),
        args.accounts,
        args.foreignApps,
        args.foreignAssets,
        args.note?.toBinary(),
        args.lease?.toBinary(),
        args.rekeyTo
      )
    );
  }
}
