import axios, { AxiosError } from "axios";
import type { DuplicateMatch } from "@/types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  // Required by the server's CSRF guard on state-changing admin requests.
  headers: { "X-Requested-With": "XMLHttpRequest" },
  timeout: 120_000,
});

export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof AxiosError) {
    if (!err.response) return "Cannot reach the server. Check your connection and try again.";
    const data = err.response.data as { error?: string; details?: unknown } | undefined;
    const details = data?.details;
    if (Array.isArray(details) && details.length) {
      return (
        details
          .map((d: { message?: string }) => d.message)
          .filter(Boolean)
          .join(" · ") ||
        data?.error ||
        fallback
      );
    }
    return data?.error ?? fallback;
  }
  return fallback;
}

export function getDuplicates(err: unknown): DuplicateMatch[] | null {
  if (err instanceof AxiosError && err.response?.status === 409) {
    const d = (err.response.data as { details?: { code?: string; duplicates?: DuplicateMatch[] } })?.details;
    if (d?.code === "POSSIBLE_DUPLICATE" && d.duplicates) return d.duplicates;
  }
  return null;
}

export function isUnauthorized(err: unknown) {
  return err instanceof AxiosError && err.response?.status === 401;
}
