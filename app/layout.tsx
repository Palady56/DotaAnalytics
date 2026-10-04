import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/current-session";
import { dota } from "@/lib/sources";
import "./globals.css";

const sans = Source_Sans_3({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin", "cyrillic"], weight: "400", variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Dota Analytics",
  description: "Игроки, матчи и герои Dota 2.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  let viewer: { name: string; avatar: string | null } | null = null;
  if (session) {
    try {
      const player = await dota.getPlayer(session.accountId);
      const name = player.data.profile?.personaname?.trim();
      viewer = { name: name || "Профиль", avatar: player.data.profile?.avatarfull ?? null };
    } catch {
      viewer = { name: "Профиль", avatar: null };
    }
  }
  return (
    <html lang="ru">
      <body className={`${sans.variable} ${mono.variable} ${sans.className}`}>
        <AppShell accountId={session?.accountId ?? null} viewer={viewer}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
