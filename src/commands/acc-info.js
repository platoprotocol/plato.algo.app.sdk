const algosdk = require("algosdk");
const { createAlgoClient } = require("./utils");
const {
  APP_ID,
  ASA_HOLDER_MNEMONIC,
  EATER_MNEMONIC,
  COURIER_MNEMONIC,
  RESTAURANT_MNEMONIC,
} = require("./consts");

(async () => {
  const algodClient = createAlgoClient();
  const address = algosdk.mnemonicToSecretKey(RESTAURANT_MNEMONIC).addr;
  // const address = algosdk.getApplicationAddress(APP_ID);
  const accountInfo = await algodClient.accountInformation(address).do();
  console.log(`account info`, accountInfo);
})();
