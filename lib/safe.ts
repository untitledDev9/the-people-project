import { AxiosError } from "axios";

/** Resolve to null instead of throwing, so a page can render an error state. */
export async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (err) {
    console.error("API request failed:", err instanceof AxiosError ? err.message : err);
    return null;
  }
}
