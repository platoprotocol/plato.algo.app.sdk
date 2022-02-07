import algosdk from "algosdk";
import AlgoMonetaryManager from "../algo/AlgoMonetaryManager";
import AlgoClient from "../algo/AlogClient";
import { ASA_ID, APP_ID, ASA_HOLDER_MNEMONIC } from "./consts";

(async () => {
  const algoClient = new AlgoClient();
  const algoMonetaryManager = new AlgoMonetaryManager(algoClient);

  const amount = 10; // amount of assets to transfer
  const receiverAddress = algosdk.getApplicationAddress(APP_ID);

  console.log(`sending tokens`, { amount, to: receiverAddress });
  await algoMonetaryManager.assetTransfer(
    ASA_HOLDER_MNEMONIC,
    receiverAddress,
    ASA_ID,
    amount
  );
  console.log("sent");
  const accountInfo = await algoClient.accountInformation(receiverAddress);
  console.log(`account info`, accountInfo);
})();
