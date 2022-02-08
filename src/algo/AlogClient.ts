import {
  ALGORAND_MIN_TX_FEE,
  Algodv2,
  assignGroupID,
  SuggestedParams,
  Transaction,
  waitForConfirmation,
  mnemonicToSecretKey,
} from "algosdk";
import { TransactionWrapperFactory } from "./types/transactions/types";

const MAX_WAIT_ROUNDS = 4;

export default class AlgoClient {
  private readonly client: Algodv2;

  constructor(
    hostUrl = "http://localhost",
    hostPort = 4001,
    token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  ) {
    this.client = new Algodv2(token, hostUrl, hostPort);
  }

  async accountInformation(address: string): Promise<{ amount: number }> {
    const compileResponse = await this.client.accountInformation(address).do();
    return {
      amount: compileResponse.amount,
    };
  }

  async compileProgram(programSource: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const programBytes = encoder.encode(programSource);
    const compileResponse = await this.client.compile(programBytes).do();
    return new Uint8Array(Buffer.from(compileResponse.result, "base64"));
  }

  async getDefaultParams(): Promise<SuggestedParams> {
    const params = await this.client.getTransactionParams().do();
    params.fee = ALGORAND_MIN_TX_FEE;
    params.flatFee = true;
    return params;
  }

  async sendTransaction(
    senderMnemonic: string,
    createTransaction: (
      fromAddress: string,
      params: SuggestedParams
    ) => Transaction
  ): Promise<void> {
    const senderAccount = mnemonicToSecretKey(senderMnemonic);
    const params = await this.getDefaultParams();
    const txn = createTransaction(senderAccount.addr, params);
    await this.sendRawTransaction(txn, senderAccount.sk);
  }

  async sendRawTransaction(
    transaction: Transaction,
    secretKey: Uint8Array
  ): Promise<void> {
    const txId = transaction.txID().toString();
    const signedTxn = transaction.signTxn(secretKey);
    await this.client.sendRawTransaction(signedTxn).do();
    await waitForConfirmation(this.client, txId, MAX_WAIT_ROUNDS);
  }

  async getApplicationId(transaction: Transaction): Promise<number> {
    const txId = transaction.txID().toString();
    const transactionResponse = await this.client
      .pendingTransactionInformation(txId)
      .do();
    const appId = transactionResponse["application-index"];
    // More info about 'transactionResponse' the structure of can be found here:
    // https://developer.algorand.org/docs/rest-apis/algod/v2/?from_query=application-index#pendingtransactionresponse
    return appId;
  }

  async sendAtomicTransaction(
    ...txnFactories: TransactionWrapperFactory[]
  ): Promise<void> {
    console.time("send atomic transaction");
    if (!txnFactories || !txnFactories.length) {
      return;
    }
    const params = await this.getDefaultParams();
    const txnWrappers = txnFactories.map((txnFactory) =>
      txnFactory.createTransaction(params)
    );
    assignGroupID(txnWrappers.map((txnWrapper) => txnWrapper.transaction));
    const signedTransactions = txnWrappers.map((txn) => txn.signTransaction());
    const { txId } = await this.client
      .sendRawTransaction(signedTransactions)
      .do();
    await waitForConfirmation(this.client, txId, MAX_WAIT_ROUNDS);
    console.timeEnd("send atomic transaction");
  }
}
