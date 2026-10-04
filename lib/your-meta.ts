import type { MetaRow } from "@/lib/meta";
import type { HeroRow } from "@/lib/passport";
import { formatNumber, formatPercent, gamesPhrase, wilsonInterval, winRate } from "@/lib/stats";

export const FAMILIAR_GAMES = 20;
export const META_HIGH_PICKS = 20;
export const META_HIGH_WILSON = 0.5;
const CARD_LIMIT = 6;

export type SelfSignal = "above" | "below" | "crosses" | "small" | "no-baseline";
export type Quadrant = "familiar-strong" | "signature" | "meta-only" | "skip" | "inconclusive";
export type AdviceKind = "familiar-strong" | "signature" | "below-self" | "practice";

export type PlacedHero = {
  heroId: number;
  name: string;
  img: string | null;
  patchGames: number;
  patchWins: number;
  patchWinRate: number | null;
  wilsonLower: number | null;
  wilsonUpper: number | null;
  lifetimeGames: number;
  metaPicks: number | null;
  metaWinRate: number | null;
  metaWilson: number | null;
  metaHigh: boolean;
  signal: SelfSignal;
  deltaSelf: number | null;
  quadrant: Quadrant;
};

export type AdviceCard = {
  kind: AdviceKind;
  heroId: number;
  name: string;
  img: string | null;
  text: string;
};

export type YourMetaReport = {
  thin: boolean;
  heroesKnown: boolean;
  lifetimeKnown: boolean;
  baselineRate: number | null;
  baselineGames: number;
  metaReady: boolean;
  played: PlacedHero[];
  cards: AdviceCard[];
};

export function heroesIn(report: YourMetaReport, quadrant: Quadrant): PlacedHero[] {
  return report.played
    .filter((hero) => hero.quadrant === quadrant)
    .sort((a, b) => b.patchGames - a.patchGames || a.name.localeCompare(b.name, "ru"));
}

export function buildYourMeta(input: {
  bucketName: string;
  baseline: { wins: number; losses: number } | null;
  patchHeroes: HeroRow[];
  lifetimeHeroes: HeroRow[];
  heroesKnown: boolean;
  lifetimeKnown: boolean;
  meta: MetaRow[] | null;
}): YourMetaReport {
  const baselineGames = input.baseline ? input.baseline.wins + input.baseline.losses : 0;
  const baselineRate = input.baseline ? winRate(input.baseline.wins, input.baseline.losses) : null;
  const metaReady = input.meta !== null;
  const metaById = new Map((input.meta ?? []).map((row) => [row.id, row]));
  const lifeById = new Map(input.lifetimeHeroes.map((row) => [row.heroId, row.games]));
  const thin =
    input.heroesKnown &&
    input.lifetimeKnown &&
    baselineGames < FAMILIAR_GAMES &&
    input.lifetimeHeroes.every((row) => row.games < FAMILIAR_GAMES);

  const played = input.patchHeroes
    .filter((hero) => hero.games > 0)
    .map((hero) => placeHero(hero, lifeById.get(hero.heroId) ?? 0, metaById.get(hero.heroId), baselineRate, metaReady))
    .sort((a, b) => b.patchGames - a.patchGames || a.name.localeCompare(b.name, "ru"));

  const cards =
    thin || !input.heroesKnown || !input.lifetimeKnown
      ? []
      : pickCards(input.bucketName, baselineRate, played, input.meta, lifeById, metaReady);
  return {
    thin,
    heroesKnown: input.heroesKnown,
    lifetimeKnown: input.lifetimeKnown,
    baselineRate,
    baselineGames,
    metaReady,
    played,
    cards,
  };
}

function placeHero(
  hero: HeroRow,
  lifetimeGames: number,
  meta: MetaRow | undefined,
  baselineRate: number | null,
  metaReady: boolean,
): PlacedHero {
  const interval = wilsonInterval(hero.wins, hero.games);
  const signal = signalOf(hero.games, interval, baselineRate);
  const metaHigh = Boolean(
    meta && meta.picks >= META_HIGH_PICKS && meta.wilson !== null && meta.wilson >= META_HIGH_WILSON,
  );
  const patchWinRate = hero.winRate;
  return {
    heroId: hero.heroId,
    name: hero.name,
    img: hero.img,
    patchGames: hero.games,
    patchWins: hero.wins,
    patchWinRate,
    wilsonLower: interval?.lower ?? null,
    wilsonUpper: interval?.upper ?? null,
    lifetimeGames,
    metaPicks: meta ? meta.picks : null,
    metaWinRate: meta ? meta.winRate : null,
    metaWilson: meta ? meta.wilson : null,
    metaHigh,
    signal,
    deltaSelf: baselineRate !== null && patchWinRate !== null ? patchWinRate - baselineRate : null,
    quadrant: quadrantOf(signal, metaHigh, metaReady),
  };
}

function signalOf(
  games: number,
  interval: { lower: number; upper: number } | null,
  baselineRate: number | null,
): SelfSignal {
  if (games < FAMILIAR_GAMES) return "small";
  if (baselineRate === null || !interval) return "no-baseline";
  if (interval.lower >= baselineRate) return "above";
  if (interval.upper < baselineRate) return "below";
  return "crosses";
}

function quadrantOf(signal: SelfSignal, metaHigh: boolean, metaReady: boolean): Quadrant {
  if (!metaReady) {
    if (signal === "above") return "signature";
    if (signal === "below" || signal === "small") return "skip";
    return "inconclusive";
  }
  if (signal === "above" && metaHigh) return "familiar-strong";
  if (signal === "above") return "signature";
  if (metaHigh) return "meta-only";
  if (signal === "crosses" || signal === "no-baseline") return "inconclusive";
  return "skip";
}

function pickCards(
  bucketName: string,
  baselineRate: number | null,
  played: PlacedHero[],
  meta: MetaRow[] | null,
  lifeById: Map<number, number>,
  metaReady: boolean,
): AdviceCard[] {
  const byGames = [...played].sort((a, b) => b.patchGames - a.patchGames);
  const selected: AdviceCard[] = [];
  const room = () => selected.length < CARD_LIMIT;

  if (metaReady && baselineRate !== null) {
    for (const hero of byGames.filter((item) => item.quadrant === "familiar-strong").slice(0, 2)) {
      if (!room()) break;
      selected.push(cardOf("familiar-strong", hero, textFamiliar(hero, bucketName, baselineRate)));
    }
  }
  if (baselineRate !== null) {
    for (const hero of byGames.filter((item) => item.signal === "below").slice(0, 2)) {
      if (!room()) break;
      selected.push(cardOf("below-self", hero, textBelow(hero, bucketName, baselineRate)));
    }
  }
  if (metaReady && meta) {
    for (const hero of practicePool(meta, played, lifeById).slice(0, 2)) {
      if (!room()) break;
      selected.push({
        kind: "practice",
        heroId: hero.heroId,
        name: hero.name,
        img: hero.img,
        text: textPractice(hero, bucketName),
      });
    }
  }
  if (metaReady && baselineRate !== null) {
    for (const hero of byGames.filter((item) => item.quadrant === "signature").slice(0, 2)) {
      if (!room()) break;
      selected.push(cardOf("signature", hero, textSignature(hero, bucketName, baselineRate)));
    }
  }
  return selected;
}

function cardOf(kind: AdviceKind, hero: PlacedHero, text: string): AdviceCard {
  return { kind, heroId: hero.heroId, name: hero.name, img: hero.img, text };
}

type PracticeHero = {
  heroId: number;
  name: string;
  img: string | null;
  patchGames: number;
  lifetimeGames: number;
  metaPicks: number;
  metaWinRate: number | null;
  metaWilson: number | null;
};

function practicePool(meta: MetaRow[], played: PlacedHero[], lifeById: Map<number, number>): PracticeHero[] {
  const patchGames = new Map(played.map((hero) => [hero.heroId, hero.patchGames]));
  return meta
    .filter((row) => row.picks >= META_HIGH_PICKS && row.wilson !== null && row.wilson >= META_HIGH_WILSON)
    .map((row) => ({
      heroId: row.id,
      name: row.name,
      img: row.img,
      patchGames: patchGames.get(row.id) ?? 0,
      lifetimeGames: lifeById.get(row.id) ?? 0,
      metaPicks: row.picks,
      metaWinRate: row.winRate,
      metaWilson: row.wilson,
    }))
    .filter((hero) => hero.patchGames < FAMILIAR_GAMES)
    .sort((a, b) => {
      if ((a.patchGames > 0) !== (b.patchGames > 0)) return a.patchGames > 0 ? -1 : 1;
      return (b.metaWilson ?? 0) - (a.metaWilson ?? 0);
    });
}

function selfFacts(hero: PlacedHero, bucketName: string, baselineRate: number): string {
  const losses = hero.patchGames - hero.patchWins;
  return `В патче ${bucketName}: ${formatNumber(hero.patchWins)}–${formatNumber(losses)} (${formatPercent(hero.patchWinRate)}), ${gamesPhrase(hero.patchGames)}. Обычный винрейт этого патча ${formatPercent(baselineRate)}.`;
}

function textFamiliar(hero: PlacedHero, bucketName: string, baselineRate: number): string {
  return `${hero.name}. ${selfFacts(hero, bucketName, baselineRate)} В этом патче не ниже обычного винрейта, и у остальных герой тоже выигрывает.`;
}

function textSignature(hero: PlacedHero, bucketName: string, baselineRate: number): string {
  return `${hero.name}. ${selfFacts(hero, bucketName, baselineRate)} В этом патче не ниже обычного. У остальных так не выделяется.`;
}

function textBelow(hero: PlacedHero, bucketName: string, baselineRate: number): string {
  return `${hero.name}. ${selfFacts(hero, bucketName, baselineRate)} В этом патче ниже обычного винрейта.`;
}

function textPractice(hero: PracticeHero, bucketName: string): string {
  const patch =
    hero.patchGames === 0
      ? `В патче ${bucketName} на этом герое 0 игр.`
      : `В патче ${bucketName} ${gamesPhrase(hero.patchGames)}. Знакомым считается герой от ${FAMILIAR_GAMES} игр.`;
  const life =
    hero.lifetimeGames >= FAMILIAR_GAMES
      ? `За жизнь ${formatNumber(hero.lifetimeGames)} игр. В этом патче игр ещё мало.`
      : `За жизнь ${formatNumber(hero.lifetimeGames)} игр. Мало игр, это мета, не твой герой.`;
  return `${hero.name}. ${patch} ${life}`;
}

export function yourMetaBlurb(persona: string, bucketName: string, report: YourMetaReport): string {
  if (!report.heroesKnown) {
    return `${persona}. Патч ${bucketName}: герои патча не загрузились.`;
  }
  const base =
    report.baselineRate === null
      ? "винрейт патча не прочитан"
      : `${formatPercent(report.baselineRate)} при n=${formatNumber(report.baselineGames)}`;
  const familiar = report.played.filter((hero) => hero.patchGames >= FAMILIAR_GAMES).length;
  const above =
    report.baselineRate === null
      ? "без базы не считается"
      : formatNumber(report.played.filter((hero) => hero.signal === "above").length);
  return `${persona}. Патч ${bucketName}: ${base}. Героев с 20+ играми: ${formatNumber(familiar)}. Не ниже обычного винрейта: ${above}.`;
}
