import {
  officialPatchLetter,
  type CountCell,
  type HeroStat,
  type PlayerHero,
  type RecentMatch,
  type TotalRow,
} from "@/lib/opendota";
import { dota } from "@/lib/sources";
import { gameModeLabel, laneRoleLabel, lobbyLabel, regionLabel } from "@/lib/labels";
import { kda, playerWon, sampleMark, wilsonLower, winRate } from "@/lib/stats";

export type Section<T> = { ok: true; data: T; fetchedAt: number } | { ok: false; message: string };

export type HeroRow = {
  heroId: number;
  name: string;
  img: string | null;
  games: number;
  wins: number;
  losses: number;
  winRate: number | null;
  wilson: number | null;
  lastPlayed: number;
  sample: "low" | "early" | "enough";
  badge: "stable" | "early-signal" | null;
};

export type CountRow = {
  id: number;
  label: string;
  games: number;
  wins: number;
  winRate: number | null;
};

export type Passport = {
  accountId: number;
  fetchedAt: number;
  profile: {
    persona: string;
    proName: string | null;
    avatar: string | null;
    profileUrl: string | null;
    steamId: string | null;
    lastMatch: string | null;
    rankTier: number | null;
    leaderboardRank: number | null;
    fullHistoryUnavailable: boolean;
  };
  patch: {
    bucketId: number | null;
    bucketName: string | null;
    bucketDate: string | null;
    letter: string | null;
    letterTitle: string | null;
  };
  record: Section<{ wins: number; losses: number; winRate: number | null }>;
  patchRecord: Section<{ wins: number; losses: number; winRate: number | null }>;
  recent: Section<{
    n: number;
    wins: number;
    losses: number;
    winRate: number | null;
    kda: number | null;
    avgKills: number | null;
    avgDeaths: number | null;
    avgAssists: number | null;
    avgDuration: number | null;
    lanes: CountRow[];
    topHeroes: { name: string; img: string | null; games: number; wins: number }[];
    marks: Array<"W" | "L">;
    played: {
      matchId: number;
      hero: string;
      img: string | null;
      won: boolean;
      kills: number;
      deaths: number;
      assists: number;
      duration: number;
      startTime: number;
      form: number;
      lobby: number;
      turbo: boolean;
    }[];
  }>;
  lifetime: Section<{ rows: { label: string; value: number; n: number }[] }>;
  heroes: Section<HeroRow[]>;
  patchHeroes: Section<HeroRow[]>;
  lanes: Section<CountRow[]>;
  modes: Section<CountRow[]>;
  lobbies: Section<CountRow[]>;
  factions: Section<CountRow[]>;
  regions: Section<CountRow[]>;
};

function section<T>(result: PromiseSettledResult<{ data: T; fetchedAt: number }>, label: string): Section<T> {
  if (result.status === "fulfilled") return { ok: true, data: result.value.data, fetchedAt: result.value.fetchedAt };
  const message = result.reason instanceof Error ? result.reason.message : `${label} недоступен`;
  return { ok: false, message };
}

function countRows(
  cells: Record<string, CountCell> | undefined,
  names: Map<number, string>,
  labelOf: (name: string | undefined) => string,
): CountRow[] {
  if (!cells) return [];
  return Object.entries(cells)
    .map(([id, cell]) => ({
      id: Number(id),
      label: labelOf(names.get(Number(id))),
      games: cell.games,
      wins: cell.win,
      winRate: winRate(cell.win, Math.max(cell.games - cell.win, 0)),
    }))
    .filter((row) => row.games > 0)
    .sort((a, b) => b.games - a.games);
}

function heroRows(heroes: PlayerHero[], catalog: Map<number, HeroStat>, baseline: number | null): HeroRow[] {
  const rows = heroes
    .filter((hero) => hero.games > 0)
    .map((hero) => {
      const meta = catalog.get(hero.hero_id);
      const losses = Math.max(hero.games - hero.win, 0);
      return {
        heroId: hero.hero_id,
        name: meta?.localized_name ?? `Герой ${hero.hero_id}`,
        img: meta?.img ? `https://cdn.cloudflare.steamstatic.com${meta.img}` : null,
        games: hero.games,
        wins: hero.win,
        losses,
        winRate: winRate(hero.win, losses),
        wilson: wilsonLower(hero.win, hero.games),
        lastPlayed: hero.last_played,
        sample: sampleMark(hero.games),
        badge: null as HeroRow["badge"],
      };
    });

  if (baseline === null) return rows.sort((a, b) => b.games - a.games);

  const stable = rows
    .filter((row) => row.sample === "enough" && row.wilson !== null && row.wilson > baseline)
    .sort((a, b) => (b.wilson ?? 0) - (a.wilson ?? 0))[0];
  if (stable) stable.badge = "stable";

  if (!stable) {
    const early = rows
      .filter((row) => row.sample === "early" && row.wilson !== null && row.wilson > baseline)
      .sort((a, b) => (b.wilson ?? 0) - (a.wilson ?? 0))[0];
    if (early) early.badge = "early-signal";
  }

  return rows.sort((a, b) => b.games - a.games);
}

const TOTAL_LABELS: Record<string, string> = {
  kills: "Убийства",
  deaths: "Смерти",
  assists: "Помощи",
  gold_per_min: "GPM",
  xp_per_min: "XPM",
  last_hits: "Ластхиты",
  denies: "Денаи",
  duration: "Длительность",
  hero_damage: "Урон по героям",
  tower_damage: "Урон по строениям",
  hero_healing: "Лечение",
};

function lifetimeRows(totals: TotalRow[]) {
  return totals
    .filter((row) => TOTAL_LABELS[row.field] && row.n > 0)
    .map((row) => ({
      label: TOTAL_LABELS[row.field],
      value: row.sum / row.n,
      n: row.n,
    }));
}

function recentSummary(matches: RecentMatch[], catalog: Map<number, HeroStat>) {
  const n = matches.length;
  const wins = matches.filter((match) => playerWon(match.player_slot, match.radiant_win)).length;
  const losses = n - wins;
  const sum = matches.reduce(
    (acc, match) => {
      acc.kills += match.kills;
      acc.deaths += match.deaths;
      acc.assists += match.assists;
      acc.duration += match.duration;
      return acc;
    },
    { kills: 0, deaths: 0, assists: 0, duration: 0 },
  );
  const lanes = new Map<number, CountCell>();
  const heroCounts = new Map<number, { games: number; wins: number }>();
  for (const match of matches) {
    const lane = match.lane_role ?? 0;
    const cell = lanes.get(lane) ?? { games: 0, win: 0 };
    cell.games += 1;
    if (playerWon(match.player_slot, match.radiant_win)) cell.win += 1;
    lanes.set(lane, cell);
    const hero = heroCounts.get(match.hero_id) ?? { games: 0, wins: 0 };
    hero.games += 1;
    if (playerWon(match.player_slot, match.radiant_win)) hero.wins += 1;
    heroCounts.set(match.hero_id, hero);
  }
  return {
    n,
    wins,
    losses,
    winRate: winRate(wins, losses),
    kda: n ? kda(sum.kills, sum.deaths, sum.assists) : null,
    avgKills: n ? sum.kills / n : null,
    avgDeaths: n ? sum.deaths / n : null,
    avgAssists: n ? sum.assists / n : null,
    avgDuration: n ? sum.duration / n : null,
    lanes: [...lanes.entries()]
      .map(([id, cell]) => ({
        id,
        label: laneRoleLabel(id),
        games: cell.games,
        wins: cell.win,
        winRate: winRate(cell.win, cell.games - cell.win),
      }))
      .sort((a, b) => b.games - a.games),
    topHeroes: [...heroCounts.entries()]
      .map(([id, cell]) => {
        const meta = catalog.get(id);
        return {
          name: meta?.localized_name ?? `Герой ${id}`,
          img: meta?.img ? `https://cdn.cloudflare.steamstatic.com${meta.img}` : null,
          games: cell.games,
          wins: cell.wins,
        };
      })
      .sort((a, b) => b.games - a.games)
      .slice(0, 8),
    marks: matches.map((match) => (playerWon(match.player_slot, match.radiant_win) ? "W" : "L")),
    played: matches.map((match) => {
      const meta = catalog.get(match.hero_id);
      const won = playerWon(match.player_slot, match.radiant_win);
      return {
        matchId: match.match_id,
        hero: meta?.localized_name ?? `Герой ${match.hero_id}`,
        img: meta?.img ? `https://cdn.cloudflare.steamstatic.com${meta.img}` : null,
        won,
        kills: match.kills,
        deaths: match.deaths,
        assists: match.assists,
        duration: match.duration,
        startTime: match.start_time,
        form: (match.kills + match.assists) / Math.max(match.deaths, 1),
        lobby: match.lobby_type,
        turbo: match.game_mode === 23,
      };
    }),
  };
}

export async function loadPassport(accountId: number): Promise<Passport> {
  const [playerR, patchesR, modesR, lobbiesR, regionsR, catalogR, letterR] = await Promise.allSettled([
    dota.getPlayer(accountId),
    dota.getPatches(),
    dota.getGameModes(),
    dota.getLobbyTypes(),
    dota.getRegions(),
    dota.getHeroCatalog(),
    officialPatchLetter(),
  ]);

  if (playerR.status === "rejected") {
    const message = playerR.reason instanceof Error ? playerR.reason.message : "Профиль недоступен";
    throw new Error(message);
  }

  const player = playerR.value.data;
  if (!player.profile) {
    throw new Error("OpenDota не нашёл профиль по этому account id.");
  }

  const patches = patchesR.status === "fulfilled" ? patchesR.value.data : [];
  const bucket = [...patches].sort((a, b) => a.id - b.id).at(-1) ?? null;
  const letter = letterR.status === "fulfilled" ? letterR.value : { letter: null, title: null };

  const catalog = new Map<number, HeroStat>();
  if (catalogR.status === "fulfilled") {
    for (const hero of catalogR.value.data) catalog.set(hero.id, hero);
  }

  const modeNames = new Map<number, string>();
  if (modesR.status === "fulfilled") {
    for (const mode of Object.values(modesR.value.data)) modeNames.set(mode.id, mode.name);
  }
  const lobbyNames = new Map<number, string>();
  if (lobbiesR.status === "fulfilled") {
    for (const lobby of Object.values(lobbiesR.value.data)) lobbyNames.set(lobby.id, lobby.name);
  }
  const regionNames = new Map<number, string>();
  if (regionsR.status === "fulfilled") {
    for (const [id, name] of Object.entries(regionsR.value.data)) regionNames.set(Number(id), name);
  }

  const [recordR, patchRecordR, recentR, heroesR, patchHeroesR, totalsR, countsR] = await Promise.allSettled([
    dota.getWinLoss(accountId),
    bucket ? dota.getWinLoss(accountId, bucket.id) : Promise.reject(new Error("Таблица патчей недоступна")),
    dota.getRecentMatches(accountId),
    dota.getPlayerHeroes(accountId),
    bucket ? dota.getPlayerHeroes(accountId, bucket.id) : Promise.reject(new Error("Таблица патчей недоступна")),
    dota.getTotals(accountId),
    dota.getCounts(accountId),
  ]);

  const recordSection = section(recordR, "Победы и поражения");
  const baseline =
    recordSection.ok && recordSection.data.win + recordSection.data.lose > 0
      ? recordSection.data.win / (recordSection.data.win + recordSection.data.lose)
      : null;

  const recentSection = section(recentR, "Последние матчи");
  const heroesSection = section(heroesR, "Герои");
  const patchHeroesSection = section(patchHeroesR, "Герои патча");
  const totalsSection = section(totalsR, "Средние");
  const countsSection = section(countsR, "Режимы");

  return {
    accountId,
    fetchedAt: playerR.value.fetchedAt,
    profile: {
      persona: player.profile.personaname || "Без ника",
      proName: player.profile.name,
      avatar: player.profile.avatarfull,
      profileUrl: player.profile.profileurl,
      steamId: player.profile.steamid,
      lastMatch: player.profile.last_match_time,
      rankTier: player.rank_tier,
      leaderboardRank: player.leaderboard_rank,
      fullHistoryUnavailable: Boolean(player.profile.fh_unavailable),
    },
    patch: {
      bucketId: bucket?.id ?? null,
      bucketName: bucket?.name ?? null,
      bucketDate: bucket?.date ?? null,
      letter: letter.letter,
      letterTitle: letter.title,
    },
    record: recordSection.ok
      ? {
          ok: true,
          fetchedAt: recordSection.fetchedAt,
          data: {
            wins: recordSection.data.win,
            losses: recordSection.data.lose,
            winRate: winRate(recordSection.data.win, recordSection.data.lose),
          },
        }
      : recordSection,
    patchRecord: (() => {
      const parsed = section(patchRecordR, "Патч");
      if (!parsed.ok) return parsed;
      return {
        ok: true as const,
        fetchedAt: parsed.fetchedAt,
        data: {
          wins: parsed.data.win,
          losses: parsed.data.lose,
          winRate: winRate(parsed.data.win, parsed.data.lose),
        },
      };
    })(),
    recent: recentSection.ok
      ? { ok: true, fetchedAt: recentSection.fetchedAt, data: recentSummary(recentSection.data, catalog) }
      : recentSection,
    lifetime: totalsSection.ok
      ? { ok: true, fetchedAt: totalsSection.fetchedAt, data: { rows: lifetimeRows(totalsSection.data) } }
      : totalsSection,
    heroes: heroesSection.ok
      ? { ok: true, fetchedAt: heroesSection.fetchedAt, data: heroRows(heroesSection.data, catalog, baseline) }
      : heroesSection,
    patchHeroes: patchHeroesSection.ok
      ? {
          ok: true,
          fetchedAt: patchHeroesSection.fetchedAt,
          data: heroRows(patchHeroesSection.data, catalog, null),
        }
      : patchHeroesSection,
    lanes: countsSection.ok
      ? {
          ok: true,
          fetchedAt: countsSection.fetchedAt,
          data: Object.entries(countsSection.data.lane_role ?? {})
            .map(([id, cell]) => ({
              id: Number(id),
              label: laneRoleLabel(Number(id)),
              games: cell.games,
              wins: cell.win,
              winRate: winRate(cell.win, Math.max(cell.games - cell.win, 0)),
            }))
            .filter((row) => row.games > 0)
            .sort((a, b) => b.games - a.games),
        }
      : countsSection,
    modes: countsSection.ok
      ? {
          ok: true,
          fetchedAt: countsSection.fetchedAt,
          data: countRows(countsSection.data.game_mode, modeNames, gameModeLabel),
        }
      : countsSection,
    lobbies: countsSection.ok
      ? {
          ok: true,
          fetchedAt: countsSection.fetchedAt,
          data: countRows(countsSection.data.lobby_type, lobbyNames, lobbyLabel),
        }
      : countsSection,
    factions: countsSection.ok
      ? {
          ok: true,
          fetchedAt: countsSection.fetchedAt,
          data: [1, 0].flatMap((id) => {
            const cell = countsSection.data.is_radiant?.[String(id)];
            if (!cell || cell.games <= 0) return [];
            return [
              {
                id,
                label: id === 1 ? "Radiant" : "Dire",
                games: cell.games,
                wins: cell.win,
                winRate: winRate(cell.win, Math.max(cell.games - cell.win, 0)),
              },
            ];
          }),
        }
      : countsSection,
    regions: countsSection.ok
      ? {
          ok: true,
          fetchedAt: countsSection.fetchedAt,
          data: countRows(countsSection.data.region, regionNames, regionLabel),
        }
      : countsSection,
  };
}

export function historyClosed(passport: Passport): boolean {
  if (passport.profile.fullHistoryUnavailable) return true;
  if (!passport.record.ok || !passport.recent.ok || !passport.heroes.ok) return false;
  const games = passport.record.data.wins + passport.record.data.losses;
  return games === 0 && passport.recent.data.played.length === 0 && passport.heroes.data.length === 0;
}

export function sortHeroes(rows: HeroRow[], sort: string | undefined): HeroRow[] {
  const copy = [...rows];
  if (sort === "robust") {
    return copy.sort((a, b) => {
      const aEligible = a.games >= 20 ? (a.wilson ?? -1) : -1;
      const bEligible = b.games >= 20 ? (b.wilson ?? -1) : -1;
      return bEligible - aEligible || b.games - a.games;
    });
  }
  if (sort === "raw") {
    return copy.sort((a, b) => {
      const eligibleA = a.games >= 20 ? 1 : 0;
      const eligibleB = b.games >= 20 ? 1 : 0;
      if (eligibleA !== eligibleB) return eligibleB - eligibleA;
      return (b.winRate ?? 0) - (a.winRate ?? 0);
    });
  }
  return copy.sort((a, b) => b.games - a.games);
}
