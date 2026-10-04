import { laneRoleLabel } from "./labels";
import { formatDuration, formatNumber, formatPercent, kda, playerWon, winRate } from "./stats";

/** Product rules from STATISTICAL_RULES.md. Not a significance test. */
export const EVOLUTION_WINDOW = 100;
export const EVOLUTION_ASSERT_N = 20;
export const EVOLUTION_HERO_TREND_N = 15;
export const RULES_VERSION = 1;

const NO_DIFFERENCE = "В этих двух окнах заметных отличий по правилам порога нет.";

export type EvolutionMatch = {
  matchId: number;
  startTime: number | null;
  won: boolean | null;
  heroId: number | null;
  durationSec: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  gpm: number | null;
  xpm: number | null;
  laneRole: number | null;
  roaming: boolean;
};

export type PatchRef = { id: number; name: string; date: string };

type PreparedPatch = { id: number; name: string; startMs: number };

export type LaneCount = {
  role: 1 | 2 | 3 | 4;
  label: string;
  n: number;
  share: number;
};

export type PeriodSummary = {
  label: string;
  n: number;
  wins: number;
  losses: number;
  resultsKnown: number;
  winRate: number | null;
  uniqueHeroes: number;
  topHero: { heroId: number; name: string; games: number; share: number } | null;
  avgDurationSec: number | null;
  durationKnown: number;
  kda: { value: number; kills: number; deaths: number; assists: number; known: number } | null;
  gpm: { value: number | null; known: number };
  xpm: { value: number | null; known: number };
  lanes: LaneCount[];
  knownLanes: number;
  unknownLanes: number;
  roaming: number;
  mainLane: { role: 1 | 2 | 3 | 4; label: string; share: number } | null;
  patches: { id: number; name: string }[];
};

export type HeroEvolution = {
  heroId: number;
  name: string;
  currentGames: number;
  currentWins: number;
  currentKnown: number;
  currentWinRate: number | null;
  previousGames: number | null;
  previousWins: number | null;
  previousKnown: number | null;
  previousWinRate: number | null;
  comparable: boolean;
  delta: number | null;
};

export type PatchColumn = {
  id: number;
  name: string;
  n: number;
  wins: number;
  losses: number;
  resultsKnown: number;
  winRate: number | null;
  uniqueHeroes: number;
  heroIds: number[];
  newHeroes: number | null;
  knownLanes: number;
  mainLane: PeriodSummary["mainLane"];
  asserted: boolean;
};

export type EvolutionSnapshot = {
  accountId: number;
  capturedAt: number;
  sourceFetchedAt: number;
  patchLetter: string | null;
  patchBucketId: number | null;
  slice: string;
  windowKind: string;
  matches: number;
  wins: number;
  heroPoolSize: number;
  topHeroes: { heroId: number; games: number; wins: number }[];
  laneCounts: { role: number | "roaming" | "unknown"; n: number }[];
  avgDurationSec: number | null;
  kdaKnown: { known: number; of: number; kills: number; deaths: number; assists: number } | null;
};

export type SnapshotDelta = {
  matchDelta: number;
  winRateDelta: number | null;
  heroPoolDelta: number;
  topHeroFrom: number | null;
  topHeroTo: number | null;
};

export type EvolutionMode = "20" | "50" | "patch";

export function resolveEvolutionMode(input: {
  requested: string | undefined;
  dated: number;
  patchCount: number;
}): { mode: EvolutionMode; show20: boolean; show50: boolean; showPatch: boolean } {
  const show20 = input.dated >= 40;
  const show50 = input.dated >= 100;
  const showPatch = input.patchCount >= 2;
  const asked = input.requested === "20" || input.requested === "50" || input.requested === "patch" ? input.requested : null;
  const mode: EvolutionMode =
    asked === "50" && show50 ? "50" : asked === "patch" && showPatch ? "patch" : asked === "20" && show20 ? "20" : show20 ? "20" : showPatch ? "patch" : "20";
  return { mode, show20, show50, showPatch };
}

export function formatRateDelta(current: number, previous: number): string {
  return signedPoints(current, previous);
}

export type EvolutionReport = {
  rulesVersion: number;
  loaded: number;
  dated: number;
  undated: number;
  unpatched: number;
  sliceLabel: string;
  mode: EvolutionMode;
  comparison: "ready" | "unavailable";
  unavailableReason: string | null;
  current: PeriodSummary | null;
  previous: PeriodSummary | null;
  changes: string[];
  heroes: HeroEvolution[];
  adopted: { heroId: number; name: string; games: number }[];
  dropped: { heroId: number; name: string; games: number }[];
  lanes: {
    role: 1 | 2 | 3 | 4 | "roaming" | "unknown";
    label: string;
    currentN: number;
    previousN: number | null;
    currentShare: number | null;
    previousShare: number | null;
  }[];
  patches: PatchColumn[];
  chartReady: boolean;
  loadedPeriod: PeriodSummary;
};

type HeroCell = { games: number; wins: number; known: number };

export function preparePatches(patches: PatchRef[]): PreparedPatch[] {
  return patches
    .map((patch) => ({ id: patch.id, name: patch.name, startMs: Date.parse(patch.date) }))
    .filter((patch) => Number.isFinite(patch.startMs))
    .sort((left, right) => left.startMs - right.startMs || left.id - right.id);
}

/** startTime is unix seconds. A missing or unparseable date does not borrow the nearest patch. */
export function patchAt(startTime: number | null, patches: PreparedPatch[]): PreparedPatch | null {
  if (startTime === null || !Number.isFinite(startTime)) return null;
  const ms = startTime * 1000;
  let found: PreparedPatch | null = null;
  for (const patch of patches) {
    if (patch.startMs <= ms) found = patch;
    else break;
  }
  return found;
}

export function fromPlayerMatch(row: {
  match_id: number;
  player_slot?: number;
  radiant_win?: boolean;
  start_time?: number | null;
  hero_id?: number | null;
  duration?: number | null;
  kills?: number | null;
  deaths?: number | null;
  assists?: number | null;
  gold_per_min?: number | null;
  xp_per_min?: number | null;
  lane_role?: number | null;
  is_roaming?: boolean | null;
}): EvolutionMatch {
  const slot = row.player_slot;
  const radiant = row.radiant_win;
  return {
    matchId: row.match_id,
    startTime: finite(row.start_time),
    won: typeof slot === "number" && typeof radiant === "boolean" ? playerWon(slot, radiant) : null,
    heroId: finite(row.hero_id),
    durationSec: finite(row.duration),
    kills: finite(row.kills),
    deaths: finite(row.deaths),
    assists: finite(row.assists),
    gpm: finite(row.gold_per_min),
    xpm: finite(row.xp_per_min),
    laneRole: finite(row.lane_role),
    roaming: row.is_roaming === true,
  };
}

export function snapshotFromPeriod(input: {
  accountId: number;
  capturedAt: number;
  sourceFetchedAt: number;
  patchLetter: string | null;
  patchBucketId: number | null;
  slice: string;
  windowKind: string;
  period: PeriodSummary;
  heroes: HeroEvolution[];
}): EvolutionSnapshot {
  const top = input.heroes
    .filter((hero) => hero.currentGames > 0)
    .slice()
    .sort((left, right) => right.currentGames - left.currentGames || left.heroId - right.heroId)
    .slice(0, 5);
  return {
    accountId: input.accountId,
    capturedAt: input.capturedAt,
    sourceFetchedAt: input.sourceFetchedAt,
    patchLetter: input.patchLetter,
    patchBucketId: input.patchBucketId,
    slice: input.slice,
    windowKind: input.windowKind,
    matches: input.period.n,
    wins: input.period.wins,
    heroPoolSize: input.period.uniqueHeroes,
    topHeroes: top.map((hero) => ({ heroId: hero.heroId, games: hero.currentGames, wins: hero.currentWins })),
    laneCounts: [
      ...input.period.lanes.map((lane) => ({ role: lane.role, n: lane.n })),
      { role: "roaming" as const, n: input.period.roaming },
      { role: "unknown" as const, n: input.period.unknownLanes },
    ],
    avgDurationSec: input.period.avgDurationSec,
    kdaKnown: input.period.kda
      ? {
          known: input.period.kda.known,
          of: input.period.n,
          kills: input.period.kda.kills,
          deaths: input.period.kda.deaths,
          assists: input.period.kda.assists,
        }
      : null,
  };
}

/** Facts between two stored snapshots. Returns null unless both exist and describe the same player, slice, and window. */
export function diffSnapshots(older: EvolutionSnapshot | null, newer: EvolutionSnapshot | null): SnapshotDelta | null {
  if (!older || !newer) return null;
  if (older.accountId !== newer.accountId || older.slice !== newer.slice || older.windowKind !== newer.windowKind) return null;
  return {
    matchDelta: newer.matches - older.matches,
    winRateDelta: rateOf(newer) !== null && rateOf(older) !== null ? (rateOf(newer) as number) - (rateOf(older) as number) : null,
    heroPoolDelta: newer.heroPoolSize - older.heroPoolSize,
    topHeroFrom: older.topHeroes[0]?.heroId ?? null,
    topHeroTo: newer.topHeroes[0]?.heroId ?? null,
  };
}

export function buildEvolution(input: {
  rows: EvolutionMatch[];
  patches: PatchRef[];
  heroNames?: ReadonlyMap<number, string>;
  sliceLabel: string;
  mode: EvolutionMode;
}): EvolutionReport {
  const prepared = preparePatches(input.patches);
  const dated = datedRows(input.rows);
  const columns = patchColumns(dated, prepared, input.heroNames);
  const pair = selectPair(input.mode, dated, columns, prepared, input.heroNames);
  const currentRows = pair?.current.rows ?? null;
  const previousRows = pair?.previous.rows ?? null;
  const heroes = currentRows ? heroRows(currentRows, previousRows, input.heroNames) : heroRows(input.rows, null, input.heroNames);
  const current = pair?.current.period ?? null;
  const previous = pair?.previous.period ?? null;
  return {
    rulesVersion: RULES_VERSION,
    loaded: input.rows.length,
    dated: dated.length,
    undated: input.rows.length - dated.length,
    unpatched: dated.filter((row) => patchAt(row.startTime, prepared) === null).length,
    sliceLabel: input.sliceLabel,
    mode: input.mode,
    comparison: pair ? "ready" : "unavailable",
    unavailableReason: pair ? null : unavailable(input.rows.length, dated.length, input.mode, columns.length),
    current,
    previous,
    changes: current && previous ? whatChanged(current, previous, input.mode === "patch") : [],
    heroes,
    adopted: previousRows ? onlyIn(heroes, "current") : [],
    dropped: previousRows ? onlyIn(heroes, "previous") : [],
    lanes: laneRows(current, previous),
    patches: columns,
    chartReady: columns.length >= 4,
    loadedPeriod: summarize(input.rows, "Загруженное окно", prepared, input.heroNames),
  };
}

function selectPair(
  mode: EvolutionMode,
  dated: EvolutionMatch[],
  columns: PatchColumn[],
  prepared: PreparedPatch[],
  names: ReadonlyMap<number, string> | undefined,
): { current: { rows: EvolutionMatch[]; period: PeriodSummary }; previous: { rows: EvolutionMatch[]; period: PeriodSummary } } | null {
  if (mode === "patch") {
    if (columns.length < 2) return null;
    const newer = columns[columns.length - 1];
    const older = columns[columns.length - 2];
    const newerRows = dated.filter((row) => patchAt(row.startTime, prepared)?.id === newer.id);
    const olderRows = dated.filter((row) => patchAt(row.startTime, prepared)?.id === older.id);
    return {
      current: { rows: newerRows, period: summarize(newerRows, `Патч ${newer.name}`, prepared, names) },
      previous: { rows: olderRows, period: summarize(olderRows, `Патч ${older.name}`, prepared, names) },
    };
  }
  const width = mode === "20" ? 20 : 50;
  if (dated.length < width * 2) return null;
  const currentRows = dated.slice(0, width);
  const previousRows = dated.slice(width, width * 2);
  return {
    current: { rows: currentRows, period: summarize(currentRows, `Последние ${width}`, prepared, names) },
    previous: { rows: previousRows, period: summarize(previousRows, `Предыдущие ${width}`, prepared, names) },
  };
}

function unavailable(loaded: number, dated: number, mode: EvolutionMode, patchCount: number): string {
  if (loaded === 0) return "В этом срезе загруженных матчей нет.";
  if (dated === 0) return "Патчи по дате не собрались.";
  if (mode === "20") return "Для сравнения 20 и 20 нужно 40 матчей с датой.";
  if (mode === "50") return "Для сравнения 50 и 50 нужно 100 матчей с датой.";
  if (patchCount < 2) return "В загруженном окне нет двух патчей.";
  return "Сравнение этих окон не собралось.";
}

function whatChanged(current: PeriodSummary, previous: PeriodSummary, includePatch: boolean): string[] {
  const lines: string[] = [];
  if (current.topHero && previous.topHero && current.topHero.heroId !== previous.topHero.heroId && current.topHero.games >= 5 && previous.topHero.games >= 5) {
    lines.push(`Самый частый герой сменился с ${previous.topHero.name} на ${current.topHero.name}.`);
  }
  const lane = laneChange(current, previous);
  if (lane) lines.push(lane);
  if (includePatch && current.resultsKnown >= EVOLUTION_ASSERT_N && previous.resultsKnown >= EVOLUTION_ASSERT_N && current.winRate !== null && previous.winRate !== null && percentChanged(current.winRate, previous.winRate)) {
    lines.push(
      `Винрейт патча ${patchTitle(current.label)}: ${formatPercent(current.winRate)} ${onMatches(current.resultsKnown)}. В патче ${patchTitle(previous.label)}: ${formatPercent(previous.winRate)} ${onMatches(previous.resultsKnown)}. Разница ${signedPoints(current.winRate, previous.winRate)}.`,
    );
  }
  if (current.uniqueHeroes !== previous.uniqueHeroes) {
    lines.push(`Уникальных героев: было ${formatNumber(previous.uniqueHeroes)}, стало ${formatNumber(current.uniqueHeroes)}.`);
  }
  if (current.durationKnown >= EVOLUTION_ASSERT_N && previous.durationKnown >= EVOLUTION_ASSERT_N && current.avgDurationSec !== null && previous.avgDurationSec !== null && formatDuration(current.avgDurationSec) !== formatDuration(previous.avgDurationSec)) {
    lines.push(`Средняя длительность: было ${formatDuration(previous.avgDurationSec)}, стало ${formatDuration(current.avgDurationSec)}.`);
  }
  if (current.topHero && previous.topHero && current.topHero.games >= 5 && previous.topHero.games >= 5 && percentChanged(current.topHero.share, previous.topHero.share)) {
    lines.push(`Доля самого частого героя: было ${formatPercent(previous.topHero.share)}, стало ${formatPercent(current.topHero.share)}.`);
  }
  return lines.length > 0 ? lines.slice(0, 6) : [NO_DIFFERENCE];
}

function laneChange(current: PeriodSummary, previous: PeriodSummary): string | null {
  if (current.knownLanes < EVOLUTION_ASSERT_N || previous.knownLanes < EVOLUTION_ASSERT_N) return null;
  let best: { role: 1 | 2 | 3 | 4; label: string; current: number; previous: number; delta: number } | null = null;
  for (const role of [1, 2, 3, 4] as const) {
    const now = current.lanes.find((lane) => lane.role === role)?.share ?? 0;
    const then = previous.lanes.find((lane) => lane.role === role)?.share ?? 0;
    if (!percentChanged(now, then)) continue;
    const delta = Math.abs(now - then);
    if (!best || delta > best.delta || (delta === best.delta && role < best.role)) {
      best = { role, label: laneRoleLabel(role), current: now, previous: then, delta };
    }
  }
  if (!best) return null;
  return `Доля линии ${best.label}: было ${formatPercent(best.previous)}, стало ${formatPercent(best.current)}.`;
}

function summarize(rows: EvolutionMatch[], label: string, patches: PreparedPatch[], names: ReadonlyMap<number, string> | undefined): PeriodSummary {
  const heroes = heroCounts(rows);
  const results = rows.filter((row) => row.won !== null);
  const wins = results.filter((row) => row.won === true).length;
  const durations = rows.map((row) => row.durationSec).filter((value): value is number => value !== null && value >= 0);
  const kdaRows = rows.filter((row) => row.kills !== null && row.deaths !== null && row.assists !== null && row.kills >= 0 && row.deaths >= 0 && row.assists >= 0);
  const kills = kdaRows.reduce((sum, row) => sum + (row.kills as number), 0);
  const deaths = kdaRows.reduce((sum, row) => sum + (row.deaths as number), 0);
  const assists = kdaRows.reduce((sum, row) => sum + (row.assists as number), 0);
  const gpmRows = rows.map((row) => row.gpm).filter((value): value is number => value !== null && value >= 0);
  const xpmRows = rows.map((row) => row.xpm).filter((value): value is number => value !== null && value >= 0);
  const lanes = laneCounts(rows);
  const top = uniqueTop(heroes, rows.length, names);
  return {
    label,
    n: rows.length,
    wins,
    losses: results.length - wins,
    resultsKnown: results.length,
    winRate: winRate(wins, results.length - wins),
    uniqueHeroes: heroes.size,
    topHero: top,
    avgDurationSec: durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null,
    durationKnown: durations.length,
    kda: kdaRows.length ? { value: kda(kills, deaths, assists), kills, deaths, assists, known: kdaRows.length } : null,
    gpm: { value: gpmRows.length ? gpmRows.reduce((sum, value) => sum + value, 0) / gpmRows.length : null, known: gpmRows.length },
    xpm: { value: xpmRows.length ? xpmRows.reduce((sum, value) => sum + value, 0) / xpmRows.length : null, known: xpmRows.length },
    lanes: lanes.lanes,
    knownLanes: lanes.known,
    unknownLanes: lanes.unknown,
    roaming: lanes.roaming,
    mainLane: mainLane(lanes.lanes, lanes.known),
    patches: patchesIn(rows, patches),
  };
}

function heroRows(current: EvolutionMatch[], previous: EvolutionMatch[] | null, names: ReadonlyMap<number, string> | undefined): HeroEvolution[] {
  const left = heroCounts(current);
  const right = previous ? heroCounts(previous) : null;
  const ids = new Set<number>([...left.keys(), ...(right ? right.keys() : [])]);
  return [...ids]
    .map((heroId) => {
      const now = left.get(heroId) ?? { games: 0, wins: 0, known: 0 };
      const then = right ? (right.get(heroId) ?? { games: 0, wins: 0, known: 0 }) : null;
      const currentWinRate = rate(now);
      const previousWinRate = then ? rate(then) : null;
      const comparable = Boolean(
        then &&
          now.games >= EVOLUTION_HERO_TREND_N &&
          then.games >= EVOLUTION_HERO_TREND_N &&
          now.known >= EVOLUTION_HERO_TREND_N &&
          then.known >= EVOLUTION_HERO_TREND_N &&
          currentWinRate !== null &&
          previousWinRate !== null,
      );
      return {
        heroId,
        name: heroName(heroId, names),
        currentGames: now.games,
        currentWins: now.wins,
        currentKnown: now.known,
        currentWinRate,
        previousGames: then ? then.games : null,
        previousWins: then ? then.wins : null,
        previousKnown: then ? then.known : null,
        previousWinRate,
        comparable,
        delta: comparable && currentWinRate !== null && previousWinRate !== null ? currentWinRate - previousWinRate : null,
      };
    })
    .sort((a, b) => b.currentGames - a.currentGames || (b.previousGames ?? 0) - (a.previousGames ?? 0) || a.heroId - b.heroId);
}

function laneRows(current: PeriodSummary | null, previous: PeriodSummary | null): EvolutionReport["lanes"] {
  const source = current ?? previous;
  if (!source) return [];
  const rows: EvolutionReport["lanes"] = source.lanes.map((lane) => ({
    role: lane.role,
    label: lane.label,
    currentN: current ? lane.n : 0,
    previousN: previous ? (previous.lanes.find((item) => item.role === lane.role)?.n ?? 0) : null,
    currentShare: current && current.knownLanes > 0 ? lane.n / current.knownLanes : null,
    previousShare: previous && previous.knownLanes > 0 ? (previous.lanes.find((item) => item.role === lane.role)?.n ?? 0) / previous.knownLanes : null,
  }));
  rows.push({
    role: "roaming",
    label: "Роуминг",
    currentN: current?.roaming ?? 0,
    previousN: previous ? previous.roaming : null,
    currentShare: null,
    previousShare: null,
  });
  rows.push({
    role: "unknown",
    label: laneRoleLabel(null),
    currentN: current?.unknownLanes ?? 0,
    previousN: previous ? previous.unknownLanes : null,
    currentShare: null,
    previousShare: null,
  });
  return rows;
}

function patchColumns(rows: EvolutionMatch[], patches: PreparedPatch[], names: ReadonlyMap<number, string> | undefined): PatchColumn[] {
  const groups = new Map<number, { patch: PreparedPatch; rows: EvolutionMatch[] }>();
  for (const row of rows) {
    const patch = patchAt(row.startTime, patches);
    if (!patch) continue;
    const group = groups.get(patch.id) ?? { patch, rows: [] };
    group.rows.push(row);
    groups.set(patch.id, group);
  }
  let previousHeroes: Set<number> | null = null;
  return [...groups.values()]
    .sort((left, right) => left.patch.startMs - right.patch.startMs || left.patch.id - right.patch.id)
    .map((group) => {
      const period = summarize(group.rows, group.patch.name, patches, names);
      const heroIds = [...heroCounts(group.rows).keys()];
      const newHeroes = previousHeroes ? heroIds.filter((heroId) => !previousHeroes?.has(heroId)).length : null;
      previousHeroes = new Set(heroIds);
      return {
        id: group.patch.id,
        name: group.patch.name,
        n: period.n,
        wins: period.wins,
        losses: period.losses,
        resultsKnown: period.resultsKnown,
        winRate: period.winRate,
        uniqueHeroes: period.uniqueHeroes,
        heroIds,
        newHeroes,
        knownLanes: period.knownLanes,
        mainLane: period.mainLane,
        asserted: period.resultsKnown >= EVOLUTION_ASSERT_N,
      };
    });
}

function datedRows(rows: EvolutionMatch[]): EvolutionMatch[] {
  return rows
    .filter((row) => row.startTime !== null && Number.isFinite(row.startTime))
    .slice()
    .sort((left, right) => (right.startTime as number) - (left.startTime as number) || right.matchId - left.matchId);
}

function heroCounts(rows: EvolutionMatch[]): Map<number, HeroCell> {
  const map = new Map<number, HeroCell>();
  for (const row of rows) {
    if (row.heroId === null) continue;
    const cell = map.get(row.heroId) ?? { games: 0, wins: 0, known: 0 };
    cell.games += 1;
    if (row.won !== null) {
      cell.known += 1;
      if (row.won) cell.wins += 1;
    }
    map.set(row.heroId, cell);
  }
  return map;
}

function uniqueTop(heroes: Map<number, HeroCell>, n: number, names: ReadonlyMap<number, string> | undefined): PeriodSummary["topHero"] {
  let best: { heroId: number; games: number } | null = null;
  let tied = false;
  for (const [heroId, cell] of heroes) {
    if (!best || cell.games > best.games) {
      best = { heroId, games: cell.games };
      tied = false;
    } else if (cell.games === best.games) tied = true;
  }
  if (!best || tied || n <= 0) return null;
  return { heroId: best.heroId, name: heroName(best.heroId, names), games: best.games, share: best.games / n };
}

function laneCounts(rows: EvolutionMatch[]): { lanes: LaneCount[]; known: number; unknown: number; roaming: number } {
  const counts = new Map<1 | 2 | 3 | 4, number>();
  let known = 0;
  let unknown = 0;
  let roaming = 0;
  for (const row of rows) {
    if (row.roaming) roaming += 1;
    if (row.laneRole === 1 || row.laneRole === 2 || row.laneRole === 3 || row.laneRole === 4) {
      counts.set(row.laneRole, (counts.get(row.laneRole) ?? 0) + 1);
      known += 1;
    } else unknown += 1;
  }
  const lanes = ([1, 2, 3, 4] as const).map((role) => {
    const count = counts.get(role) ?? 0;
    return { role, label: laneRoleLabel(role), n: count, share: known > 0 ? count / known : 0 };
  });
  return { lanes, known, unknown, roaming };
}

function mainLane(lanes: LaneCount[], known: number): PeriodSummary["mainLane"] {
  if (known < EVOLUTION_ASSERT_N) return null;
  const leaders = lanes.filter((lane) => lane.share >= 0.5);
  if (leaders.length !== 1) return null;
  const lane = leaders[0];
  return { role: lane.role, label: lane.label, share: lane.share };
}

function patchesIn(rows: EvolutionMatch[], patches: PreparedPatch[]): { id: number; name: string }[] {
  const seen = new Map<number, PreparedPatch>();
  for (const row of rows) {
    const patch = patchAt(row.startTime, patches);
    if (patch) seen.set(patch.id, patch);
  }
  return [...seen.values()]
    .sort((left, right) => right.startMs - left.startMs || right.id - left.id)
    .map((patch) => ({ id: patch.id, name: patch.name }));
}

function onlyIn(heroes: HeroEvolution[], side: "current" | "previous"): { heroId: number; name: string; games: number }[] {
  return heroes
    .filter((hero) => (side === "current" ? hero.currentGames > 0 && hero.previousGames === 0 : (hero.previousGames ?? 0) > 0 && hero.currentGames === 0))
    .map((hero) => ({ heroId: hero.heroId, name: hero.name, games: side === "current" ? hero.currentGames : (hero.previousGames ?? 0) }))
    .sort((left, right) => right.games - left.games || left.heroId - right.heroId);
}

function rate(cell: HeroCell): number | null {
  return cell.known > 0 ? cell.wins / cell.known : null;
}

function rateOf(shot: EvolutionSnapshot): number | null {
  if (shot.matches <= 0 || shot.wins < 0 || shot.wins > shot.matches) return null;
  return shot.wins / shot.matches;
}

function heroName(heroId: number, names: ReadonlyMap<number, string> | undefined): string {
  const name = names?.get(heroId);
  return name ? name : `Герой ${heroId}`;
}

function finite(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function percentChanged(current: number, previous: number): boolean {
  return (current * 100).toFixed(1) !== (previous * 100).toFixed(1);
}

function signedPoints(current: number, previous: number): string {
  const delta = (current - previous) * 100;
  const text = Math.abs(delta).toFixed(1);
  if (delta > 0) return `+${text}%`;
  if (delta < 0) return `-${text}%`;
  return `${text}%`;
}

function onMatches(n: number): string {
  const mod10 = Math.abs(n) % 10;
  const mod100 = Math.abs(n) % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "матче" : "матчах";
  return `на ${formatNumber(n)} ${word}`;
}

function patchTitle(label: string): string {
  return label.replace(/^Патч\s+/, "");
}
