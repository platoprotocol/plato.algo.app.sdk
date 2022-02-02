import { encodeUint64 } from "algosdk";
import AppArgument from "./AppArgument";

export default class NumberAppArgument extends AppArgument {
  readonly value: number;

  constructor(value: number) {
    super();
    if (typeof value !== "number") {
      throw new Error("Invalid number app argument.");
    }
    this.value = value;
  }

  toBinary(): Uint8Array {
    return encodeUint64(this.value);
  }
}
