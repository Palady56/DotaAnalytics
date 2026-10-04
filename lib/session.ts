import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { accountIdFromSteam64 } from "@/lib/lookup";

export const SESSION_COOKIE = "passport_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export type Session = { steamId64: string; accountId: number; exp: number };

let ephemeralSecret: string | null = null;

export function sessionSecret(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 16) return configured;
  if (!ephemeralSecret) ephemeralSecret = randomBytes(32).toString("hex");
  return ephemeralSecret;
}

export function sessionUsesEphemeralSecret(): boolean {
  const configured = process.env.SESSION_SECRET;
  return !(configured && configured.length >= 16);
}

export function sealSession(session: Pick<Session, "steamId64" | "accountId">, now = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ steamId64: session.steamId64, accountId: session.accountId, exp: now + SESSION_MAX_AGE * 1000 }),
    "utf8",
  ).toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function openSession(token: string | undefined, now = Date.now()): Session | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  const given = Buffer.from(sig);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (typeof data.steamId64 !== "string" || typeof data.accountId !== "number" || typeof data.exp !== "number") return null;
    if (accountIdFromSteam64(data.steamId64) !== data.accountId) return null;
    if (data.exp < now) return null;
    return data;
  } catch {
    return null;
  }
}
