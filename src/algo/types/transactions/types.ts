import { Transaction, SuggestedParams } from "algosdk";

export type TransactionWrapper = {
  get transaction(): Transaction;

  signTransaction(): Uint8Array;
};

export type TransactionWrapperFactory = {
  createTransaction(params: SuggestedParams): TransactionWrapper;
};

export type TransactionFactoryDelegate = (
  fromAddress: string,
  prams: SuggestedParams
) => Transaction;
