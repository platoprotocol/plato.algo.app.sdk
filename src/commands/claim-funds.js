const algosdk = require("algosdk");
const { createAlgoClient } = require("./utils");
const { APP_ID, COURIER_MNEMONIC } = require("./consts");

(async () => {
  const algodClient = createAlgoClient();
  const account = algosdk.mnemonicToSecretKey(COURIER_MNEMONIC);
  // get suggested parameters
  const params = await algodClient.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;

  // create a transaction
  const appArgs = [new Uint8Array(Buffer.from("CLAIM_FUNDS"))];
  const accounts = [account.addr];
  const txn = algosdk.makeApplicationNoOpTxn(
    account.addr,
    params,
    APP_ID,
    appArgs,
    accounts
  );

  const txId = txn.txID().toString();

  // Sign the transaction
  const signedTxn = txn.signTxn(account.sk);
  console.log("Signed transaction with txID: %s", txId);

  // Submit the transaction
  console.log("Sending transaction");
  await algodClient.sendRawTransaction(signedTxn).do();
  console.log("The transaction has been sent");

  // Wait for confirmation
  console.log("Wait for a new block");
  await algosdk.waitForConfirmation(algodClient, txId, 4);
  console.log("A new block has been created");
})();
