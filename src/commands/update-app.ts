import { promises as fs } from "fs";
import AlgoAppManager from "../algo/AlgoAppManager";
import AlgoClient from "../algo/AlogClient";
import { APP_ID, EATER_MNEMONIC } from "./consts";

const APPROVAL_PROGRAM_FILE_PATH = "./dist/escrow_approval.teal";
const CLEAR_PROGRAM_FILE_PATH = "./dist/escrow_clear_program.teal";

(async () => {
  const [approvalProgramSource, clearProgramSource] = await Promise.all([
    fs.readFile(APPROVAL_PROGRAM_FILE_PATH, "utf8"),
    fs.readFile(CLEAR_PROGRAM_FILE_PATH, "utf8"),
  ]);
  const algoAppManager = new AlgoAppManager(new AlgoClient());

  console.log("updating an app", APP_ID);
  await algoAppManager.update({
    creatorMnemonic: EATER_MNEMONIC,
    appId: APP_ID,
    approvalProgramSource,
    clearProgramSource,
  });
  console.log("updated");
})();
