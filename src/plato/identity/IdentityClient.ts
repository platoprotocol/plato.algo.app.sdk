import { mnemonicToSecretKey } from "algosdk";
import { promises as fs } from "fs";
import AlgoAppManager from "../../algo/AlgoAppManager";
import AlgoClient from "../../algo/AlogClient";
import { ALGORAND_ZERO_ADDRESS_STRING } from "../../algo/constants";
import AddressAppArgument from "../../algo/types/app/arguments/AddressAppArgument";
import NumberAppArgument from "../../algo/types/app/arguments/NumberAppArgument";
import StringAppArgument from "../../algo/types/app/arguments/StringAppArgument";
import { StateSchema } from "../../algo/types/app/types";
import { TransactionWrapperFactory } from "../../algo/types/transactions/types";
import { getFutureTime } from "../../utils/date";
import {
  IdentityActionType,
  IDENTITY_VALIDATE_COURIER,
  IDENTITY_VALIDATE_MERCHANT,
  UserType,
  USER_TYPE_BUYER,
} from "./types";

const APPROVAL_PROGRAM_FILE_PATH = "../../../dist/identity_approval.teal";
const CLEAR_PROGRAM_FILE_PATH = "../../../dist/identity_clear_program.teal";

export default class IdentityClient {
  private readonly algoAppManager: AlgoAppManager;

  static readonly OPT_IN_COST = 728000;

  constructor(algoClient: AlgoClient, readonly appId: number) {
    this.algoAppManager = new AlgoAppManager(algoClient);
  }

  static async deploy(
    algoClient: AlgoClient,
    creatorMnemonic: string
  ): Promise<{ id: number }> {
    const algoAppManager = new AlgoAppManager(algoClient);
    const [approvalProgramSource, clearProgramSource] = await Promise.all([
      fs.readFile(APPROVAL_PROGRAM_FILE_PATH, "utf8"),
      fs.readFile(CLEAR_PROGRAM_FILE_PATH, "utf8"),
    ]);
    const localState: StateSchema = { ints: 8, bytes: 8 };
    const globalState: StateSchema = { ints: 1, bytes: 1 };
    const startTime = getFutureTime();
    const appArgs = [new NumberAppArgument(startTime)];
    const { id } = await algoAppManager.create({
      creatorMnemonic,
      approvalProgramSource,
      clearProgramSource,
      localState,
      globalState,
      appArgs,
    });

    return { id };
  }

  createOptInTransaction(args: {
    userMnemonic: string;
    userType: UserType;
    latitude?: string;
    longitude?: string;
    refererAddress?: string;
  }): TransactionWrapperFactory {
    const startTime = getFutureTime();
    const { addr: userAddress } = mnemonicToSecretKey(args.userMnemonic);
    return this.algoAppManager.createOptInTransaction({
      senderMnemonic: args.userMnemonic,
      appId: this.appId,
      appArgs: [
        new AddressAppArgument(userAddress),
        new NumberAppArgument(args.userType),
        new NumberAppArgument(startTime),
        new StringAppArgument(args.latitude || ""),
        new StringAppArgument(args.longitude || ""),
        new AddressAppArgument(
          args.refererAddress || ALGORAND_ZERO_ADDRESS_STRING
        ),
      ],
    });
  }

  async optIn(
    userMnemonic: string,
    userType: UserType,
    latitude: string,
    longitude: string,
    refererAddress: string = ALGORAND_ZERO_ADDRESS_STRING
  ): Promise<void> {
    const startTime = getFutureTime();
    const { addr: userAddress } = mnemonicToSecretKey(userMnemonic);
    await this.algoAppManager.optIn({
      senderMnemonic: userMnemonic,
      appId: this.appId,
      appArgs: [
        new AddressAppArgument(userAddress),
        new NumberAppArgument(userType),
        new NumberAppArgument(startTime),
        new StringAppArgument(latitude),
        new StringAppArgument(longitude),
        new AddressAppArgument(refererAddress),
      ],
    });
  }

  async validateCourier(
    merchantMnemonic: string,
    courierAddress: string
  ): Promise<void> {
    const actionType: IdentityActionType = IDENTITY_VALIDATE_COURIER;
    const userType: UserType = USER_TYPE_BUYER;
    const startTime = getFutureTime();
    await this.algoAppManager.invoke({
      senderMnemonic: merchantMnemonic,
      appId: this.appId,
      accounts: [courierAddress],
      appArgs: [
        new StringAppArgument(actionType),
        new NumberAppArgument(userType),
        new NumberAppArgument(startTime),
        new AddressAppArgument(courierAddress),
      ],
    });
  }

  async validateMerchant(
    buyerMnemonic: string,
    merchantAddress: string
  ): Promise<void> {
    const actionType: IdentityActionType = IDENTITY_VALIDATE_MERCHANT;
    const userType: UserType = USER_TYPE_BUYER;
    const startTime = getFutureTime();
    await this.algoAppManager.invoke({
      senderMnemonic: buyerMnemonic,
      appId: this.appId,
      accounts: [merchantAddress],
      appArgs: [
        new StringAppArgument(actionType),
        new NumberAppArgument(userType),
        new NumberAppArgument(startTime),
        new AddressAppArgument(merchantAddress),
      ],
    });
  }
}
