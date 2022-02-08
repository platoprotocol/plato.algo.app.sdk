import algosdk from "algosdk";
import AlgoClient from "./AlogClient";
import StringAppArgument from "./types/app/arguments/StringAppArgument";
import { TransactionBuilder } from "./types/transactions/TransactionBuilder";
import { TransactionWrapperFactory } from "./types/transactions/types";

/**
 * Minimum account balance of microAlgos on Algorand.
 */
export const ALGO_MIN_ACCOUNT_BALANCE = 100000;

export default class AlgoMonetaryManager {
  constructor(private readonly algoClient: AlgoClient) {}

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
