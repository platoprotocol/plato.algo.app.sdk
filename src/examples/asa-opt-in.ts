import AlgoMonetaryManager from "../algo/AlgoMonetaryManager";
import AlgoClient from "../algo/AlogClient";
import { ASA_ID, COURIER_MNEMONIC } from "./consts";

(async () => {
  const algoMonetaryManager = new AlgoMonetaryManager(new AlgoClient());

  console.log("opt ip to an asset", ASA_ID);
  await algoMonetaryManager.assetOptIn(COURIER_MNEMONIC, ASA_ID);
  console.log("done");
})();
