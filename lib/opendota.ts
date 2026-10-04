import { cached } from "@/lib/cache";

const BASE = "https://api.opendota.com/api";
const DAY = 24 * 60 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

export class SourceError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "SourceError";
  }
}

export type PlayerProfile = {
  account_id: number;
  personaname: string | null;
  name: string | null;
  steamid: string | null;
  avatarfull: string | null;
  profileurl: string | null;
  last_match_time: string | null;
  fh_unavailable: boolean | null;
};

export type PlayerResponse = {
  profile: PlayerProfile | null;
  rank_tier: number | null;
  leaderboard_rank: number | null;
};

export type WinLoss = { win: number; lose: number };

export type RecentMatch = {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  hero_id: number;
  start_time: number;
  duration: number;
  game_mode: number;
  lobby_type: number;
  version: number | null;
  kills: number;
  deaths: number;
  assists: number;
  gold_per_min: number;
  xp_per_min: number;
  last_hits: number;
  lane: number | null;
  lane_role: number | null;
  is_roaming: boolean | null;
  hero_healing: number | null;
  tower_damage: number | null;
  party_size: number | null;
};

export type PlayerHero = {
  hero_id: number;
  last_played: number;
  games: number;
  win: number;
};

export type TotalRow = { field: string; n: number; sum: number };

export type CountCell = { games: number; win: number };

export type PlayerCounts = {
  game_mode?: Record<string, CountCell>;
  lobby_type?: Record<string, CountCell>;
  lane_role?: Record<string, CountCell>;
  region?: Record<string, CountCell>;
  is_radiant?: Record<string, CountCell>;
};

export type NamedConstant = { id: number; name: string; balanced?: boolean };

export type PatchConstant = { id: number; name: string; date: string };

export type HeroStat = {
  id: number;
  localized_name: string;
  name?: string;
  img?: string;
  primary_attr?: string;
  roles?: string[];
  pub_pick?: number;
  pub_win?: number;
  pub_pick_trend?: number[];
  pub_win_trend?: number[];
  turbo_picks?: number;
  turbo_wins?: number;
  turbo_picks_trend?: number[];
  turbo_wins_trend?: number[];
  pro_pick?: number;
  pro_win?: number;
  pro_ban?: number;
  "1_pick"?: number;
  "1_win"?: number;
  "2_pick"?: number;
  "2_win"?: number;
  "3_pick"?: number;
  "3_win"?: number;
  "4_pick"?: number;
  "4_win"?: number;
  "5_pick"?: number;
  "5_win"?: number;
  "6_pick"?: number;
  "6_win"?: number;
  "7_pick"?: number;
  "7_win"?: number;
  "8_pick"?: number;
  "8_win"?: number;
};

export type SearchHit = {
  account_id: number;
  personaname: string | null;
  avatarfull: string | null;
  last_match_time: string | null;
};

async function opendota<T>(path: string, timeoutMs = 12_000): Promise<T> {
  const url = new URL(path.startsWith("http") ? path : `${BASE}${path}`);
  const key = process.env.OPENDOTA_API_KEY;
  if (key) url.searchParams.set("api_key", key);

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw new SourceError(408, "OpenDota не успел ответить.");
    }
    throw error;
  }

  if (response.status === 429) {
    throw new SourceError(429, "Лимит источника, данные могут быть вчерашними из кэша. Сейчас сохранённого среза нет.");
  }
  if (!response.ok) {
    throw new SourceError(response.status, `OpenDota ответил ${response.status} на ${url.pathname}`);
  }
  return (await response.json()) as T;
}

function playerPath(accountId: number, suffix: string) {
  return `/players/${accountId}${suffix}`;
}

export function getPlayer(accountId: number) {
  return cached(`player:${accountId}`, TEN_MINUTES, () => opendota<PlayerResponse>(playerPath(accountId, "")));
}

export function getWinLoss(accountId: number, patch?: number) {
  const query = patch === undefined ? "" : `?patch=${patch}`;
  return cached(`wl:${accountId}:${patch ?? "all"}`, TEN_MINUTES, () =>
    opendota<WinLoss>(playerPath(accountId, `/wl${query}`), 45_000),
  );
}

export function getRecentMatches(accountId: number) {
  return cached(`recent:${accountId}`, TEN_MINUTES, () =>
    opendota<RecentMatch[]>(playerPath(accountId, "/recentMatches")),
  );
}

export function getPlayerHeroes(accountId: number, patch?: number) {
  const query = patch === undefined ? "" : `?patch=${patch}`;
  return cached(`heroes:${accountId}:${patch ?? "all"}`, TEN_MINUTES, () =>
    opendota<PlayerHero[]>(playerPath(accountId, `/heroes${query}`), 45_000),
  );
}

export function getTotals(accountId: number) {
  return cached(`totals:${accountId}`, TEN_MINUTES, () => opendota<TotalRow[]>(playerPath(accountId, "/totals")));
}

export function getCounts(accountId: number) {
  return cached(`counts:${accountId}`, TEN_MINUTES, () => opendota<PlayerCounts>(playerPath(accountId, "/counts")));
}

export type Peer = {
  account_id: number;
  last_played?: number;
  win?: number;
  games?: number;
  with_win?: number;
  with_games?: number;
  against_win?: number;
  against_games?: number;
  with_gpm_sum?: number;
  with_xpm_sum?: number;
  personaname?: string;
  name?: string;
  avatarfull?: string;
};

export function getPeers(accountId: number) {
  return cached(`peers:${accountId}`, TEN_MINUTES, () => opendota<Peer[]>(playerPath(accountId, "/peers"), 20_000), {
    staleOn429: true,
  });
}

export function getPatches() {
  return cached("constants:patch", DAY, () => opendota<PatchConstant[]>("/constants/patch"));
}

export function getGameModes() {
  return cached("constants:game_mode", DAY, () => opendota<Record<string, NamedConstant>>("/constants/game_mode"));
}

export function getLobbyTypes() {
  return cached("constants:lobby_type", DAY, () => opendota<Record<string, NamedConstant>>("/constants/lobby_type"));
}

export function getHeroCatalog() {
  return cached("heroStats", DAY, () => opendota<HeroStat[]>("/heroStats"), { staleOn429: true });
}

export type HeroMatchup = { hero_id: number; games_played: number; wins: number };

export function getHeroMatchups(heroId: number) {
  return cached(`matchups:${heroId}`, DAY, () => opendota<HeroMatchup[]>(`/heroes/${heroId}/matchups`), {
    staleOn429: true,
  });
}

export type ItemPopularity = {
  start_game_items?: Record<string, number>;
  early_game_items?: Record<string, number>;
  mid_game_items?: Record<string, number>;
  late_game_items?: Record<string, number>;
};

export function getHeroItemPopularity(heroId: number) {
  return cached(`itemPopularity:${heroId}`, DAY, () => opendota<ItemPopularity>(`/heroes/${heroId}/itemPopularity`), {
    staleOn429: true,
  });
}

export type ActivityMatch = {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  start_time: number;
};

export function getPlayerActivity(accountId: number) {
  const path = `/players/${accountId}/matches?limit=500&offset=0&date=90&significant=0&project=start_time&project=player_slot&project=radiant_win`;
  return cached(`activity:${accountId}`, TEN_MINUTES, () => opendota<ActivityMatch[]>(path, 45_000), {
    staleOn429: true,
  });
}

export type SlotHero = { account_id: number | null; hero_id: number };

export type PlayerMatchRow = {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
  game_mode: number;
  lobby_type: number;
  hero_id?: number;
  start_time?: number;
  version?: number | null;
  kills?: number | null;
  deaths?: number | null;
  assists?: number | null;
  average_rank?: number | null;
  leaver_status?: number | null;
  party_size?: number | null;
  hero_variant?: number | null;
  lane_role?: number | null;
  gold_per_min?: number | null;
  xp_per_min?: number | null;
  last_hits?: number | null;
  hero_healing?: number | null;
  tower_damage?: number | null;
  lane?: number | null;
  is_roaming?: boolean | null;
  heroes?: Record<string, SlotHero>;
};

export type DraftPick = {
  is_pick?: boolean;
  hero_id?: number;
  team?: number;
  order?: number;
  ord?: number;
};

export type MatchPlayer = {
  account_id?: number | null;
  player_slot: number;
  hero_id?: number | null;
  personaname?: string | null;
  kills?: number | null;
  deaths?: number | null;
  assists?: number | null;
  gold_per_min?: number | null;
  xp_per_min?: number | null;
  last_hits?: number | null;
  denies?: number | null;
  net_worth?: number | null;
  hero_damage?: number | null;
  tower_damage?: number | null;
  hero_healing?: number | null;
  level?: number | null;
  lane_role?: number | null;
  is_roaming?: boolean | null;
  party_id?: number | null;
  party_size?: number | null;
  hero_variant?: number | null;
  leaver_status?: number | null;
  teamfight_participation?: number | null;
  ability_upgrades_arr?: number[] | null;
  item_0?: number | null;
  item_1?: number | null;
  item_2?: number | null;
  item_3?: number | null;
  item_4?: number | null;
  item_5?: number | null;
  backpack_0?: number | null;
  backpack_1?: number | null;
  backpack_2?: number | null;
  item_neutral?: number | null;
  rank_tier?: number | null;
};

export type MatchDetail = {
  match_id: number;
  radiant_win?: boolean | null;
  duration?: number | null;
  start_time?: number | null;
  game_mode?: number | null;
  lobby_type?: number | null;
  version?: number | null;
  patch?: number | null;
  region?: number | null;
  cluster?: number | null;
  radiant_score?: number | null;
  dire_score?: number | null;
  picks_bans?: DraftPick[] | null;
  teamfights?: unknown[] | null;
  players?: MatchPlayer[] | null;
  replay_url?: string | null;
  radiant_gold_adv?: number[] | null;
  radiant_xp_adv?: number[] | null;
  tower_status_radiant?: number | null;
  tower_status_dire?: number | null;
  first_blood_time?: number | null;
};

export type ItemConstant = {
  id: number;
  dname?: string;
  img?: string;
  qual?: string;
  created?: boolean;
};

export type ItemTiming = {
  hero_id: number;
  item: string;
  time: number;
  games: string | number;
  wins: string | number;
};

export function getHeroItemTimings(heroId: number) {
  return cached(`itemTimings:${heroId}`, DAY, () => opendota<ItemTiming[]>(`/scenarios/itemTimings?hero_id=${heroId}`), {
    staleOn429: true,
  });
}

const MATCH_LIST_FIELDS = [
  "duration",
  "hero_id",
  "start_time",
  "version",
  "kills",
  "deaths",
  "assists",
  "average_rank",
  "leaver_status",
  "party_size",
  "hero_variant",
  "lane_role",
  "gold_per_min",
  "xp_per_min",
  "last_hits",
  "hero_healing",
  "tower_damage",
  "lane",
  "is_roaming",
];

export type PlayerMatchQuery = {
  limit: number;
  offset: number;
  patch?: number;
  gameMode?: number;
  lobbyType?: number;
  heroId?: number;
  laneRole?: number;
  win?: 0 | 1;
  isRadiant?: 0 | 1;
  dateDays?: number;
  includedAccountId?: number;
  significant?: 0 | 1;
};

function matchListPath(accountId: number, query: PlayerMatchQuery) {
  const params = new URLSearchParams();
  params.set("limit", String(query.limit));
  params.set("offset", String(query.offset));
  for (const field of MATCH_LIST_FIELDS) params.append("project", field);
  if (query.patch !== undefined) params.set("patch", String(query.patch));
  if (query.gameMode !== undefined) params.set("game_mode", String(query.gameMode));
  if (query.lobbyType !== undefined) params.set("lobby_type", String(query.lobbyType));
  if (query.heroId !== undefined) params.set("hero_id", String(query.heroId));
  if (query.laneRole !== undefined) params.set("lane_role", String(query.laneRole));
  if (query.win !== undefined) params.set("win", String(query.win));
  if (query.isRadiant !== undefined) params.set("is_radiant", String(query.isRadiant));
  if (query.dateDays !== undefined) params.set("date", String(query.dateDays));
  if (query.includedAccountId !== undefined) params.set("included_account_id", String(query.includedAccountId));
  if (query.significant !== undefined) params.set("significant", String(query.significant));
  return `/players/${accountId}/matches?${params.toString()}`;
}

export function getPlayerMatches(accountId: number, query: PlayerMatchQuery) {
  const path = matchListPath(accountId, query);
  return cached(`matches:${accountId}:${path}`, TEN_MINUTES, () => opendota<PlayerMatchRow[]>(path, 45_000), {
    staleOn429: true,
  });
}

export function getMatch(matchId: number) {
  return cached(`match:${matchId}`, TEN_MINUTES, () => opendota<MatchDetail>(`/matches/${matchId}`, 20_000), {
    staleOn429: true,
    ttlFor: (match) => (match.version == null ? TEN_MINUTES : DAY),
  });
}

export function getItems() {
  return cached("constants:items", DAY, () => opendota<Record<string, ItemConstant>>("/constants/items"), {
    staleOn429: true,
  });
}

export function getRegions() {
  return cached("constants:region", DAY, () => opendota<Record<string, string>>("/constants/region"), {
    staleOn429: true,
  });
}

export function searchPlayers(query: string) {
  const q = query.trim();
  return cached(`search:${q.toLowerCase()}`, TEN_MINUTES, () =>
    opendota<SearchHit[]>(`/search?q=${encodeURIComponent(q)}`),
  );
}

export async function officialPatchLetter(): Promise<{ letter: string | null; title: string | null; fetchedAt: number }> {
  return cached("steam:dota-news-letter", 6 * 60 * 60 * 1000, async () => {
    const response = await fetch(
      "https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=570&count=15&maxlength=120&format=json",
      { cache: "no-store", signal: AbortSignal.timeout(8_000) },
    );
    if (!response.ok) return { letter: null, title: null };
    const body = (await response.json()) as {
      appnews?: { newsitems?: { title?: string }[] };
    };
    const items = body.appnews?.newsitems ?? [];
    const match = items
      .map((item) => item.title ?? "")
      .map((title) => ({ title, letter: title.match(/\b7\.\d+[a-z]?\b/i)?.[0] ?? null }))
      .find((item) => item.letter && /gameplay patch|patch/i.test(item.title));
    return { letter: match?.letter ?? null, title: match?.title ?? null };
  }).then((entry) => ({ ...entry.data, fetchedAt: entry.fetchedAt }));
}
