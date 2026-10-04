const OPENID_NS = "http://specs.openid.net/auth/2.0";
const IDENTIFIER_SELECT = "http://specs.openid.net/auth/2.0/identifier_select";
const STEAM_OP = "https://steamcommunity.com/openid/login";

export function steamLoginUrl(callback: string, realm: string): string {
  const url = new URL(STEAM_OP);
  url.searchParams.set("openid.ns", OPENID_NS);
  url.searchParams.set("openid.mode", "checkid_setup");
  url.searchParams.set("openid.return_to", callback);
  url.searchParams.set("openid.realm", realm);
  url.searchParams.set("openid.identity", IDENTIFIER_SELECT);
  url.searchParams.set("openid.claimed_id", IDENTIFIER_SELECT);
  return url.toString();
}

export function callbackUrl(origin: string): string {
  return `${origin}/auth/steam/callback`;
}

export async function verifySteamCallback(params: URLSearchParams, expectedReturnTo: string): Promise<string> {
  const mode = params.get("openid.mode");
  if (mode === "cancel") throw new Error("cancel");
  if (mode !== "id_res") throw new Error("invalid");
  if (params.get("openid.op_endpoint") !== STEAM_OP) throw new Error("invalid");

  const claimed = params.get("openid.claimed_id") ?? "";
  const identity = params.get("openid.identity") ?? "";
  const steamId = claimed.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/)?.[1];
  if (!steamId || identity !== claimed) throw new Error("invalid");
  if ((params.get("openid.return_to") ?? "") !== expectedReturnTo) throw new Error("mismatch");

  const body = new URLSearchParams();
  for (const [key, value] of params) {
    if (key.startsWith("openid.")) body.append(key, value);
  }
  body.set("openid.mode", "check_authentication");

  let response: Response;
  try {
    response = await fetch(STEAM_OP, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "text/plain" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new Error("timeout");
  }
  if (!response.ok) throw new Error("invalid");
  const text = await response.text();
  if (!/^is_valid\s*:\s*true\s*$/im.test(text)) throw new Error("invalid");
  return steamId;
}
