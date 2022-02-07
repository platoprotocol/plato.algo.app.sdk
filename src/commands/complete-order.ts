import algosdk from "algosdk";
import AlgoClient from "../algo/AlogClient";
import CustomerDeliveryClient from "../plato/delivery/CustomerDeliveryClient";
import {
  ASA_ID,
  APP_ID,
  EATER_MNEMONIC,
  COURIER_MNEMONIC,
  RESTAURANT_MNEMONIC,
} from "./consts";

(async () => {
  const courierAccount = algosdk.mnemonicToSecretKey(COURIER_MNEMONIC);
  const restaurantAccount = algosdk.mnemonicToSecretKey(RESTAURANT_MNEMONIC);

  const algoClient = new AlgoClient();
  
  const customerDeliveryClient = new CustomerDeliveryClient(
    algoClient,
    APP_ID,
    EATER_MNEMONIC,
    restaurantAccount.addr,
    courierAccount.addr,
    ASA_ID
  );

  console.log("mark an order as completed", APP_ID);
  await customerDeliveryClient.completeOrder();
  console.log("completed");
})();
