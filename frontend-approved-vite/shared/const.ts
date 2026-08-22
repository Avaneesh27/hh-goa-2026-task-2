/**
 * Stub for @shared/const — platform auth constants.
 * These are no-ops in the local dev environment; the app connects
 * directly to the FastAPI backend via ragApi.ts without OAuth.
 */

export const COOKIE_NAME = "manus-session";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
export const OAUTH_STATE_COOKIE = "__Host-oauth-state";
export const UNAUTHED_ERR_MSG = "UNAUTHORIZED";

export function encodeOAuthState(state: Record<string, string>): string {
  return btoa(JSON.stringify(state));
}

export function decodeOAuthState(encoded: string): Record<string, string> {
  try { return JSON.parse(atob(encoded)); } catch { return {}; }
}
