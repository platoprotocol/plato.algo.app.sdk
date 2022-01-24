const algosdk = require("algosdk");
const {
  createAlgoClient,
} = require("./utils");
const { APP_ID, COURIER_MNEMONIC } = require("./consts");

(async () => {
  const transactionAmount = 1111;
  const algodClient = createAlgoClient();
  const courierAccount = algosdk.mnemonicToSecretKey(COURIER_MNEMONIC);
  const escrowAddress = algosdk.getApplicationAddress(APP_ID);
  console.log("escrow address:", escrowAddress);
  // //Check your balance
  const accountInfo = await algodClient.accountInformation(escrowAddress).do();
  console.log("account balance: %d microAlgos", accountInfo.amount);
  if (transactionAmount > accountInfo.amount) {
    throw new Error("insufficient funds");
  }
  // get suggested parameters
  const params = await algodClient.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;

  // create a transaction
  const appArgs = [
    new Uint8Array(Buffer.from("DELIVERED")),
    // algosdk.encodeUint64(transactionAmount),
    // algosdk.decodeAddress(courierAddress).publicKey
  ];
  const accounts = [courierAccount.addr];
  const txn = algosdk.makeApplicationNoOpTxn(
    courierAccount.addr,
    params,
    APP_ID,
    appArgs,
    accounts
  );

  const txId = txn.txID().toString();

  // Sign the transaction
  const signedTxn = txn.signTxn(courierAccount.sk);
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
