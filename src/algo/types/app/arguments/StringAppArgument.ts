import AppArgument from "./AppArgument";

export default class StringAppArgument extends AppArgument {
  readonly value: string;

  constructor(value: string) {
    super();
    if (!value || typeof value !== "string") {
      throw new Error("Invalid string app argument.");
    }
    this.value = value;
  }

  toBinary(): Uint8Array {
    return new Uint8Array(Buffer.from(this.value));
  }
}
