import { NextResponse } from "next/server";
import { getSession } from "@/lib/current-session";
import { clearRefreshMark } from "@/lib/refresh";
import { withoutSession } from "@/lib/session-cookie";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const session = await getSession();
  if (session) clearRefreshMark(session.accountId);
  return withoutSession(NextResponse.redirect(new URL("/me?unlinked=1", url.origin), 303), url.protocol === "https:");
}
