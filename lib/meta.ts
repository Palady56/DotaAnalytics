import type { HeroMatchup, HeroStat } from "@/lib/opendota";
import { rankIcon, sampleMark, wilsonInterval, wilsonLower, winRate } from "@/lib/stats";

export const META_MIN_SAMPLE = 20;

export type SliceId = "pub" | "turbo" | "pro" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";
export type MetaView = "all" | "popular" | "winning";

const BRACKET_NAMES: Record<string, string> = {
  "1": "Herald",
  "2": "Guardian",
  "3": "Crusader",
  "4": "Archon",
  "5": "Legend",
  "6": "Ancient",
  "7": "Divine",
  "8": "Immortal",
};

export const SLICES: { id: SliceId; label: string }[] = [
  { id: "pub", label: "Публичные" },
  { id: "turbo", label: "Turbo" },
  { id: "pro", label: "Pro" },
  ...Object.entries(BRACKET_NAMES).map(([id, label]) => ({ id: id as SliceId, label })),
];

export function sliceMedal(slice: SliceId): string | null {
  if (!/^[1-8]$/.test(slice)) return null;
  return rankIcon(Number(slice) * 10);
}

export function parseSlice(value: string | undefined): SliceId {
  return SLICES.some((slice) => slice.id === value) ? (value as SliceId) : "pub";
}

export function parseView(value: string | undefined): MetaView {
  if (value === "all" || value === "popular" || value === "winning") return value;
  return "winning";
}

export function sliceCaption(slice: SliceId): string {
  if (slice === "pub") return "Публичные игры: поля pub_pick и pub_win. Это не номер патча и не Turbo.";
  if (slice === "turbo") return "Turbo: поля turbo_picks и turbo_wins. С публичными играми не смешано.";
  if (slice === "pro") return "Про-игры: поля pro_pick, pro_win и pro_ban. Бан есть только в этом срезе.";
  const name = BRACKET_NAMES[slice];
  return `Колонки ${slice}_pick и ${slice}_win, медаль ${name} по той же шкале, что rank_tier. Это не срез патча и не позиция 1–5.`;
}

export function attrLabel(attr: string | undefined): string {
  if (attr === "agi") return "ловкость";
  if (attr === "str") return "сила";
  if (attr === "int") return "интеллект";
  if (attr === "all") return "универсальный";
  return attr ? attr : "атрибут не пришёл";
}

const ROLE_RU: Record<string, string> = {
  Carry: "керри",
  Escape: "побег",
  Nuker: "нюкер",
  Initiator: "инициация",
  Durable: "стойкость",
  Disabler: "контроль",
  Support: "поддержка",
  Pusher: "осада",
};

export function roleLabel(role: string): string {
  return ROLE_RU[role] ?? role;
}

export function playPosition(roles: string[]): string | null {
  const carry = roles.indexOf("Carry");
  const support = roles.indexOf("Support");
  if (carry === -1 && support === -1) return null;
  if (support === -1 || (carry !== -1 && carry < support)) return "Керри";
  return "Поддержка";
}

export type MetaRow = {
  id: number;
  name: string;
  img: string | null;
  attr: string;
  roles: string[];
  picks: number;
  wins: number;
  winRate: number | null;
  wilson: number | null;
  pickShare: number | null;
  bans: number | null;
  trend: number[] | null;
  sample: ReturnType<typeof sampleMark>;
  rank: number | null;
};

function bracketValue(hero: HeroStat, slice: string, kind: "pick" | "win"): number {
  const key = `${slice}_${kind}` as keyof HeroStat;
  const value = hero[key];
  return typeof value === "number" ? value : 0;
}

function readCounts(hero: HeroStat, slice: SliceId): { picks: number; wins: number; bans: number | null; trend: number[] | null } {
  if (slice === "pub") {
    return { picks: hero.pub_pick ?? 0, wins: hero.pub_win ?? 0, bans: null, trend: hero.pub_pick_trend ?? null };
  }
  if (slice === "turbo") {
    return { picks: hero.turbo_picks ?? 0, wins: hero.turbo_wins ?? 0, bans: null, trend: hero.turbo_picks_trend ?? null };
  }
  if (slice === "pro") {
    return { picks: hero.pro_pick ?? 0, wins: hero.pro_win ?? 0, bans: hero.pro_ban ?? 0, trend: null };
  }
  return { picks: bracketValue(hero, slice, "pick"), wins: bracketValue(hero, slice, "win"), bans: null, trend: null };
}

export function buildMeta(heroes: HeroStat[], slice: SliceId): MetaRow[] {
  const counts = heroes.map((hero) => ({ hero, ...readCounts(hero, slice) }));
  const totalPicks = counts.reduce((sum, row) => sum + row.picks, 0);
  const rows: MetaRow[] = counts.map(({ hero, picks, wins, bans, trend }) => ({
    id: hero.id,
    name: hero.localized_name,
    img: hero.img ? `https://cdn.cloudflare.steamstatic.com${hero.img}` : null,
    attr: attrLabel(hero.primary_attr),
    roles: hero.roles ?? [],
    picks,
    wins,
    winRate: winRate(wins, Math.max(picks - wins, 0)),
    wilson: wilsonLower(wins, picks),
    pickShare: totalPicks > 0 ? picks / totalPicks : null,
    bans,
    trend: trend && trend.length >= 2 ? trend : null,
    sample: sampleMark(picks),
    rank: null,
  }));

  const ranked = rows
    .filter((row) => row.picks >= META_MIN_SAMPLE && row.wilson !== null)
    .sort((a, b) => (b.wilson ?? 0) - (a.wilson ?? 0));
  ranked.forEach((row, index) => {
    row.rank = index + 1;
  });
  return rows;
}

export function presentMeta(rows: MetaRow[], view: MetaView): MetaRow[] {
  const copy = [...rows];
  if (view === "popular") {
    return copy.filter((row) => row.picks >= META_MIN_SAMPLE).sort((a, b) => b.picks - a.picks);
  }
  if (view === "all") {
    return copy.sort((a, b) => b.picks - a.picks || a.name.localeCompare(b.name, "ru"));
  }
  const hasStable = copy.some((row) => row.picks >= META_MIN_SAMPLE);
  if (!hasStable) return copy.sort((a, b) => b.picks - a.picks || a.name.localeCompare(b.name, "ru"));
  return copy.sort((a, b) => {
    const eligibleA = a.picks >= META_MIN_SAMPLE ? 1 : 0;
    const eligibleB = b.picks >= META_MIN_SAMPLE ? 1 : 0;
    if (eligibleA !== eligibleB) return eligibleB - eligibleA;
    return (b.wilson ?? -1) - (a.wilson ?? -1) || b.picks - a.picks;
  });
}

export function metaHref(slice: SliceId, view: MetaView): string {
  const params = new URLSearchParams();
  if (slice !== "pub") params.set("slice", slice);
  if (view !== "winning") params.set("view", view);
  const query = params.toString();
  return `/meta${query ? `?${query}` : ""}`;
}

export function heroHref(heroId: number, slice: SliceId): string {
  return slice === "pub" ? `/heroes/${heroId}` : `/heroes/${heroId}?slice=${slice}`;
}

export type HeroQueryHit = { id: number; name: string; img: string | null };

function foldHero(value: string): string {
  return value
    .toLowerCase()
    .replace(/^npc_dota_hero_/, "")
    .replace(/[^a-z0-9]+/g, "");
}

export type MatchupVerdict = "small" | "lower" | "higher" | "crosses";

export type PresentedMatchup = {
  heroId: number;
  name: string;
  img: string | null;
  games: number;
  wins: number;
  winRate: number | null;
  deltaPp: number | null;
  verdict: MatchupVerdict;
};

export function presentMatchups(
  rows: HeroMatchup[],
  names: Map<number, { name: string; img: string | null }>,
): { rows: PresentedMatchup[]; games: number; wins: number; baseline: number | null } {
  const clean = rows.filter(
    (row) =>
      Number.isInteger(row.hero_id) &&
      Number.isFinite(row.games_played) &&
      Number.isFinite(row.wins) &&
      row.games_played > 0 &&
      row.wins >= 0 &&
      row.wins <= row.games_played,
  );
  const games = clean.reduce((sum, row) => sum + row.games_played, 0);
  const wins = clean.reduce((sum, row) => sum + row.wins, 0);
  const baseline = games > 0 ? wins / games : null;
  const presented = clean.map((row) => {
    const rate = winRate(row.wins, row.games_played - row.wins);
    const interval = wilsonInterval(row.wins, row.games_played);
    let verdict: MatchupVerdict = "small";
    if (row.games_played >= META_MIN_SAMPLE && interval && baseline !== null) {
      if (interval.upper < baseline) verdict = "lower";
      else if (interval.lower > baseline) verdict = "higher";
      else verdict = "crosses";
    }
    const known = names.get(row.hero_id);
    return {
      heroId: row.hero_id,
      name: known?.name ?? `Герой ${row.hero_id}`,
      img: known?.img ?? null,
      games: row.games_played,
      wins: row.wins,
      winRate: rate,
      deltaPp: rate !== null && baseline !== null ? (rate - baseline) * 100 : null,
      verdict,
    };
  });
  presented.sort((a, b) => b.games - a.games || a.name.localeCompare(b.name, "en"));
  return { rows: presented, games, wins, baseline };
}

const ITEM_CDN = "https://cdn.cloudflare.steamstatic.com";
const STANDALONE = new Set(["blink"]);

export type UsedItem = { key: string; name: string; img: string | null; games: number; wins: number };

function keepPurchasedItem(key: string, item: { qual?: string; created?: boolean } | undefined): boolean {
  if (STANDALONE.has(key)) return true;
  if (!item) return true;
  if (item.created) return true;
  return item.qual !== "component" && item.qual !== "secret_shop" && item.qual !== "consumable";
}

export function presentUsedItems(
  rows: { item: string; games: string | number; wins: string | number }[],
  catalog: Record<string, { dname?: string; img?: string; qual?: string; created?: boolean }> | null,
): UsedItem[] {
  const totals = new Map<string, { games: number; wins: number }>();
  for (const row of rows) {
    const games = Number(row.games);
    const wins = Number(row.wins);
    if (!row.item || !Number.isFinite(games) || games <= 0 || !Number.isFinite(wins) || wins < 0 || wins > games) continue;
    const current = totals.get(row.item) ?? { games: 0, wins: 0 };
    current.games += games;
    current.wins += wins;
    totals.set(row.item, current);
  }
  return [...totals.entries()]
    .filter(([key]) => keepPurchasedItem(key, catalog?.[key]))
    .sort((a, b) => b[1].games - a[1].games || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([key, value]) => {
      const item = catalog?.[key];
      return {
        key,
        name: item?.dname || key.replace(/_/g, " "),
        img: item?.img ? `${ITEM_CDN}${item.img}` : null,
        games: value.games,
        wins: value.wins,
      };
    });
}

export function findHeroes(heroes: HeroStat[], query: string, limit = 8): HeroQueryHit[] {
  const needle = foldHero(query);
  if (needle.length < 2) return [];
  const ranked: { rank: number; name: string; hit: HeroQueryHit }[] = [];
  for (const hero of heroes) {
    const fields = [foldHero(hero.localized_name), foldHero(hero.name ?? "")].filter(Boolean);
    let rank = 3;
    for (const field of fields) {
      if (field === needle) rank = Math.min(rank, 0);
      else if (field.startsWith(needle)) rank = Math.min(rank, 1);
      else if (needle.length >= 3 && field.includes(needle)) rank = Math.min(rank, 2);
    }
    if (rank === 3) continue;
    ranked.push({
      rank,
      name: hero.localized_name,
      hit: {
        id: hero.id,
        name: hero.localized_name,
        img: hero.img ? `https://cdn.cloudflare.steamstatic.com${hero.img}` : null,
      },
    });
  }
  ranked.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, "en"));
  return ranked.slice(0, limit).map((row) => row.hit);
}
