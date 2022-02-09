import AlgoAppManager from "../algo/AlgoAppManager";
import AlgoClient from "../algo/AlogClient";
import { APP_ID, EATER_MNEMONIC } from "./consts";

(async () => {
  const algoClient = new AlgoClient();
  const algoAppManager = new AlgoAppManager(algoClient);
  console.log("deleting the app:", APP_ID);
  await algoAppManager.delete({
    creatorMnemonic: EATER_MNEMONIC,
    appId: APP_ID,
  });
  console.log("the app has been successfully deleted");
})();
