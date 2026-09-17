import { createHmac, timingSafeEqual } from "node:crypto";

export const OWNER_COOKIE = "questionhub_owner";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function sessionSecret(): string {
  return process.env.SESSION_SECRET?.trim() || process.env.RESULTS_PASSWORD?.trim() || "";
}

function signature(payload: string): string {
  const secret = sessionSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function ownerAuthConfigured(): boolean {
  return Boolean(process.env.RESULTS_PASSWORD?.trim() && sessionSecret());
}

export function verifyOwnerPassword(candidate: string): boolean {
  const expected = process.env.RESULTS_PASSWORD?.trim() || "";
  return expected.length > 0 && safeEqual(candidate, expected);
}

export function createOwnerToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }),
  ).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyOwnerToken(token: string | undefined): boolean {
  if (!token || !ownerAuthConfigured()) return false;
  const [payload, tokenSignature] = token.split(".");
  if (!payload || !tokenSignature || !safeEqual(tokenSignature, signature(payload))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export const OWNER_SESSION_MAX_AGE = SESSION_TTL_SECONDS;


