import { decodeAddress, isValidAddress } from "algosdk";
import AppArgument from "./AppArgument";

export default class AddressAppArgument extends AppArgument {
  readonly value: string;

  constructor(value: string) {
    super();
    if (!value || typeof value !== "string" || !isValidAddress(value)) {
      throw new Error("Invalid address app argument.");
    }
    this.value = value;
  }

  toBinary(): Uint8Array {
    return decodeAddress(this.value).publicKey;
  }
}
