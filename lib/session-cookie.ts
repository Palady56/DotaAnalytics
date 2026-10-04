import { NextResponse } from "next/server";
import { sealSession, SESSION_COOKIE, SESSION_MAX_AGE, type Session } from "@/lib/session";

function options(secure: boolean, maxAge: number) {
  return { httpOnly: true, sameSite: "lax" as const, secure, path: "/", maxAge };
}

export function withSession(response: NextResponse, session: Pick<Session, "steamId64" | "accountId">, secure: boolean) {
  response.cookies.set(SESSION_COOKIE, sealSession(session), options(secure, SESSION_MAX_AGE));
  return response;
}

export function withoutSession(response: NextResponse, secure: boolean) {
  response.cookies.set(SESSION_COOKIE, "", options(secure, 0));
  return response;
}
