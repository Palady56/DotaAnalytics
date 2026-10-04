import { wilsonInterval } from "./stats";

/** Product gates from STATISTICAL_RULES.md. The share is not a match prediction. */
export const BATTLE_RATE_N = 20;
export const BATTLE_MEAN_N = 20;
export const BATTLE_KDA_GAP = 0.15;
export const BATTLE_GPM_GAP = 20;
export const BATTLE_XPM_GAP = 20;
export const BATTLE_MIN_ELIGIBLE = 3;
export const LEAD_LABEL = "доля категорий, где значение выше";
export const NOT_PREDICTION = "это не вероятность победы в матче";

export type RateSample = { wins: number; n: number };
export type MeanSample = { value: number | null; nKnown: number };

export type BattleInput = {
  nameA: string;
  nameB: string;
  sliceA: string;
  sliceB: string;
  slice: { a: RateSample; b: RateSample };
  recent: { a: RateSample; b: RateSample };
  patch: { idA: number | null; idB: number | null; nameA: string | null; nameB: string | null; a: RateSample; b: RateSample };
  kda: { a: MeanSample; b: MeanSample };
  gpm: { a: MeanSample; b: MeanSample };
  xpm: { a: MeanSample; b: MeanSample };
};

export type CategoryState = "ahead-a" | "ahead-b" | "close" | "excluded";

export type BattleCategory = {
  id: "slice-wr" | "recent-wr" | "patch-wr" | "kda" | "gpm" | "xpm";
  name: string;
  group: "core" | "secondary";
  higherIsBetter: true;
  state: CategoryState;
  a: { value: number | null; n: number };
  b: { value: number | null; n: number };
};

export type BattleReport = {
  categories: BattleCategory[];
  eligible: number;
  winsA: number;
  winsB: number;
  close: number;
  excluded: number;
  shareA: number | null;
  shareB: number | null;
  verdict: "lead-a" | "lead-b" | "close" | "insufficient";
  verdictText: string;
  confidence: "low" | "moderate" | null;
  reasons: string[];
  closeNames: string[];
  incompatibility: string | null;
  leadLabel: typeof LEAD_LABEL;
  notPrediction: typeof NOT_PREDICTION;
};

export function compareCategories(input: BattleInput): BattleReport {
  const mismatched = input.sliceA !== input.sliceB;
  const categories: BattleCategory[] = [
    rateCategory("slice-wr", "Винрейт среза", "core", input.slice.a, input.slice.b, mismatched, BATTLE_RATE_N, null),
    rateCategory("recent-wr", "Винрейт последних 20", "core", input.recent.a, input.recent.b, mismatched, null, 20),
    rateCategory("patch-wr", patchName(input), "core", input.patch.a, input.patch.b, mismatched || input.patch.idA === null || input.patch.idA !== input.patch.idB, BATTLE_RATE_N, null),
    meanCategory("kda", "KDA", "core", input.kda.a, input.kda.b, mismatched, BATTLE_KDA_GAP),
    meanCategory("gpm", "GPM", "secondary", input.gpm.a, input.gpm.b, mismatched, BATTLE_GPM_GAP),
    meanCategory("xpm", "XPM", "secondary", input.xpm.a, input.xpm.b, mismatched, BATTLE_XPM_GAP),
  ];
  const core = categories.filter((category) => category.group === "core");
  const opened = core.filter((category) => category.state !== "excluded");
  const winsA = opened.filter((category) => category.state === "ahead-a").length;
  const winsB = opened.filter((category) => category.state === "ahead-b").length;
  const close = opened.filter((category) => category.state === "close").length;
  const eligible = opened.length;
  const verdict = verdictOf(eligible, winsA, winsB);
  const leaderState = verdict === "lead-a" ? "ahead-a" : verdict === "lead-b" ? "ahead-b" : null;
  const reasons = leaderState ? core.filter((category) => category.state === leaderState).map((category) => category.name) : [];
  return {
    categories,
    eligible,
    winsA,
    winsB,
    close,
    excluded: core.filter((category) => category.state === "excluded").length,
    shareA: eligible > 0 ? winsA / eligible : null,
    shareB: eligible > 0 ? winsB / eligible : null,
    verdict,
    verdictText: verdictText(verdict, verdict === "lead-a" ? input.nameA : input.nameB),
    confidence: confidenceOf(verdict, eligible, close, core),
    reasons,
    closeNames: core.filter((category) => category.state === "close").map((category) => category.name),
    incompatibility: mismatched ? "Срезы не совпадают." : null,
    leadLabel: LEAD_LABEL,
    notPrediction: NOT_PREDICTION,
  };
}

function rateCategory(
  id: BattleCategory["id"],
  name: string,
  group: BattleCategory["group"],
  a: RateSample,
  b: RateSample,
  forceExcluded: boolean,
  minN: number | null,
  exactN: number | null,
): BattleCategory {
  const base = { id, name, group, higherIsBetter: true as const, a: shownRate(a), b: shownRate(b) };
  if (forceExcluded || !openedRate(a, minN, exactN) || !openedRate(b, minN, exactN)) {
    return { ...base, state: "excluded" };
  }
  const left = wilsonInterval(a.wins, a.n);
  const right = wilsonInterval(b.wins, b.n);
  const rateA = a.wins / a.n;
  const rateB = b.wins / b.n;
  if (!left || !right || overlaps(left, right) || rateA === rateB) return { ...base, state: "close" };
  return { ...base, state: rateA > rateB ? "ahead-a" : "ahead-b" };
}

function meanCategory(
  id: BattleCategory["id"],
  name: string,
  group: BattleCategory["group"],
  a: MeanSample,
  b: MeanSample,
  forceExcluded: boolean,
  gap: number,
): BattleCategory {
  const base = {
    id,
    name,
    group,
    higherIsBetter: true as const,
    a: { value: validMean(a) ? a.value : null, n: finiteInt(a.nKnown) ? a.nKnown : 0 },
    b: { value: validMean(b) ? b.value : null, n: finiteInt(b.nKnown) ? b.nKnown : 0 },
  };
  if (forceExcluded || !validMean(a) || !validMean(b) || a.nKnown < BATTLE_MEAN_N || b.nKnown < BATTLE_MEAN_N) {
    return { ...base, state: "excluded" };
  }
  const left = a.value as number;
  const right = b.value as number;
  if (!meetsGap(left, right, gap)) return { ...base, state: "close" };
  return { ...base, state: left > right ? "ahead-a" : "ahead-b" };
}

function openedRate(sample: RateSample, minN: number | null, exactN: number | null): boolean {
  if (!validRate(sample)) return false;
  if (exactN !== null) return sample.n === exactN;
  return minN !== null && sample.n >= minN;
}

function validRate(sample: RateSample): boolean {
  return finiteInt(sample.n) && finiteInt(sample.wins) && sample.n >= 0 && sample.wins >= 0 && sample.wins <= sample.n;
}

function validMean(sample: MeanSample): boolean {
  return finiteInt(sample.nKnown) && sample.nKnown >= 0 && typeof sample.value === "number" && Number.isFinite(sample.value);
}

function shownRate(sample: RateSample): { value: number | null; n: number } {
  if (!validRate(sample) || sample.n === 0) return { value: null, n: finiteInt(sample.n) && sample.n >= 0 ? sample.n : 0 };
  return { value: sample.wins / sample.n, n: sample.n };
}

function overlaps(left: { lower: number; upper: number }, right: { lower: number; upper: number }): boolean {
  return left.lower <= right.upper && right.lower <= left.upper;
}

/** Compare a published gap without binary noise flipping 0.15. */
function meetsGap(left: number, right: number, gap: number): boolean {
  const scale = 1000;
  return Math.round(Math.abs(left - right) * scale) >= Math.round(gap * scale);
}

function finiteInt(value: number): boolean {
  return Number.isInteger(value) && Number.isFinite(value);
}

function patchName(input: BattleInput): string {
  if (input.patch.idA === null || input.patch.idA !== input.patch.idB) return "Винрейт патча";
  const name = input.patch.nameA || input.patch.nameB;
  return name ? `Винрейт патча ${name}` : `Винрейт патча ${input.patch.idA}`;
}

function verdictOf(eligible: number, winsA: number, winsB: number): BattleReport["verdict"] {
  if (eligible < BATTLE_MIN_ELIGIBLE) return "insufficient";
  if (winsA === winsB || Math.abs(winsA - winsB) === 1) return "close";
  return winsA > winsB ? "lead-a" : "lead-b";
}

function verdictText(verdict: BattleReport["verdict"], leader: string): string {
  if (verdict === "insufficient") return "Недостаточно категорий";
  if (verdict === "close") return "Слишком близко";
  return `${leader} впереди по категориям`;
}

function confidenceOf(verdict: BattleReport["verdict"], eligible: number, close: number, core: BattleCategory[]): BattleReport["confidence"] {
  if (verdict !== "lead-a" && verdict !== "lead-b") return null;
  const leader = verdict === "lead-a" ? "ahead-a" : "ahead-b";
  const hasRate = core.some((category) => category.state === leader && category.id !== "kda");
  if (eligible >= 4 && close <= 1 && hasRate) return "moderate";
  return "low";
}
