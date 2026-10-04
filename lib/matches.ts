import type { DraftPick, MatchPlayer, PlayerMatchRow, SlotHero } from "@/lib/opendota";

export const MATCH_PAGE_SIZE = 20;
export const TURBO_MODE = 23;

export type MatchFilters = {
  patch?: number;
  gameMode?: number;
  lobbyType?: number;
  heroId?: number;
  laneRole?: number;
  win?: 0 | 1;
  isRadiant?: 0 | 1;
  dateDays?: number;
  includedAccountId?: number;
  broad: boolean;
  offset: number;
};

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function intInRange(value: string | undefined, min: number, max: number): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) return undefined;
  return parsed;
}

function bit(value: string | undefined): 0 | 1 | undefined {
  if (value === "0" || value === "1") return Number(value) as 0 | 1;
  return undefined;
}

export function parseMatchFilters(raw: Record<string, string | string[] | undefined>): MatchFilters {
  const offset = intInRange(one(raw.offset), 0, 100_000) ?? 0;
  return {
    patch: intInRange(one(raw.patch), 0, 200),
    gameMode: intInRange(one(raw.mode), 0, 30),
    lobbyType: intInRange(one(raw.lobby), 0, 20),
    heroId: intInRange(one(raw.hero), 1, 500),
    laneRole: intInRange(one(raw.lane), 0, 4),
    win: bit(one(raw.result)),
    isRadiant: bit(one(raw.side)),
    dateDays: intInRange(one(raw.days), 1, 3650),
    includedAccountId: intInRange(one(raw.with), 1, 4_294_967_295),
    broad: one(raw.broad) === "1",
    offset,
  };
}

export function significantFlag(filters: MatchFilters): 0 | undefined {
  if (filters.broad || filters.gameMode === TURBO_MODE) return 0;
  return undefined;
}

export function matchListHref(accountId: number, filters: MatchFilters, offset = filters.offset): string {
  const params = new URLSearchParams();
  if (filters.patch !== undefined) params.set("patch", String(filters.patch));
  if (filters.gameMode !== undefined) params.set("mode", String(filters.gameMode));
  if (filters.lobbyType !== undefined) params.set("lobby", String(filters.lobbyType));
  if (filters.heroId !== undefined) params.set("hero", String(filters.heroId));
  if (filters.laneRole !== undefined) params.set("lane", String(filters.laneRole));
  if (filters.win !== undefined) params.set("result", String(filters.win));
  if (filters.isRadiant !== undefined) params.set("side", String(filters.isRadiant));
  if (filters.dateDays !== undefined) params.set("days", String(filters.dateDays));
  if (filters.includedAccountId !== undefined) params.set("with", String(filters.includedAccountId));
  if (filters.broad) params.set("broad", "1");
  if (offset > 0) params.set("offset", String(offset));
  const query = params.toString();
  return `/players/${accountId}/matches${query ? `?${query}` : ""}`;
}

export function pageWindow(offset: number, pageSize = MATCH_PAGE_SIZE) {
  return { start: offset, end: offset + pageSize };
}

export type DuoRelation = "same" | "against" | "missing" | "unknown";

export function duoRelation(
  heroes: Record<string, SlotHero> | undefined,
  accountId: number,
  otherId: number,
): DuoRelation {
  if (!heroes) return "unknown";
  const slots = Object.entries(heroes);
  const slotA = slots.find(([, player]) => player.account_id === accountId)?.[0];
  const slotB = slots.find(([, player]) => player.account_id === otherId)?.[0];
  if (slotA === undefined || slotB === undefined) return "missing";
  return (Number(slotA) < 128) === (Number(slotB) < 128) ? "same" : "against";
}

export function relationLabel(relation: DuoRelation): string {
  if (relation === "same") return "одна команда";
  if (relation === "against") return "соперники";
  if (relation === "missing") return "второй игрок не найден в слотах";
  return "слоты не пришли";
}

export type PartyRead = { text: string; groups: { partyId: number; names: string[] }[] };

export function readParty(players: MatchPlayer[] | null | undefined): PartyRead {
  if (!players || players.length === 0) {
    return { text: "Игроки не пришли, пати неизвестно.", groups: [] };
  }
  const withId = players.filter((player) => player.party_id !== null && player.party_id !== undefined);
  if (withId.length === 0) {
    return { text: "party_id нет. Пати неизвестно. party_size без этого поля состав не подтверждает.", groups: [] };
  }
  const buckets = new Map<number, string[]>();
  for (const player of withId) {
    const id = player.party_id as number;
    const name = player.personaname || (player.account_id ? `account ${player.account_id}` : "аноним");
    const list = buckets.get(id) ?? [];
    list.push(name);
    buckets.set(id, list);
  }
  const groups = [...buckets.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([partyId, names]) => ({ partyId, names }));
  if (groups.length === 0) {
    return {
      text: "party_id есть, но ни один id не совпал у двух игроков. Общая группа не подтверждена.",
      groups: [],
    };
  }
  return {
    text: "Совпавший party_id — факт группы в разобранном матче, не список друзей.",
    groups,
  };
}

export function draftSide(
  team: number,
  picks: DraftPick[],
  radiantHeroes: Set<number>,
  direHeroes: Set<number>,
): string {
  const heroes = picks.filter((pick) => pick.is_pick && pick.team === team && pick.hero_id).map((pick) => pick.hero_id as number);
  if (heroes.some((hero) => radiantHeroes.has(hero))) return "Radiant";
  if (heroes.some((hero) => direHeroes.has(hero))) return "Dire";
  return "сторона";
}

export function itemSlots(player: MatchPlayer): number[] {
  return [
    player.item_0,
    player.item_1,
    player.item_2,
    player.item_3,
    player.item_4,
    player.item_5,
    player.item_neutral,
  ].filter((item): item is number => typeof item === "number" && item > 0);
}

export function inventory(player: MatchPlayer): { slots: number[]; neutral: number | null } {
  const raw = [player.item_0, player.item_1, player.item_2, player.item_3, player.item_4, player.item_5];
  return {
    slots: raw.map((item) => (typeof item === "number" && item > 0 ? item : 0)),
    neutral: typeof player.item_neutral === "number" && player.item_neutral > 0 ? player.item_neutral : null,
  };
}

/** Valve tower_status: a set bit means that tower is still standing. Bits 0–10 are the eleven towers. */
export function standingTowers(mask: number | null | undefined): number | null {
  if (mask == null || !Number.isInteger(mask) || mask < 0) return null;
  let standing = 0;
  for (let bit = 0; bit < 11; bit += 1) {
    if ((mask & (1 << bit)) !== 0) standing += 1;
  }
  return standing;
}

export function playerWonRow(row: Pick<PlayerMatchRow, "player_slot" | "radiant_win">): boolean {
  return (row.player_slot < 128) === row.radiant_win;
}
