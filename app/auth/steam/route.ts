import { NextResponse } from "next/server";
import { callbackUrl, steamLoginUrl } from "@/lib/steam-openid";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const callback = callbackUrl(origin);
  return NextResponse.redirect(steamLoginUrl(callback, `${origin}/`));
}
