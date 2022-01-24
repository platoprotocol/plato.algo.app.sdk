const algosdk = require("algosdk");
const { createAlgoClient } = require("./utils");
const { ASA_HOLDER_MNEMONIC } = require("./consts");

(async () => {
  const client = createAlgoClient();
  const account = algosdk.mnemonicToSecretKey(ASA_HOLDER_MNEMONIC);

  const total = 100000000; // how many of this asset there will be
  const decimals = 2; // units of this asset are whole-integer amounts
  const assetName = 'plto';
  const unitName = 'PLTO';
  const defaultFrozen = false; // whether accounts should be frozen by default
  const manager = account.addr;

  // get suggested parameters
  const suggestedParams = await client.getTransactionParams().do();

  // create the asset creation transaction
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: account.addr,
    total,
    decimals,
    assetName,
    unitName,
    defaultFrozen,
    suggestedParams,
    manager
  });
  const txId = txn.txID().toString();

  // Sign the transaction
  const signedTxn = txn.signTxn(account.sk);
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
  const assetId = transactionResponse["asset-index"];
  console.log("Created new PLATO token: ", assetId);
})();
