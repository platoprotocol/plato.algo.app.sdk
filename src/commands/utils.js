const fs = require("fs").promises;
const algosdk = require("algosdk");

const createAlgoClient = (
  algodToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  hostUrl = "http://localhost",
  hostPort = 4001
) => new algosdk.Algodv2(algodToken, hostUrl, hostPort);

const compileProgram = async (client, programFilePath) => {
  const programSource = await fs.readFile(programFilePath, "utf8");
  const encoder = new TextEncoder();
  const programBytes = encoder.encode(programSource);
  const compileResponse = await client.compile(programBytes).do();
  const compiledBytes = new Uint8Array(
    Buffer.from(compileResponse.result, "base64")
  );
  return compiledBytes;
};

const decodeAddressStateValue = (value) =>
  algosdk.encodeAddress(Buffer.from(value, "base64"));

const decodeStateValue = (value) =>
  Buffer.from(value, "base64").toString("utf8");

exports.compileProgram = compileProgram;
exports.createAlgoClient = createAlgoClient;
exports.decodeAddressStateValue = decodeAddressStateValue;
exports.decodeStateValue = decodeStateValue;
