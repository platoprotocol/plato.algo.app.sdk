const algosdk = require("algosdk");
const { createAlgoClient } = require("./utils");
const { ASA_ID, EATER_MNEMONIC } = require("./consts");

(async () => {
  const algodClient = createAlgoClient();
  const sender = algosdk.mnemonicToSecretKey(EATER_MNEMONIC);
  // get suggested parameters
  const suggestedParams = await algodClient.getTransactionParams().do();
  suggestedParams.fee = 1000;
  suggestedParams.flatFee = true;

  const assetID = ASA_ID;
  const senderAddress = sender.addr;
  const recipientAddress = senderAddress;
  // We set revocationTarget to undefined as
  // This is not a clawback operation
  const revocationTarget = undefined;
  // CloseReaminerTo is set to undefined as
  // we are not closing out an asset
  const closeRemainderTo = undefined;
  const note = undefined;
  // We are sending 0 assets
  const amount = 0;

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    senderAddress,
    recipientAddress,
    closeRemainderTo,
    revocationTarget,
    amount,
    note,
    assetID,
    suggestedParams
  );

  const txId = txn.txID().toString();

  // Sign the transaction
  const signedTxn = txn.signTxn(sender.sk);
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
