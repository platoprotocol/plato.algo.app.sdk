import algosdk from "algosdk";
import AlgoMonetaryManager from "../../algo/AlgoMonetaryManager";
import AlgoClient from "../../algo/AlogClient";
import {
  ALGO_MIN_ACCOUNT_BALANCE,
  ALGO_MIN_TRANSACTION_FEE,
} from "../../algo/constants";
import IdentityClient from "../identity/IdentityClient";
import { UserType } from "../identity/types";
import { PlatoUserAccount } from "./types";

export default class PlatoUserManager {
  private readonly algoMonetaryManager: AlgoMonetaryManager;

  constructor(private readonly algoClient: AlgoClient) {
    this.algoMonetaryManager = new AlgoMonetaryManager(algoClient);
  }

  createUserAccount(): PlatoUserAccount {
    const account = algosdk.generateAccount();
    return {
      address: account.addr,
      secretKey: account.sk,
      mnemonic: algosdk.secretKeyToMnemonic(account.sk),
    };
  }

  async initAccount(
    assetHolderMnemonic: string,
    customerMnemonic: string,
    identityAppId: number,
    platoAsaId: number,
    userType: UserType,
    latitude?: string,
    longitude?: string,
    refererAddress?: string
  ): Promise<void> {
    const identityClient = new IdentityClient(this.algoClient, identityAppId);
    const { addr: customerAddress } =
      algosdk.mnemonicToSecretKey(customerMnemonic);
    const numberOfHoldingAssets = 2; // Algo Coin + Plato token
    // TODO: review initial number of txn
    const numberOptInTransactions = 5; // opt in the identity contract and PLATO token
    const totalAccountBalance =
      numberOptInTransactions * ALGO_MIN_TRANSACTION_FEE +
      numberOfHoldingAssets * ALGO_MIN_ACCOUNT_BALANCE +
      IdentityClient.OPT_IN_COST;

    const algoTransferTxn =
      this.algoMonetaryManager.createAlgoTransferTransaction(
        assetHolderMnemonic,
        customerAddress,
        totalAccountBalance
      );
    const optInPlatoAsaTxn =
      this.algoMonetaryManager.createAssetOptInTransaction(
        customerMnemonic,
        platoAsaId
      );
    const optInIdentityAppTxn = identityClient.createOptInTransaction({
      userMnemonic: customerMnemonic,
      userType,
      latitude,
      longitude,
      refererAddress,
    });

    await this.algoClient.sendAtomicTransaction(
      algoTransferTxn,
      optInPlatoAsaTxn,
      optInIdentityAppTxn
    );
  }
}
