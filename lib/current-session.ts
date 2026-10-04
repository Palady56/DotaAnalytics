import { cookies } from "next/headers";
import { openSession, SESSION_COOKIE, type Session } from "@/lib/session";

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return openSession(jar.get(SESSION_COOKIE)?.value);
}
