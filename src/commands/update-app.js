const algosdk = require("algosdk");
const { createAlgoClient, compileProgram } = require("./utils");
const { EATER_MNEMONIC, APP_ID } = require("./consts");

const APPROVAL_PROGRAM_FILE_PATH = "./dist/escrow_approval.teal";
const CLEAR_PROGRAM_FILE_PATH = "./dist/escrow_clear_program.teal";

(async () => {
  // get accounts from mnemonic
  const courierAddress =
    "ZOKD3MIPY3DRCO6QAPDPDPK4MKL3LQHV57C5XC73JSMP5GUVJKSLIIHBYQ";
  const creatorAccount = algosdk.mnemonicToSecretKey(EATER_MNEMONIC);
  console.log("creator address:", creatorAccount.addr);
  const client = createAlgoClient();
  const approvalProgram = await compileProgram(
    client,
    APPROVAL_PROGRAM_FILE_PATH
  );
  const clearProgram = await compileProgram(client, CLEAR_PROGRAM_FILE_PATH);
  // declare application state storage (immutable)
  const appArgs = [algosdk.decodeAddress(courierAddress).publicKey];
  // const accounts = [courierAddress];
  const accounts = [];
  // get node suggested parameters
  const params = await client.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;
  // create unsigned transaction
  const txn = algosdk.makeApplicationUpdateTxn(
    creatorAccount.addr,
    params,
    APP_ID,
    approvalProgram,
    clearProgram,
    appArgs,
    accounts
  );
  const txId = txn.txID().toString();

  // Sign the transaction
  const signedTxn = txn.signTxn(creatorAccount.sk);
  console.log("Signed transaction with txID: %s", txId);

  // Submit the transaction
  console.log("Sending transaction");
  await client.sendRawTransaction(signedTxn).do();
  console.log("The transaction has been sent");

  // Wait for confirmation
  console.log("Wait for a new block");
  await algosdk.waitForConfirmation(client, txId, 4);
  console.log("A new block has been created");
})()
  .then(() => console.log("DONE🎉"))
  .catch(console.error);
