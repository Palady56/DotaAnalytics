import { NextResponse } from "next/server";
import { withoutSession } from "@/lib/session-cookie";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  const url = new URL(request.url);
  return withoutSession(NextResponse.redirect(new URL("/", url.origin), 303), url.protocol === "https:");
}
