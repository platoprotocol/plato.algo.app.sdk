/**
 * Current the UNIX epoch time.
 * @returns the number of seconds elapsed since January 1, 1970 00:00:00 UTC.
 */
export const unixNow = () => Math.floor(Date.now() / 1000);