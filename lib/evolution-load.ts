import { buildMeta } from "./meta";
import { META_HIGH_PICKS, META_HIGH_WILSON } from "./your-meta";
import {
  EVOLUTION_WINDOW,
  buildEvolution,
  fromPlayerMatch,
  resolveEvolutionMode,
  type EvolutionReport,
} from "./evolution";
import type { HeroStat } from "./opendota";
import { dota } from "./sources";

export const EVOLUTION_SLICE_LABEL = "без Turbo";

export type EvolutionPageData = {
  report: EvolutionReport;
  view: ReturnType<typeof resolveEvolutionMode>;
  stale: boolean;
  images: Map<number, string | null>;
  metaHeroIds: Set<number> | null;
  playedHeroIds: number[];
  patchesLoaded: boolean;
};

export async function loadPlayerEvolution(accountId: number, requested: string | undefined): Promise<EvolutionPageData> {
  const [matchesR, patchesR, catalogR] = await Promise.allSettled([
    dota.getPlayerMatches(accountId, { limit: EVOLUTION_WINDOW, offset: 0 }),
    dota.getPatches(),
    dota.getHeroCatalog(),
  ]);
  if (matchesR.status === "rejected") {
    throw matchesR.reason instanceof Error ? matchesR.reason : new Error("История матчей недоступна");
  }

  const catalog: HeroStat[] = catalogR.status === "fulfilled" ? catalogR.value.data : [];
  const names = new Map(catalog.map((hero) => [hero.id, hero.localized_name]));
  const images = new Map(catalog.map((hero) => [hero.id, hero.img ? `https://cdn.cloudflare.steamstatic.com${hero.img}` : null]));
  const patches = patchesR.status === "fulfilled" ? patchesR.value.data : [];
  const rows = matchesR.value.data.map((row) => fromPlayerMatch(row));
  const probe = buildEvolution({
    rows,
    patches,
    heroNames: names,
    sliceLabel: EVOLUTION_SLICE_LABEL,
    mode: "patch",
  });
  const view = resolveEvolutionMode({
    requested,
    dated: probe.dated,
    patchCount: probe.patches.length,
  });
  const report =
    view.mode === "patch"
      ? probe
      : buildEvolution({
          rows,
          patches,
          heroNames: names,
          sliceLabel: EVOLUTION_SLICE_LABEL,
          mode: view.mode,
        });

  return {
    report,
    view,
    stale: matchesR.value.stale,
    images,
    metaHeroIds:
      catalogR.status === "fulfilled"
        ? new Set(
            buildMeta(catalog, "pub")
              .filter((hero) => hero.picks >= META_HIGH_PICKS && hero.wilson !== null && hero.wilson >= META_HIGH_WILSON)
              .map((hero) => hero.id),
          )
        : null,
    playedHeroIds: [...new Set(rows.flatMap((row) => (row.heroId === null ? [] : [row.heroId])))],
    patchesLoaded: patchesR.status === "fulfilled",
  };
}
