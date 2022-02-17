import algosdk from "algosdk";
import AlgoClient from "./AlogClient";
import StringAppArgument from "./types/app/arguments/StringAppArgument";
import { TransactionBuilder } from "./types/transactions/TransactionBuilder";
import { TransactionWrapperFactory } from "./types/transactions/types";

export default class AlgoMonetaryManager {
  constructor(private readonly algoClient: AlgoClient) {}

  async createAsset(args: {
    ownerMnemonic: string;
    total: number | bigint;
    note?: string;
    decimals: number;
    defaultFrozen: boolean;
    manager?: string;
    reserve?: string;
    freeze?: string;
    clawback?: string;
    unitName?: string;
    assetName?: string;
    assetURL?: string;
    assetMetadataHash?: string | Uint8Array;
    rekeyTo?: string;
  }): Promise<number> {
    const ownerAccount = algosdk.mnemonicToSecretKey(args.ownerMnemonic);
    const suggestedParams = await this.algoClient.getDefaultParams();
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: ownerAccount.addr,
      note: args.note ? new StringAppArgument(args.note).toBinary() : undefined,
      total: args.total,
      decimals: args.decimals,
      defaultFrozen: args.defaultFrozen,
      manager: args.manager,
      reserve: args.reserve,
      freeze: args.freeze,
      clawback: args.clawback,
      unitName: args.unitName,
      assetName: args.assetName,
      assetURL: args.assetURL,
      assetMetadataHash: args.assetMetadataHash,
      rekeyTo: args.rekeyTo,
      suggestedParams,
    });
    await this.algoClient.sendRawTransaction(txn, ownerAccount.sk);
    return this.algoClient.getAssetId(txn);
  }

  async assetOptIn(senderMnemonic: string, assetId: number): Promise<void> {
    const senderAccount = algosdk.mnemonicToSecretKey(senderMnemonic);
    await this.assetTransfer(senderMnemonic, senderAccount.addr, assetId, 0);
  }

  async assetTransfer(
    senderMnemonic: string,
    receiverAddress: string,
    assetId: number,
    amount: number,
    closeRemainderToAddress?: string,
    note?: string,
    rekeyTo?: string,
    revocationTarget?: string
  ): Promise<void> {
    await this.algoClient.sendTransaction(
      senderMnemonic,
      (fromAddress, params) =>
        algosdk.makeAssetTransferTxnWithSuggestedParams(
          fromAddress,
          receiverAddress,
          closeRemainderToAddress,
          revocationTarget,
          amount,
          note ? new StringAppArgument(note).toBinary() : undefined,
          assetId,
          params,
          rekeyTo
        )
    );
  }

  async algoTransfer(
    senderMnemonic: string,
    receiverAddress: string,
    amount: number,
    closeRemainderToAddress?: string,
    note?: string,
    rekeyTo?: string
  ): Promise<void> {
    await this.algoClient.sendTransaction(
      senderMnemonic,
      (fromAddress, params) =>
        algosdk.makePaymentTxnWithSuggestedParams(
          fromAddress,
          receiverAddress,
          amount,
          closeRemainderToAddress,
          note ? new StringAppArgument(note).toBinary() : undefined,
          params,
          rekeyTo
        )
    );
  }

  createAssetTransferTransaction(
    senderMnemonic: string,
    receiverAddress: string,
    assetId: number,
    amount: number,
    closeRemainderToAddress?: string,
    note?: string,
    rekeyTo?: string,
    revocationTarget?: string
  ): TransactionWrapperFactory {
    return new TransactionBuilder(senderMnemonic, (fromAddress, params) =>
      algosdk.makeAssetTransferTxnWithSuggestedParams(
        fromAddress,
        receiverAddress,
        closeRemainderToAddress,
        revocationTarget,
        amount,
        note ? new StringAppArgument(note).toBinary() : undefined,
        assetId,
        params,
        rekeyTo
      )
    );
  }

  createAlgoTransferTransaction(
    senderMnemonic: string,
    receiverAddress: string,
    amount: number,
    closeRemainderToAddress?: string,
    note?: string,
    rekeyTo?: string
  ): TransactionWrapperFactory {
    return new TransactionBuilder(senderMnemonic, (fromAddress, params) =>
      algosdk.makePaymentTxnWithSuggestedParams(
        fromAddress,
        receiverAddress,
        amount,
        closeRemainderToAddress,
        note ? new StringAppArgument(note).toBinary() : undefined,
        params,
        rekeyTo
      )
    );
  }
}
