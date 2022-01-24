const algosdk = require("algosdk");
const { createAlgoClient } = require("./utils");
const { ASA_ID, APP_ID, ASA_HOLDER_MNEMONIC, EATER_MNEMONIC } = require("./consts");

(async () => {
  const algodClient = createAlgoClient();
  const sender = algosdk.mnemonicToSecretKey(ASA_HOLDER_MNEMONIC);
  // const receiverAddress = algosdk.mnemonicToSecretKey(EATER_MNEMONIC);
  const receiverAddress = algosdk.getApplicationAddress(APP_ID);
  // get suggested parameters
  const suggestedParams = await algodClient.getTransactionParams().do();
  const amount = 10; // amount of assets to transfer

  const transactionOptions = {
    from: sender.addr,
    to: receiverAddress,
    amount,
    assetIndex: ASA_ID,
    suggestedParams,
  };
  const txn =
    algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(
      transactionOptions
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
  const accountInfo = await algodClient.accountInformation(receiverAddress).do();
  console.log(
    `Asset amount:`,
    accountInfo.assets.find((a) => a["asset-id"] === ASA_ID).amount
  );
})();
