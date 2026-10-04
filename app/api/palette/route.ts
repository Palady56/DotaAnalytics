import { NextResponse } from "next/server";
import { findHeroes } from "@/lib/meta";
import { SourceError } from "@/lib/opendota";
import { dota } from "@/lib/sources";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ heroes: [], players: [], heroError: null, playerError: null });
  }

  const [heroesR, playersR] = await Promise.allSettled([
    dota.getHeroCatalog().then((result) => findHeroes(result.data, query, 6)),
    dota.searchPlayers(query).then((result) =>
      result.data.slice(0, 6).map((hit) => ({
        id: hit.account_id,
        name: hit.personaname || `account ${hit.account_id}`,
        avatar: hit.avatarfull,
        lastMatch: hit.last_match_time,
      })),
    ),
  ]);

  return NextResponse.json({
    heroes: heroesR.status === "fulfilled" ? heroesR.value : [],
    players: playersR.status === "fulfilled" ? playersR.value : [],
    heroError: heroesR.status === "rejected" ? message(heroesR.reason, "Каталог героев не ответил.") : null,
    playerError: playersR.status === "rejected" ? message(playersR.reason, "Поиск OpenDota не ответил.") : null,
  });
}

function message(caught: unknown, fallback: string) {
  return caught instanceof SourceError ? caught.message : fallback;
}
