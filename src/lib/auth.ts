import { createHmac, timingSafeEqual } from "node:crypto";
import { requireEnv } from "./env";

export const SESSION_COOKIE_NAME = "cm_dashboard_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sign(value: string): string {
  return createHmac("sha256", requireEnv("SESSION_SECRET")).update(value).digest("hex");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * One shared team password, not per-user accounts (see plan). The cookie
 * just proves "someone who knows the password signed in" and carries no
 * identity — every authenticated request sees the full dashboard.
 */
export function verifyPassword(candidate: string): boolean {
  return timingSafeStringEqual(candidate, requireEnv("DASHBOARD_PASSWORD"));
}

export function createSessionToken(): string {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;
  if (!timingSafeStringEqual(signature, sign(issuedAt))) return false;

  const ageSeconds = (Date.now() - Number(issuedAt)) / 1000;
  return ageSeconds >= 0 && ageSeconds < SESSION_MAX_AGE_SECONDS;
}
