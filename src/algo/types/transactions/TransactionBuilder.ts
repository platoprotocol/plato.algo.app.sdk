import {
  Account,
  Transaction,
  SuggestedParams,
  mnemonicToSecretKey,
} from "algosdk";
import {
  TransactionWrapperFactory,
  TransactionWrapper,
  TransactionFactoryDelegate,
} from "./types";

export class TransactionBuilder
  implements TransactionWrapperFactory, TransactionWrapper
{
  private readonly senderAccount: Account;
  private innerTransaction!: Transaction;

  constructor(
    senderMnemonic: string,
    private readonly transactionFactory: TransactionFactoryDelegate
  ) {
    this.senderAccount = mnemonicToSecretKey(senderMnemonic);
  }

  get transaction(): Transaction {
    return this.innerTransaction;
  }

  signTransaction(): Uint8Array {
    return this.transaction.signTxn(this.senderAccount.sk);
  }

  createTransaction(params: SuggestedParams): TransactionWrapper {
    this.innerTransaction = this.transactionFactory(
      this.senderAccount.addr,
      params
    );
    return this;
  }
}
