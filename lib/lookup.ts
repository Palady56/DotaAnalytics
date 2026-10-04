const STEAM64_BASE = BigInt("76561197960265728");
const ACCOUNT_ID_MAX = BigInt("4294967295");

export type ParsedQuery =
  | { kind: "account"; accountId: number }
  | { kind: "vanity"; vanity: string }
  | { kind: "nickname"; query: string }
  | { kind: "match"; matchId: number }
  | { kind: "friend_code" }
  | { kind: "empty" }
  | { kind: "invalid" };

export function accountIdFromSteam64(steamId64: string): number | null {
  if (!/^\d{17}$/.test(steamId64)) return null;
  const account = BigInt(steamId64) - STEAM64_BASE;
  if (account <= BigInt(0) || account > ACCOUNT_ID_MAX) return null;
  return Number(account);
}

export function parsePlayerQuery(raw: string): ParsedQuery {
  const input = raw.trim();
  if (!input) return { kind: "empty" };

  if (/s\.team\/p\//i.test(input) || /steamcommunity\.com\/user\//i.test(input)) {
    return { kind: "friend_code" };
  }

  const compact = input.replace(/\s+/g, "");
  if (/^[A-Za-z0-9]{4,5}(?:-[A-Za-z0-9]{4,5})+$/.test(compact)) {
    return { kind: "friend_code" };
  }

  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      const profile = url.pathname.match(/\/profiles\/(\d+)/);
      if (profile) {
        const from64 = accountIdFromSteam64(profile[1]);
        if (from64) return { kind: "account", accountId: from64 };
        return { kind: "invalid" };
      }
      const vanity = url.pathname.match(/\/id\/([^/]+)/);
      if (vanity) return { kind: "vanity", vanity: decodeURIComponent(vanity[1]) };
      return { kind: "invalid" };
    } catch {
      return { kind: "invalid" };
    }
  }

  if (/^\d+$/.test(input)) {
    if (input.length >= 16) {
      const accountId = accountIdFromSteam64(input);
      return accountId ? { kind: "account", accountId } : { kind: "invalid" };
    }
    const accountId = Number(input);
    if (!Number.isSafeInteger(accountId) || accountId <= 0) return { kind: "invalid" };
    if (accountId > Number(ACCOUNT_ID_MAX)) return { kind: "match", matchId: accountId };
    return { kind: "account", accountId };
  }

  if (isNickname(input)) return { kind: "nickname", query: input };
  return { kind: "invalid" };
}

function isNickname(input: string): boolean {
  if (input.length < 2 || input.length > 64) return false;
  if (!/^[\p{L}\p{N} ._'^[\](){}+-]+$/u.test(input)) return false;
  return /[\p{L}\p{N}]/u.test(input);
}

export type AccountRef = { id: number } | { id: null; reason: "empty" | "friend" | "bad" };

export async function resolveAccountRef(raw: string | undefined): Promise<AccountRef> {
  const input = raw?.trim() ?? "";
  if (!input) return { id: null, reason: "empty" };
  let text = input;
  if (/^(www\.)?steamcommunity\.com\//i.test(text)) text = `https://${text}`;
  const playerLink = text.match(/\/players\/(\d{1,12})(?:\/|$|\?)/);
  if (playerLink) {
    const id = Number(playerLink[1]);
    if (Number.isSafeInteger(id) && id > 0 && id <= Number(ACCOUNT_ID_MAX)) return { id };
  }
  const parsed = parsePlayerQuery(text);
  if (parsed.kind === "account") return { id: parsed.accountId };
  if (parsed.kind === "friend_code") return { id: null, reason: "friend" };
  if (parsed.kind === "vanity") {
    try {
      const id = await resolveVanity(parsed.vanity);
      return id ? { id } : { id: null, reason: "bad" };
    } catch {
      return { id: null, reason: "bad" };
    }
  }
  return { id: null, reason: "bad" };
}

export function accountRefMessage(ref: AccountRef): string | null {
  if (ref.id !== null || ref.reason === "empty") return null;
  if (ref.reason === "friend") return "Код друга не открывает профиль. Нужна ссылка Steam или номер.";
  return "Профиль не найден. Нужна ссылка Steam или номер игрока.";
}

export async function resolveVanity(vanity: string): Promise<number | null> {
  const key = process.env.STEAM_WEB_API_KEY;
  if (!key) return null;
  const url = new URL("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/");
  url.searchParams.set("key", key);
  url.searchParams.set("vanityurl", vanity);
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error("Steam не ответил на ResolveVanityURL");
  const body = (await response.json()) as { response?: { success?: number; steamid?: string } };
  if (body.response?.success !== 1 || !body.response.steamid) return null;
  return accountIdFromSteam64(body.response.steamid);
}
