import algosdk from "algosdk";
import AlgoClient from "../algo/AlogClient";
import CustomerDeliveryClient from "../plato/delivery/CustomerDeliveryClient";
import {
  ASA_ID,
  COURIER_MNEMONIC,
  EATER_MNEMONIC,
  RESTAURANT_MNEMONIC,
} from "./consts";

(async () => {
  // get accounts from mnemonic
  const orderTotalPrice = 50000;
  const courierRewardAmount = 10000;
  const tipsAmount = 1;

  const eaterAccount = algosdk.mnemonicToSecretKey(EATER_MNEMONIC);
  const courierAccount = algosdk.mnemonicToSecretKey(COURIER_MNEMONIC);
  const restaurantAccount = algosdk.mnemonicToSecretKey(RESTAURANT_MNEMONIC);

  console.log("eater address:", eaterAccount.addr);
  console.log("courier address:", courierAccount.addr);
  console.log("restaurant address:", restaurantAccount.addr);

  const algoClient = new AlgoClient();
  const customerDeliveryClient = await CustomerDeliveryClient.deploy(
    algoClient,
    EATER_MNEMONIC,
    restaurantAccount.addr,
    courierAccount.addr,
    orderTotalPrice,
    courierRewardAmount,
    {
      asaId: ASA_ID,
      amount: tipsAmount,
    }
  );

  console.log("created new app-id: ", customerDeliveryClient.applicationId);

  // Check your balance
  const escrowAccountInfo = await algoClient.accountInformation(
    customerDeliveryClient.escrowAddress
  );
  console.log(
    "escrow account balance: %d microAlgos",
    escrowAccountInfo.amount
  );
})()
  .then(() => console.log("DONE🎉"))
  .catch(console.error);
