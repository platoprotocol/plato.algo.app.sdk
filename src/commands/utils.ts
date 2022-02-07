import algosdk from "algosdk";
import { promises as fs } from "fs";

export const createAlgoClient = (
  algodToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  hostUrl = "http://localhost",
  hostPort = 4001
) => new algosdk.Algodv2(algodToken, hostUrl, hostPort);

export const compileProgram = async (client, programFilePath) => {
  const programSource = await fs.readFile(programFilePath, "utf8");
  const encoder = new TextEncoder();
  const programBytes = encoder.encode(programSource);
  const compileResponse = await client.compile(programBytes).do();
  const compiledBytes = new Uint8Array(
    Buffer.from(compileResponse.result, "base64")
  );
  return compiledBytes;
};

export const decodeAddressStateValue = (value) =>
  algosdk.encodeAddress(Buffer.from(value, "base64"));

export const decodeStateValue = (value) =>
  Buffer.from(value, "base64").toString("utf8");
