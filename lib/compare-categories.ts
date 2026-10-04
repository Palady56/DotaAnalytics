import { compareCategories, type BattleCategory, type BattleReport, type MeanSample, type RateSample } from "./battle";
import { laneRoleLabel } from "./labels";
import { formatDecimal, formatNumber, formatPercent, gamesPhrase, kda, wilsonInterval, winRate } from "./stats";

export const COMPARE_SLICE = "без Turbo";

export type RateParts = { wins: number; losses: number } | null;
export type RecentRow = { won: boolean; turbo: boolean };
export type MeanParts = { value: number; n: number } | null;
export type KdaParts = {
  kills: number;
  deaths: number;
  assists: number;
  nKills: number;
  nDeaths: number;
  nAssists: number;
} | null;
export type HeroSample = { heroId: number; name: string; img: string | null; games: number; wins: number };
export type LaneSample = { id: number; label: string; games: number };

export type ComparePlayer = {
  name: string;
  record: RateParts;
  patchId: number | null;
  patchName: string | null;
  patchRecord: RateParts;
  recent: RecentRow[] | null;
  kda: KdaParts;
  recordGames: number | null;
  gpm: MeanParts;
  xpm: MeanParts;
  heroes: HeroSample[] | null;
  lanes: LaneSample[] | null;
};

export type ShownSide = {
  primary: string;
  detail: string;
  quiet: boolean;
  bar: number | null;
};

export type ShownCategory = {
  id: BattleCategory["id"];
  name: string;
  group: "core" | "secondary";
  a: ShownSide;
  b: ShownSide;
  status: string;
};

export type HeroExample = {
  heroId: number;
  name: string;
  img: string | null;
  aGames: number;
  bGames: number;
  aRate: number | null;
  bRate: number | null;
  status: string;
};

export type LaneLine = { label: string; a: string; b: string };

export type CompareView = {
  report: BattleReport;
  categories: ShownCategory[];
  heroes: HeroExample[];
  lanes: LaneLine[];
  droppedTurboA: number;
  droppedTurboB: number;
  sampleExcluded: number;
};

const LANE_NOTE = "Лёгкая, мид, сложная, лес. Это lane_role, не позиция 1–5.";

export function laneDictionary(): string {
  return LANE_NOTE;
}

export function buildCompareView(left: ComparePlayer, right: ComparePlayer): CompareView {
  const recentA = recentSample(left.recent);
  const recentB = recentSample(right.recent);
  const kdaA = kdaSample(left.kda);
  const kdaB = kdaSample(right.kda);
  const patchMismatch = left.patchId === null || left.patchId !== right.patchId;
  const report = compareCategories({
    nameA: left.name,
    nameB: right.name,
    sliceA: COMPARE_SLICE,
    sliceB: COMPARE_SLICE,
    slice: { a: rateSample(left.record), b: rateSample(right.record) },
    recent: { a: recentA.sample, b: recentB.sample },
    patch: {
      idA: left.patchId,
      idB: right.patchId,
      nameA: left.patchName,
      nameB: right.patchName,
      a: rateSample(left.patchRecord),
      b: rateSample(right.patchRecord),
    },
    kda: { a: kdaA, b: kdaB },
    gpm: { a: meanSample(left.gpm), b: meanSample(right.gpm) },
    xpm: { a: meanSample(left.xpm), b: meanSample(right.xpm) },
  });
  const categories = report.categories.map((category) =>
    shownCategory(category, left, right, recentA.dropped, recentB.dropped, kdaA, kdaB, patchMismatch),
  );
  return {
    report,
    categories,
    heroes: heroExamples(left, right),
    lanes: laneLines(left.lanes, right.lanes),
    droppedTurboA: recentA.dropped,
    droppedTurboB: recentB.dropped,
    sampleExcluded: sampleExcluded(left, right, recentA.sample, recentB.sample, kdaA, kdaB),
  };
}

export function closeSentence(close: number): string | null {
  if (close <= 0) return null;
  if (close === 1) return "Одна категория слишком близко и никому не засчитана.";
  return `Категорий слишком близко: ${formatNumber(close)}. Они никому не засчитаны.`;
}

export function sampleSentence(excluded: number): string | null {
  if (excluded <= 0) return null;
  return `Не вошли из-за выборки: ${formatNumber(excluded)}.`;
}

function shownCategory(
  category: BattleCategory,
  left: ComparePlayer,
  right: ComparePlayer,
  droppedA: number,
  droppedB: number,
  kdaA: MeanSample,
  kdaB: MeanSample,
  patchMismatch: boolean,
): ShownCategory {
  return {
    id: category.id,
    name: category.name,
    group: category.group,
    a: sideOf(category, "a", left, droppedA, kdaA),
    b: sideOf(category, "b", right, droppedB, kdaB),
    status: statusOf(category, left.name, right.name, patchMismatch, kdaA, kdaB),
  };
}

function sideOf(category: BattleCategory, side: "a" | "b", player: ComparePlayer, dropped: number, mean: MeanSample): ShownSide {
  if (category.id === "slice-wr") return rateSide(player.record, "min");
  if (category.id === "recent-wr") return rateSide(player.recent === null ? null : recentSample(player.recent).sample, "exact", dropped);
  if (category.id === "patch-wr") return rateSide(player.patchRecord, "min");
  if (category.id === "kda") return meanSide(player.kda === null ? null : mean, player.recordGames, "KDA");
  if (category.id === "gpm") return meanSide(player.gpm === null ? null : { value: player.gpm.value, nKnown: player.gpm.n }, null, "GPM");
  return meanSide(player.xpm === null ? null : { value: player.xpm.value, nKnown: player.xpm.n }, null, "XPM");
}

function rateSide(parts: RateParts | RateSample | null, gate: "min" | "exact", dropped = 0): ShownSide {
  if (parts === null) return { primary: "нет данных", detail: "", quiet: true, bar: null };
  const sample = "wins" in parts && "losses" in parts ? rateSample(parts) : parts;
  const value = sample.n > 0 ? sample.wins / sample.n : null;
  const enough = gate === "exact" ? sample.n === 20 : sample.n >= 20;
  const turbo = dropped > 0 ? ` · Turbo отложено ${formatNumber(dropped)}` : "";
  return {
    primary: formatPercent(value),
    detail: `n=${formatNumber(sample.n)} · ${enough ? "достаточно" : "мало матчей"}${turbo}`,
    quiet: !enough,
    bar: value,
  };
}

function meanSide(sample: MeanSample | MeanParts | null, total: number | null, unit: string): ShownSide {
  if (sample === null) return { primary: "нет данных", detail: unit, quiet: true, bar: null };
  const value = "nKnown" in sample ? sample.value : sample.value;
  const n = "nKnown" in sample ? sample.nKnown : sample.n;
  const enough = value !== null && n >= 20;
  const known = total !== null && n <= total ? `известно в ${formatNumber(n)} из ${formatNumber(total)}` : `известно в ${formatNumber(n)}`;
  return {
    primary: value === null ? "—" : formatDecimal(value),
    detail: `${known} · ${enough ? "достаточно" : "мало матчей"}`,
    quiet: !enough,
    bar: null,
  };
}

function statusOf(
  category: BattleCategory,
  nameA: string,
  nameB: string,
  patchMismatch: boolean,
  kdaA: MeanSample,
  kdaB: MeanSample,
): string {
  if (category.group === "secondary") {
    if (category.state === "ahead-a") return `${nameA} выше. В долю не входит.`;
    if (category.state === "ahead-b") return `${nameB} выше. В долю не входит.`;
    if (category.state === "close") return "Слишком близко. В долю не входит.";
    return "В долю не входит.";
  }
  if (category.state === "ahead-a") {
    return category.id === "kda" ? `${nameA} впереди. Разница не меньше 0,15.` : `${nameA} впереди. Интервалы не пересекаются.`;
  }
  if (category.state === "ahead-b") {
    return category.id === "kda" ? `${nameB} впереди. Разница не меньше 0,15.` : `${nameB} впереди. Интервалы не пересекаются.`;
  }
  if (category.state === "close") return "Слишком близко.";
  if (category.id === "patch-wr" && patchMismatch) {
    const small = category.a.n < 20 || category.b.n < 20;
    return small ? "Мало матчей, и патч не один и тот же. В долю не входит." : "Патч не один и тот же. В долю не входит.";
  }
  if (category.id === "kda" && (kdaA.value === null || kdaB.value === null)) return "В долю не входит.";
  return "В долю не входит.";
}

function sampleExcluded(
  left: ComparePlayer,
  right: ComparePlayer,
  recentA: RateSample,
  recentB: RateSample,
  kdaA: MeanSample,
  kdaB: MeanSample,
): number {
  let count = 0;
  if (failsMin(left.record) || failsMin(right.record)) count += 1;
  if (recentA.n !== 20 || recentB.n !== 20) count += 1;
  if (failsMin(left.patchRecord) || failsMin(right.patchRecord)) count += 1;
  if (kdaA.nKnown < 20 || kdaB.nKnown < 20 || kdaA.value === null || kdaB.value === null) count += 1;
  return count;
}

function failsMin(parts: RateParts): boolean {
  if (!parts) return true;
  return parts.wins + parts.losses < 20;
}

function recentSample(rows: RecentRow[] | null): { sample: RateSample; dropped: number } {
  if (!rows) return { sample: { wins: 0, n: 0 }, dropped: 0 };
  const kept = rows.filter((row) => !row.turbo);
  return {
    sample: { wins: kept.filter((row) => row.won).length, n: kept.length },
    dropped: rows.length - kept.length,
  };
}

function rateSample(parts: RateParts): RateSample {
  if (!parts) return { wins: 0, n: 0 };
  return { wins: parts.wins, n: parts.wins + parts.losses };
}

function kdaSample(parts: KdaParts): MeanSample {
  if (!parts) return { value: null, nKnown: 0 };
  const nKnown = Math.min(parts.nKills, parts.nDeaths, parts.nAssists);
  if (parts.nKills !== parts.nDeaths || parts.nDeaths !== parts.nAssists || nKnown <= 0) return { value: null, nKnown };
  return { value: kda(parts.kills, parts.deaths, parts.assists), nKnown };
}

function meanSample(parts: MeanParts): MeanSample {
  if (!parts || parts.n <= 0) return { value: null, nKnown: parts?.n ?? 0 };
  return { value: parts.value, nKnown: parts.n };
}

function heroExamples(left: ComparePlayer, right: ComparePlayer): HeroExample[] {
  if (!left.heroes || !right.heroes) return [];
  const other = new Map(right.heroes.map((hero) => [hero.heroId, hero]));
  return left.heroes
    .flatMap((hero) => {
      const pair = other.get(hero.heroId);
      if (!pair || hero.games < 20 || pair.games < 20) return [];
      return [{ hero, pair, min: Math.min(hero.games, pair.games) }];
    })
    .sort((a, b) => b.min - a.min || b.hero.games + b.pair.games - (a.hero.games + a.pair.games))
    .slice(0, 3)
    .map(({ hero, pair }) => ({
      heroId: hero.heroId,
      name: hero.name,
      img: hero.img ?? pair.img,
      aGames: hero.games,
      bGames: pair.games,
      aRate: winRate(hero.wins, Math.max(hero.games - hero.wins, 0)),
      bRate: winRate(pair.wins, Math.max(pair.games - pair.wins, 0)),
      status: heroStatus(left.name, right.name, hero.wins, hero.games, pair.wins, pair.games),
    }));
}

function heroStatus(nameA: string, nameB: string, winsA: number, nA: number, winsB: number, nB: number): string {
  const left = wilsonInterval(winsA, nA);
  const right = wilsonInterval(winsB, nB);
  const rateA = winsA / nA;
  const rateB = winsB / nB;
  if (!left || !right || (left.lower <= right.upper && right.lower <= left.upper) || rateA === rateB) return "Слишком близко.";
  return rateA > rateB ? `${nameA} выше на этом герое.` : `${nameB} выше на этом герое.`;
}

function laneLines(left: LaneSample[] | null, right: LaneSample[] | null): LaneLine[] {
  return [1, 2, 3, 4, 0].map((id) => ({
    label: id === 0 ? "Не определена" : laneRoleLabel(id),
    a: laneText(left, id),
    b: laneText(right, id),
  }));
}

function laneText(rows: LaneSample[] | null, id: number): string {
  if (!rows) return "нет данных";
  const games = rows.find((row) => row.id === id)?.games ?? 0;
  if (id === 0) return formatNumber(games);
  const known = rows.filter((row) => row.id >= 1 && row.id <= 4).reduce((sum, row) => sum + row.games, 0);
  if (known <= 0) return formatNumber(games);
  return `${formatPercent(games / known)} · ${formatNumber(games)}`;
}

export function heroCountText(games: number, rate: number | null): string {
  return `${formatPercent(rate)} · ${gamesPhrase(games)}`;
}

/** Main lane only with at least 20 known roles and one unique share of 50% or more. */
export function namedLane(rows: { id: number; label: string; games: number }[] | null): string | null {
  if (!rows) return null;
  const known = rows.filter((row) => row.id >= 1 && row.id <= 4 && row.games > 0);
  const total = known.reduce((sum, row) => sum + row.games, 0);
  if (total < 20) return null;
  const sorted = [...known].sort((left, right) => right.games - left.games || left.id - right.id);
  const top = sorted[0];
  if (!top) return null;
  if (sorted[1] && sorted[1].games === top.games) return null;
  const share = top.games / total;
  if (share < 0.5) return null;
  return `${top.label} ${formatPercent(share)}`;
}
