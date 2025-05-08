/* eslint-disable quotes */
/* eslint-disable indent */

export function dateDiff(first: number, second: number) {
  // Take the difference between the dates and divide by milliseconds per day.
  // Round to nearest whole number to deal with DST.
  return Math.round(Math.abs((first - second) / (1000 * 60 * 60 * 24)));
}

/**
 * @description Normalize array of array.
 * @param {Array<string>} headers
 * @param {Array<Array<number|string>>} data
 * @param {string} key
 */

export const normalize = <T>(
  {
    headers,
    data,
  }: { headers: string[]; data: (number | string | boolean | null)[][] },
  key: string,
): Record<string | number, T> => {
  if (!headers) {
    return {};
  }
  const keySelected = headers.indexOf(key);
  const result = {};

  data.forEach((element) => {
    const key =
      typeof element[keySelected] !== "boolean" ? element[keySelected] : null;
    if (!key) {
      throw new Error("You can't select a boolean like key");
    }
    const value = {};
    headers.forEach((header, index) => {
      Object.assign(value, { [header]: element[index] });
    });
    Object.assign(result, {
      [key as string | number]: value,
    });
  });
  return result;
};

export function clone<T>(obj: Record<string, unknown>): T {
  return JSON.parse(JSON.stringify(obj));
}
