import { mnemonicToSecretKey } from "algosdk";
import { ALGORAND_ZERO_ADDRESS_STRING } from "algosdk/dist/types/src/encoding/address";
import { promises as fs } from "fs";
import AlgoAppManager from "../../algo/AlgoAppManager";
import AlgoClient from "../../algo/AlogClient";
import AddressAppArgument from "../../algo/types/app/arguments/AddressAppArgument";
import NumberAppArgument from "../../algo/types/app/arguments/NumberAppArgument";
import StringAppArgument from "../../algo/types/app/arguments/StringAppArgument";
import { StateSchema } from "../../algo/types/app/types";
import { unixNow } from "../../utils/date";
import {
  IdentityActionType,
  IDENTITY_VALIDATE_COURIER,
  IDENTITY_VALIDATE_MERCHANT,
  UserType,
  USER_TYPE_BUYER,
} from "./types";

const APPROVAL_PROGRAM_FILE_PATH = "./dist/identity_approval.teal";
const CLEAR_PROGRAM_FILE_PATH = "./dist/identity_clear_program.teal";

export default class IdentityClient {
  private readonly algoAppManager: AlgoAppManager;

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
    const startTime = IdentityClient.getStartTime();
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

  async optIn(
    userMnemonic: string,
    userType: UserType,
    latitude: string,
    longitude: string,
    refererAddress: string = ALGORAND_ZERO_ADDRESS_STRING
  ): Promise<void> {
    const startTime = IdentityClient.getStartTime();
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
    const startTime = IdentityClient.getStartTime();
    await this.algoAppManager.invoke({
      senderMnemonic: merchantMnemonic,
      appId: this.appId,
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
    const startTime = IdentityClient.getStartTime();
    await this.algoAppManager.invoke({
      senderMnemonic: buyerMnemonic,
      appId: this.appId,
      appArgs: [
        new StringAppArgument(actionType),
        new NumberAppArgument(userType),
        new NumberAppArgument(startTime),
        new AddressAppArgument(merchantAddress),
      ],
    });
  }

  /**
   * Return the start time which is 10 seconds in the future.
   */
  private static getStartTime(): number {
    return unixNow() + 10;
  }
}
