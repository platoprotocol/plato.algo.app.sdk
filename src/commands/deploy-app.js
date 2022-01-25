const algosdk = require("algosdk");
const { createAlgoClient, compileProgram } = require("./utils");
const { ASA_ID, COURIER_MNEMONIC, EATER_MNEMONIC } = require("./consts");

const APPROVAL_PROGRAM_FILE_PATH = "./dist/escrow_approval.teal";
const CLEAR_PROGRAM_FILE_PATH = "./dist/escrow_clear_program.teal";
const MIN_TXN_FEE = 1000;

const sendFunds = async (client, sender, receiver, amount) => {
  // Construct the transaction
  const params = await client.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = MIN_TXN_FEE;
  params.flatFee = true;

  const note = new TextEncoder().encode();
  const txn = algosdk.makePaymentTxnWithSuggestedParams(
    sender.addr,
    receiver,
    amount,
    undefined,
    note,
    params
  );
  // Sign the transaction
  const signedTxn = txn.signTxn(sender.sk);
  const txId = txn.txID().toString();
  console.log("Signed transaction with txID: %s", txId);

  // Submit the transaction
  await client.sendRawTransaction(signedTxn).do();

  // Wait for confirmation
  const confirmedTxn = await algosdk.waitForConfirmation(client, txId, 4);
  //Get the completed Transaction
  console.log(
    "Transaction " +
      txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );
};

(async () => {
  // get accounts from mnemonic
  const rewardAmount = 1111;
  const escrowBalance = 300000;
  const eaterAccount = algosdk.mnemonicToSecretKey(EATER_MNEMONIC);
  const courierAccount = algosdk.mnemonicToSecretKey(COURIER_MNEMONIC);
  console.log("eater address:", eaterAccount.addr);
  console.log("courier address:", courierAccount.addr);
  const client = createAlgoClient();

  // Check your balance
  const eaterAccountInfo = await client.accountInformation(eaterAccount.addr).do();
  console.log("Eater's account balance: %d microAlgos", eaterAccountInfo.amount);
  if (escrowBalance + MIN_TXN_FEE > eaterAccountInfo.amount) {
    throw new Error("Eater has insufficient funds");
  }

  // Compile teal programs
  const approvalProgram = await compileProgram(
    client,
    APPROVAL_PROGRAM_FILE_PATH
  );
  const clearProgram = await compileProgram(client, CLEAR_PROGRAM_FILE_PATH);
  // declare application state storage (immutable)
  const localInts = 0;
  const localBytes = 0;
  const globalInts = 3;
  const globalBytes = 1;
  const appArgs = [
    algosdk.decodeAddress(courierAccount.addr).publicKey,
    algosdk.encodeUint64(rewardAmount),
  ];
  // const accounts = [courierAccount.addr];
  const accounts = [];
  // get node suggested parameters
  const params = await client.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = MIN_TXN_FEE;
  params.flatFee = true;
  // create unsigned transaction
  const txn = algosdk.makeApplicationCreateTxn(
    eaterAccount.addr,
    params,
    algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram,
    clearProgram,
    localInts,
    localBytes,
    globalInts,
    globalBytes,
    appArgs,
    accounts
  );
  const txId = txn.txID().toString();

  // Sign the transaction
  const signedTxn = txn.signTxn(eaterAccount.sk);
  console.log("Signed transaction with txID: %s", txId);

  // Submit the transaction
  console.log("Sending transaction");
  await client.sendRawTransaction(signedTxn).do();
  console.log("The transaction has been sent");

  // Wait for confirmation
  console.log("Wait for a new block");
  await algosdk.waitForConfirmation(client, txId, 4);
  console.log("A new block has been created");

  // display results
  const transactionResponse = await client
    .pendingTransactionInformation(txId)
    .do();
  const appId = transactionResponse["application-index"];
  console.log("Created new app-id: ", appId);
  const escrowAddress = algosdk.getApplicationAddress(appId);
  console.log("escrow address:", escrowAddress);

  console.log(`Fund an escrow with ${escrowBalance} microAlogs`);
  await sendFunds(client, eaterAccount, escrowAddress, escrowBalance);
  const escrowAccountInfo = await client.accountInformation(escrowAddress).do();
  console.log("Escrow account balance: %d microAlgos", escrowAccountInfo.amount);
})()
  .then(() => console.log("DONE🎉"))
  .catch(console.error);
