const lastRefresh = new Map<number, number>();
const WAIT_MS = 60_000;

export function claimRefresh(accountId: number, now = Date.now()): { ok: true } | { ok: false; retryIn: number } {
  const previous = lastRefresh.get(accountId) ?? 0;
  const elapsed = now - previous;
  if (elapsed < WAIT_MS) return { ok: false, retryIn: Math.max(1, Math.ceil((WAIT_MS - elapsed) / 1000)) };
  lastRefresh.set(accountId, now);
  return { ok: true };
}

export function clearRefreshMark(accountId: number) {
  lastRefresh.delete(accountId);
}
