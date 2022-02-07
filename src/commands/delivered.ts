import algosdk from "algosdk";
import AlgoClient from "../algo/AlogClient";
import CourierDeliveryClient from "../plato/delivery/CourierDeliveryClient";
import {
  ASA_ID,
  APP_ID,
  EATER_MNEMONIC,
  COURIER_MNEMONIC,
  RESTAURANT_MNEMONIC,
} from "./consts";

(async () => {
  const eaterAccount = algosdk.mnemonicToSecretKey(EATER_MNEMONIC);
  const restaurantAccount = algosdk.mnemonicToSecretKey(RESTAURANT_MNEMONIC);

  const algoClient = new AlgoClient();
  const customerDeliveryClient = new CourierDeliveryClient(
    algoClient,
    APP_ID,
    COURIER_MNEMONIC,
    eaterAccount.addr,
    restaurantAccount.addr,
    ASA_ID
  );

  console.log("mark an order as delivered:", APP_ID);
  await customerDeliveryClient.delivered();
  console.log("delivered");
})();
