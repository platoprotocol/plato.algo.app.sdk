import algosdk from "algosdk";
import AlgoClient from "./AlogClient";
import StringAppArgument from "./types/app/arguments/StringAppArgument";

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
}
