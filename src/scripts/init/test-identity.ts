import AlgoClient from "../../algo/AlogClient";
import IdentityClient from "../../plato/identity/IdentityClient";
import {
  USER_TYPE_BUYER,
  USER_TYPE_COURIER,
  USER_TYPE_STORE,
} from "../../plato/identity/types";
import PlatoUserManager from "../../plato/user/PlatoUserManager";
import { PlatoUserAccount } from "../../plato/user/types";

const {
  HOLDER_ACCOUNT_MNEMONIC,

  ALGO_HOST_URL,
  ALGO_HOST_PORT,
  ALGO_HOST_ACCESS_TOKEN,

  IDENTITY_APP_ID,
  PLATO_ASA_ID,
} = process.env;

const identityAppId = Number(IDENTITY_APP_ID);
const platoAsaId = Number(PLATO_ASA_ID);

const algoClient = new AlgoClient(
  ALGO_HOST_URL,
  Number(ALGO_HOST_PORT),
  ALGO_HOST_ACCESS_TOKEN
);
const platoUserManager = new PlatoUserManager(algoClient);
const identityClient = new IdentityClient(algoClient, identityAppId);

const createTestAccounts = async (): Promise<{
  eaters: PlatoUserAccount[];
  store: PlatoUserAccount;
  courier: PlatoUserAccount;
}> => {
  console.log("Creating test users...");
  const eaters: PlatoUserAccount[] = [];
  // Create 5 eater accounts, one store account and one courier account.
  for (let index = 0; index < 5; index++) {
    const eater = platoUserManager.createUserAccount();
    await platoUserManager.initAccount(
      HOLDER_ACCOUNT_MNEMONIC,
      eater.mnemonic,
      identityAppId,
      platoAsaId,
      USER_TYPE_BUYER,
      "0",
      "0"
    );
    eaters.push(eater);
    console.log(
      `eater #${index + 1} has been created. Address=${eater.address}`
    );
  }
  const store = platoUserManager.createUserAccount();
  await platoUserManager.initAccount(
    HOLDER_ACCOUNT_MNEMONIC,
    store.mnemonic,
    identityAppId,
    platoAsaId,
    USER_TYPE_STORE,
    "40.365287",
    "-74.559643"
  );
  console.log(`store has been created. Address=${store.address}`);
  const courier = platoUserManager.createUserAccount();
  await platoUserManager.initAccount(
    HOLDER_ACCOUNT_MNEMONIC,
    courier.mnemonic,
    identityAppId,
    platoAsaId,
    USER_TYPE_COURIER,
    "0",
    "0"
  );
  console.log(`courier has been created. Address=${courier.address}`);
  console.log("The test users have been created successfully");
  return {
    eaters,
    courier,
    store,
  };
};

const validateStore = async (
  store: PlatoUserAccount,
  eaters: PlatoUserAccount[]
): Promise<void> => {
  console.log("Start store validation...");
  for (let i = 0; i < eaters.length; i++) {
    const eater = eaters[i];
    await identityClient.validateMerchant(eater.mnemonic, store.address);
  }
  console.log("Store validation has been completed successfully");
};

const validateCourier = async (
  store: PlatoUserAccount,
  courier: PlatoUserAccount
): Promise<void> => {
  console.log("Start courier validation...");
  await identityClient.validateCourier(store.mnemonic, courier.address);
  console.log("Store courier has been completed successfully");
};

(async () => {
  const { courier, store, eaters } = await createTestAccounts();
  await validateStore(store, eaters);
  await validateCourier(store, courier);
})().then(() => console.log("DONE"));
