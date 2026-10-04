import { NextResponse } from "next/server";
import { parsePlayerQuery, resolveVanity } from "@/lib/lookup";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const parsed = parsePlayerQuery(query);

  if (parsed.kind === "account") {
    return NextResponse.redirect(new URL(`/players/${parsed.accountId}`, request.url));
  }
  if (parsed.kind === "match") {
    return NextResponse.redirect(new URL(`/matches/${parsed.matchId}`, request.url));
  }
  if (parsed.kind === "friend_code") {
    return NextResponse.redirect(new URL("/?error=friend_code", request.url));
  }
  if (parsed.kind === "invalid" || parsed.kind === "empty") {
    return NextResponse.redirect(new URL("/?error=invalid", request.url));
  }
  if (parsed.kind === "vanity") {
    if (!process.env.STEAM_WEB_API_KEY) {
      return NextResponse.redirect(new URL(`/search?q=${encodeURIComponent(parsed.vanity)}&unverified=1`, request.url));
    }
    try {
      const accountId = await resolveVanity(parsed.vanity);
      if (!accountId) return NextResponse.redirect(new URL("/?error=vanity_missing", request.url));
      return NextResponse.redirect(new URL(`/players/${accountId}`, request.url));
    } catch {
      return NextResponse.redirect(new URL("/?error=vanity_failed", request.url));
    }
  }

  return NextResponse.redirect(new URL(`/search?q=${encodeURIComponent(parsed.query)}`, request.url));
}
