import { NextResponse } from "next/server";
import { dropPlayerCache } from "@/lib/cache";
import { getSession } from "@/lib/current-session";
import { claimRefresh } from "@/lib/refresh";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/me?error=auth", url.origin), 303);
  const claim = claimRefresh(session.accountId);
  const next = new URL(`/players/${session.accountId}`, url.origin);
  if (!claim.ok) next.searchParams.set("wait", String(claim.retryIn));
  else {
    dropPlayerCache(session.accountId);
    next.searchParams.set("refreshed", "1");
  }
  return NextResponse.redirect(next, 303);
}
