/**
 * The type describes the number of fields that the program will occupy.
 */
export type StateSchema = {
  /**
   * Number of byte slices to store
   */
  bytes: number;

  /**
   * Number of uints to store
   */
  ints: number;
};
