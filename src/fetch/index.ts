/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from "node-fetch";

// noinspection JSUnusedGlobalSymbols this is an entry point
export const fetchHandler = async (payload: any): Promise<unknown> => {
  try {
    console.info(`payload: ${JSON.stringify(payload)}`);
    const status: any | undefined = await fetch(payload.url)
      .then((res) => res.json())
      .catch(() => undefined);
    console.info(`result: ${JSON.stringify(status)}`);
    return status;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
