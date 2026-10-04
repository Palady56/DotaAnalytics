import { duoRelation, playerWonRow } from "@/lib/matches";
import { officialPatchLetter, type HeroStat, type Peer, type PlayerMatchRow } from "@/lib/opendota";
import { dota } from "@/lib/sources";
import { laneRoleLabel } from "@/lib/labels";
import { formatNumber, formatPercent, wilsonInterval, winRate } from "@/lib/stats";

export const DUO_WINDOW = 100;
export const PAIR_BADGE_N = 15;
export const SCORE_SUPPORT_N = 30;
const SCORE_PRIOR = 30;

export function parseAccountId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0 || id > 4_294_967_295) return null;
  return id;
}

export function duoPath(a: number, b: number): string {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return `/duo/${lo}/${hi}`;
}

export function comparePath(a: number, b: number): string {
  const params = new URLSearchParams({ a: String(a), b: String(b) });
  return `/compare?${params.toString()}`;
}

function logit(p: number): number | null {
  if (!(p > 0 && p < 1)) return null;
  return Math.log(p / (1 - p));
}

export function expectedIndependent(pA: number, pB: number): number | null {
  const left = logit(pA);
  const right = logit(pB);
  const coin = logit(0.5);
  if (left === null || right === null || coin === null) return null;
  const combined = left + right - coin;
  const value = 1 / (1 + Math.exp(-combined));
  return Number.isFinite(value) ? value : null;
}

export type SynergyStatus = "none" | "inconclusive" | "above" | "below";

export type Synergy = {
  n: number;
  wins: number;
  observed: number | null;
  lower: number | null;
  upper: number | null;
  nA: number;
  pA: number | null;
  nB: number;
  pB: number | null;
  expected: number | null;
  average: number | null;
  delta: number | null;
  weight: number | null;
  score: number | null;
  status: SynergyStatus;
  reason: string;
};

export function synergyScore(input: {
  wins: number;
  n: number;
  pA: number | null;
  nA: number;
  pB: number | null;
  nB: number;
}): Synergy {
  const observed = winRate(input.wins, Math.max(input.n - input.wins, 0));
  const interval = wilsonInterval(input.wins, input.n);
  const base: Synergy = {
    n: input.n,
    wins: input.wins,
    observed,
    lower: interval?.lower ?? null,
    upper: interval?.upper ?? null,
    nA: input.nA,
    pA: input.pA,
    nB: input.nB,
    pB: input.pB,
    expected: null,
    average: input.pA !== null && input.pB !== null ? (input.pA + input.pB) / 2 : null,
    delta: null,
    weight: null,
    score: null,
    status: "none",
    reason: "В окне нет матчей одной команды, оценка не считается.",
  };
  if (input.n <= 0 || observed === null) return base;
  if (input.pA === null || input.pB === null || input.nA <= 0 || input.nB <= 0) {
    return {
      ...base,
      status: "inconclusive",
      reason: "Личный винрейт одного из игроков в этом окне не собрался, ожидание не считается.",
    };
  }
  const expected = expectedIndependent(input.pA, input.pB);
  if (expected === null) {
    return {
      ...base,
      status: "inconclusive",
      reason: "Ожидание не посчитано: логит не определён, когда личный винрейт равен 0% или 100%.",
    };
  }
  const delta = observed - expected;
  const weight = input.n / (input.n + SCORE_PRIOR);
  const score = Math.min(100, Math.max(0, 50 + 100 * weight * delta));
  let status: SynergyStatus = "inconclusive";
  let reason = "Интервал Уилсона пересекает ожидание. Это не вывод «вместе лучше».";
  if (input.n < SCORE_SUPPORT_N) {
    reason = `Матчей одной команды ${input.n}, для вывода нужно ${SCORE_SUPPORT_N}. Число на шкале сжато к 50 и остаётся невыводом.`;
  } else if (interval && interval.lower > expected) {
    status = "above";
    reason = "Нижняя граница Уилсона выше ожидания модели независимости. Это не прогноз следующего матча.";
  } else if (interval && interval.upper < expected) {
    status = "below";
    reason = "Верхняя граница Уилсона ниже ожидания модели независимости. Это не прогноз следующего матча.";
  }
  return {
    ...base,
    expected,
    delta,
    weight,
    score,
    status,
    reason,
  };
}

type RecordSlice = { n: number; wins: number; winRate: number | null };

function recordOf(rows: PlayerMatchRow[], exclude: Set<number>): RecordSlice {
  const kept = rows.filter((row) => !exclude.has(row.match_id));
  const wins = kept.filter((row) => playerWonRow(row)).length;
  return { n: kept.length, wins, winRate: winRate(wins, kept.length - wins) };
}

export type HeroPair = {
  heroA: number;
  heroB: number;
  nameA: string;
  nameB: string;
  imgA: string | null;
  imgB: string | null;
  games: number;
  wins: number;
  winRate: number | null;
  wilson: number | null;
  mostPlayed: boolean;
  best: boolean;
  worst: boolean;
};

export type LanePair = {
  laneA: number;
  laneB: number;
  labelA: string;
  labelB: string;
  games: number;
  wins: number;
  winRate: number | null;
  uniqueHeroPairs: number;
  avgDuration: number | null;
};

export type SharedMatch = {
  matchId: number;
  startTime: number | null;
  duration: number | null;
  won: boolean;
  side: "same" | "against";
  heroA: string;
  heroB: string;
  imgA: string | null;
  imgB: string | null;
  kills: number;
  deaths: number;
  assists: number;
  killsB: number | null;
  deathsB: number | null;
  assistsB: number | null;
  laneA: string | null;
  laneB: string | null;
};

export type DuoWindow = {
  limit: number;
  truncated: boolean;
  stale: boolean;
  lanesKnown: number;
  same: SharedMatch[];
  against: SharedMatch[];
  unknown: number;
  avgDuration: number | null;
  pairs: HeroPair[];
  lanes: LanePair[];
  synergy: Synergy;
  trend: { recent: RecordSlice; previous: RecordSlice } | null;
  personalA: RecordSlice;
  personalB: RecordSlice;
  personalTruncated: boolean;
};

export type DuoReport = {
  a: number;
  b: number;
  names: { a: string; b: string };
  avatars: { a: string | null; b: string | null };
  ranks: {
    a: { tier: number | null; place: number | null };
    b: { tier: number | null; place: number | null };
  };
  bucket: { id: number; name: string; date: string | null } | null;
  letter: string | null;
  peers: {
    ok: true;
    stale: boolean;
    listSize: number;
    row: Peer | null;
  } | { ok: false; message: string };
  window: DuoWindow | null;
  windowError: string | null;
};

function heroName(catalog: Map<number, HeroStat>, id: number | null): string {
  if (!id) return "герой не пришёл";
  return catalog.get(id)?.localized_name ?? `Герой ${id}`;
}

function heroImg(catalog: Map<number, HeroStat>, id: number | null): string | null {
  const img = id ? catalog.get(id)?.img : undefined;
  return img ? `https://cdn.cloudflare.steamstatic.com${img}` : null;
}

function sideHero(row: PlayerMatchRow, accountId: number): number | null {
  const found = Object.values(row.heroes ?? {}).find((player) => player.account_id === accountId);
  return found?.hero_id ?? row.hero_id ?? null;
}

export async function loadDuo(a: number, b: number): Promise<DuoReport> {
  const [playerA, playerB, peersR, patchesR, letterR, catalogR] = await Promise.allSettled([
    dota.getPlayer(a),
    dota.getPlayer(b),
    dota.getPeers(a),
    dota.getPatches(),
    officialPatchLetter(),
    dota.getHeroCatalog(),
  ]);

  const nameOf = (result: PromiseSettledResult<Awaited<ReturnType<typeof dota.getPlayer>>>, id: number) => {
    if (result.status !== "fulfilled") return `account ${id}`;
    return result.value.data.profile?.personaname || `account ${id}`;
  };
  const avatarOf = (result: PromiseSettledResult<Awaited<ReturnType<typeof dota.getPlayer>>>) =>
    result.status === "fulfilled" ? result.value.data.profile?.avatarfull ?? null : null;
  const rankOf = (result: PromiseSettledResult<Awaited<ReturnType<typeof dota.getPlayer>>>) =>
    result.status === "fulfilled"
      ? { tier: result.value.data.rank_tier, place: result.value.data.leaderboard_rank }
      : { tier: null, place: null };
  const names = { a: nameOf(playerA, a), b: nameOf(playerB, b) };
  const avatars = { a: avatarOf(playerA), b: avatarOf(playerB) };
  const ranks = { a: rankOf(playerA), b: rankOf(playerB) };

  const bucket =
    patchesR.status === "fulfilled"
      ? [...patchesR.value.data].sort((left, right) => left.id - right.id).at(-1) ?? null
      : null;
  const catalog = new Map<number, HeroStat>();
  if (catalogR.status === "fulfilled") {
    for (const hero of catalogR.value.data) catalog.set(hero.id, hero);
  }

  const peers =
    peersR.status === "fulfilled"
      ? {
          ok: true as const,
          stale: peersR.value.stale,
          listSize: peersR.value.data.length,
          row: peersR.value.data.find((peer) => peer.account_id === b) ?? null,
        }
      : {
          ok: false as const,
          message: peersR.reason instanceof Error ? peersR.reason.message : "Сводка peers не загрузилась.",
        };

  const query = { limit: DUO_WINDOW, offset: 0, significant: 0 as const };
  const [sharedA, sharedB, soloA, soloB] = await Promise.allSettled([
    dota.getPlayerMatches(a, { ...query, includedAccountId: b }),
    dota.getPlayerMatches(b, { ...query, includedAccountId: a }),
    dota.getPlayerMatches(a, query),
    dota.getPlayerMatches(b, query),
  ]);

  if (sharedA.status === "rejected") {
    return {
      a,
      b,
      names,
      avatars,
      ranks,
      bucket: bucket ? { id: bucket.id, name: bucket.name, date: bucket.date } : null,
      letter: letterR.status === "fulfilled" ? letterR.value.letter : null,
      peers,
      window: null,
      windowError:
        sharedA.reason instanceof Error
          ? `${sharedA.reason.message} Грубая сводка peers, если она есть выше, не заменяет список матчей.`
          : "Точный список общих матчей не собран.",
    };
  }

  const mirror = new Map<number, PlayerMatchRow>();
  if (sharedB.status === "fulfilled") {
    for (const row of sharedB.value.data) mirror.set(row.match_id, row);
  }

  const same: SharedMatch[] = [];
  const against: SharedMatch[] = [];
  let unknown = 0;
  let lanesKnown = 0;
  const pairMap = new Map<string, { heroA: number; heroB: number; games: number; wins: number }>();
  const laneMap = new Map<
    string,
    { laneA: number; laneB: number; games: number; wins: number; duration: number; heroes: Set<string> }
  >();

  for (const row of sharedA.value.data) {
    const relation = duoRelation(row.heroes, a, b);
    if (relation !== "same" && relation !== "against") {
      unknown += 1;
      continue;
    }
    const heroAId = row.hero_id ?? sideHero(row, a);
    const heroBId = sideHero(row, b);
    const other = mirror.get(row.match_id);
    const laneA = row.lane_role ?? null;
    const laneB = other?.lane_role ?? null;
    const fact: SharedMatch = {
      matchId: row.match_id,
      startTime: row.start_time ?? null,
      duration: row.duration ?? null,
      won: playerWonRow(row),
      side: relation,
      heroA: heroName(catalog, heroAId),
      heroB: heroName(catalog, heroBId),
      imgA: heroImg(catalog, heroAId),
      imgB: heroImg(catalog, heroBId),
      kills: row.kills ?? 0,
      deaths: row.deaths ?? 0,
      assists: row.assists ?? 0,
      killsB: other?.kills ?? null,
      deathsB: other?.deaths ?? null,
      assistsB: other?.assists ?? null,
      laneA: laneA === null ? null : laneRoleLabel(laneA),
      laneB: laneB === null ? null : laneRoleLabel(laneB),
    };
    if (relation === "against") {
      against.push(fact);
      continue;
    }
    same.push(fact);
    if (laneA !== null && laneA !== 0 && laneB !== null && laneB !== 0) lanesKnown += 1;
    if (heroAId && heroBId) {
      const key = `${heroAId}:${heroBId}`;
      const cell = pairMap.get(key) ?? { heroA: heroAId, heroB: heroBId, games: 0, wins: 0 };
      cell.games += 1;
      if (fact.won) cell.wins += 1;
      pairMap.set(key, cell);
    }
    if (laneA !== null && laneA !== 0 && laneB !== null && laneB !== 0 && heroAId && heroBId) {
      const key = `${laneA}:${laneB}`;
      const cell = laneMap.get(key) ?? { laneA, laneB, games: 0, wins: 0, duration: 0, heroes: new Set<string>() };
      cell.games += 1;
      if (fact.won) cell.wins += 1;
      cell.duration += row.duration ?? 0;
      cell.heroes.add(`${heroAId}:${heroBId}`);
      laneMap.set(key, cell);
    }
  }

  const sharedIds = new Set(sharedA.value.data.map((row) => row.match_id));
  const personalA = soloA.status === "fulfilled" ? recordOf(soloA.value.data, sharedIds) : { n: 0, wins: 0, winRate: null };
  const personalB = soloB.status === "fulfilled" ? recordOf(soloB.value.data, sharedIds) : { n: 0, wins: 0, winRate: null };
  const sameWins = same.filter((match) => match.won).length;
  const synergy = synergyScore({
    wins: sameWins,
    n: same.length,
    pA: personalA.winRate,
    nA: personalA.n,
    pB: personalB.winRate,
    nB: personalB.n,
  });

  const pairs = [...pairMap.values()]
    .map((pair) => ({
      ...pair,
      nameA: heroName(catalog, pair.heroA),
      nameB: heroName(catalog, pair.heroB),
      imgA: heroImg(catalog, pair.heroA),
      imgB: heroImg(catalog, pair.heroB),
      winRate: winRate(pair.wins, pair.games - pair.wins),
      wilson: wilsonInterval(pair.wins, pair.games)?.lower ?? null,
      mostPlayed: false,
      best: false,
      worst: false,
    }))
    .sort((left, right) => right.games - left.games || (right.wilson ?? -1) - (left.wilson ?? -1));
  const eligible = pairs.filter((pair) => pair.games >= PAIR_BADGE_N);
  if (eligible.length > 0) {
    eligible.slice().sort((left, right) => right.games - left.games)[0].mostPlayed = true;
  }
  if (eligible.length >= 2) {
    const byWilson = eligible.slice().sort((left, right) => (right.wilson ?? -1) - (left.wilson ?? -1));
    byWilson[0].best = true;
    byWilson[byWilson.length - 1].worst = true;
  }

  const lanes = [...laneMap.values()]
    .map((lane) => ({
      laneA: lane.laneA,
      laneB: lane.laneB,
      labelA: laneRoleLabel(lane.laneA),
      labelB: laneRoleLabel(lane.laneB),
      games: lane.games,
      wins: lane.wins,
      winRate: winRate(lane.wins, lane.games - lane.wins),
      uniqueHeroPairs: lane.heroes.size,
      avgDuration: lane.games ? lane.duration / lane.games : null,
    }))
    .sort((left, right) => right.games - left.games);

  const ordered = [...same].sort((left, right) => (right.startTime ?? 0) - (left.startTime ?? 0));
  const trend =
    ordered.length >= 40
      ? {
          recent: {
            n: 20,
            wins: ordered.slice(0, 20).filter((match) => match.won).length,
            winRate: winRate(
              ordered.slice(0, 20).filter((match) => match.won).length,
              20 - ordered.slice(0, 20).filter((match) => match.won).length,
            ),
          },
          previous: {
            n: 20,
            wins: ordered.slice(20, 40).filter((match) => match.won).length,
            winRate: winRate(
              ordered.slice(20, 40).filter((match) => match.won).length,
              20 - ordered.slice(20, 40).filter((match) => match.won).length,
            ),
          },
        }
      : null;

  const durations = same.map((match) => match.duration).filter((value): value is number => value !== null);

  return {
    a,
    b,
    names,
    avatars,
    ranks,
    bucket: bucket ? { id: bucket.id, name: bucket.name, date: bucket.date } : null,
    letter: letterR.status === "fulfilled" ? letterR.value.letter : null,
    peers,
    windowError: null,
    window: {
      limit: DUO_WINDOW,
      truncated: sharedA.value.data.length >= DUO_WINDOW,
      stale:
        sharedA.value.stale ||
        (sharedB.status === "fulfilled" && sharedB.value.stale) ||
        (soloA.status === "fulfilled" && soloA.value.stale) ||
        (soloB.status === "fulfilled" && soloB.value.stale),
      lanesKnown,
      same,
      against,
      unknown,
      avgDuration: durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null,
      pairs,
      lanes,
      synergy,
      trend,
      personalA,
      personalB,
      personalTruncated:
        (soloA.status === "fulfilled" && soloA.value.data.length >= DUO_WINDOW) ||
        (soloB.status === "fulfilled" && soloB.value.data.length >= DUO_WINDOW),
    },
  };
}

export function duoBlurb(report: DuoReport): string {
  if (!report.window) {
    return `${report.names.a} и ${report.names.b}. Общие матчи не собраны. Это дуэт, не сравнение профилей.`;
  }
  const same = report.window.same.length;
  const against = report.window.against.length;
  const rate = formatPercent(report.window.synergy.observed);
  return `${report.names.a} и ${report.names.b}. Последние общие матчи: одна команда ${rate}, ${formatNumber(same)} игр, соперники ${formatNumber(against)}.`;
}
