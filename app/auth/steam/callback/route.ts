import { NextResponse } from "next/server";
import { accountIdFromSteam64 } from "@/lib/lookup";
import { withSession } from "@/lib/session-cookie";
import { callbackUrl, verifySteamCallback } from "@/lib/steam-openid";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const secure = url.protocol === "https:";
  try {
    const steamId64 = await verifySteamCallback(url.searchParams, callbackUrl(origin));
    const accountId = accountIdFromSteam64(steamId64);
    if (!accountId) return NextResponse.redirect(new URL("/me?error=invalid", origin));
    return withSession(NextResponse.redirect(new URL(`/players/${accountId}`, origin)), { steamId64, accountId }, secure);
  } catch (error) {
    const code = error instanceof Error ? error.message : "invalid";
    const allowed = code === "cancel" || code === "timeout" || code === "mismatch" ? code : "invalid";
    return NextResponse.redirect(new URL(`/me?error=${allowed}`, origin));
  }
}
