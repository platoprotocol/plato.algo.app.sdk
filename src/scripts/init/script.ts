import AlgoMonetaryManager from "../../algo/AlgoMonetaryManager";
import AlgoClient from "../../algo/AlogClient";
import IdentityClient from "../../plato/identity/IdentityClient";
import RewardClient from "../../plato/reward/RewardClient";

const {
  HOLDER_ACCOUNT_MNEMONIC,

  ALGO_HOST_URL,
  ALGO_HOST_PORT,
  ALGO_HOST_ACCESS_TOKEN,

  PLATO_ASA_TOTAL,
  PLATO_ASA_DECIMAL,
  PLATO_ASA_DEFAULT_FROZEN,
  PLATO_ASA_UNIT_NAME,
  PLATO_ASA_ASSET_NAME,
  PLATO_ASA_URL,
  PLATO_ASA_NOTE,
  PLATO_ASA_MANAGER,
  PLATO_ASA_RESERVE,
  PLATO_ASA_FREEZE,
  PLATO_ASA_CLAWBACK,
  PLATO_ASA_METADATA_HASH,

  REWARD_APP_INITIAL_PLATO_ASA_AMOUNT,
  REWARD_APP_INITIAL_ALGO_AMOUNT,
} = process.env;

const algoClient = new AlgoClient(
  ALGO_HOST_URL,
  Number(ALGO_HOST_PORT),
  ALGO_HOST_ACCESS_TOKEN
);
const algoMonetaryManager = new AlgoMonetaryManager(algoClient);

/**
 * Creates PLATO token.
 * @returns ID of PLATO ASA.
 */
const createPlatoAsa = async (): Promise<number> => {
  console.log("Creating PLATO token...");
  const platoAsaId = await algoMonetaryManager.createAsset({
    ownerMnemonic: HOLDER_ACCOUNT_MNEMONIC,
    total: Number(PLATO_ASA_TOTAL),
    decimals: Number(PLATO_ASA_DECIMAL),
    defaultFrozen: PLATO_ASA_DEFAULT_FROZEN.toLowerCase() === "true",
    unitName: PLATO_ASA_UNIT_NAME,
    assetName: PLATO_ASA_ASSET_NAME,
    assetURL: PLATO_ASA_URL,
    note: PLATO_ASA_NOTE,
    manager: PLATO_ASA_MANAGER || undefined,
    reserve: PLATO_ASA_RESERVE || undefined,
    freeze: PLATO_ASA_FREEZE || undefined,
    clawback: PLATO_ASA_CLAWBACK || undefined,
    assetMetadataHash: PLATO_ASA_METADATA_HASH || undefined,
  });
  console.log("PLATO token has been created successfully", { id: platoAsaId });
  return platoAsaId;
};

/**
 * Deploys the identity app to the Algorand network.
 * @returns ID of the app.
 */
const createIdentityApp = async (): Promise<number> => {
  console.log("Creating the identity app...");
  const { id } = await IdentityClient.deploy(
    algoClient,
    HOLDER_ACCOUNT_MNEMONIC
  );
  console.log("The identity app has been created successfully", {
    id,
  });
  return id;
};

/**
 * Deploys the referral reward app to the Algorand network.
 * @returns ID of the app.
 */
const createReferralRewardApp = async (
  identityAppId: number,
  platoAsaId: number
): Promise<void> => {
  console.log("Creating the referral reward app...");
  const { id } = await RewardClient.deploy(
    algoClient,
    HOLDER_ACCOUNT_MNEMONIC,
    identityAppId,
    platoAsaId,
    Number(REWARD_APP_INITIAL_PLATO_ASA_AMOUNT),
    Number(REWARD_APP_INITIAL_ALGO_AMOUNT)
  );
  console.log("The referral reward app has been created successfully", {
    id,
  });
};

(async () => {
  const platoAsaId = await createPlatoAsa();
  const identityAppId = await createIdentityApp();
  await createReferralRewardApp(identityAppId, platoAsaId);
})().then(() => console.log("DONE"));
