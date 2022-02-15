export const USER_TYPE_BUYER = 1;
export const USER_TYPE_STORE = 2;
export const USER_TYPE_COURIER = 3;

export type UserType =
  | typeof USER_TYPE_BUYER
  | typeof USER_TYPE_STORE
  | typeof USER_TYPE_COURIER;

export const IDENTITY_VALIDATE_MERCHANT = "sto_val";
export const IDENTITY_VALIDATE_COURIER = "cou_val";

export type IdentityActionType =
  | typeof IDENTITY_VALIDATE_MERCHANT
  | typeof IDENTITY_VALIDATE_COURIER;
