type Entry = { value: unknown; storedAt: number; ttl: number };

const memory = new Map<string, Entry>();
const inflight = new Map<string, Promise<{ data: unknown; fetchedAt: number; stale: boolean }>>();

export type Cached<T> = { data: T; fetchedAt: number; stale: boolean };

type CacheOptions<T> = {
  staleOn429?: boolean;
  ttlFor?: (data: T) => number;
};

function isRateLimit(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && (error as { status: unknown }).status === 429;
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
  options?: CacheOptions<T>,
): Promise<Cached<T>> {
  const hit = memory.get(key);
  if (hit && Date.now() - hit.storedAt < hit.ttl) {
    return { data: hit.value as T, fetchedAt: hit.storedAt, stale: false };
  }

  const pending = inflight.get(key);
  if (pending) return pending as Promise<Cached<T>>;

  const promise = load()
    .then((data) => {
      const fetchedAt = Date.now();
      memory.set(key, { value: data, storedAt: fetchedAt, ttl: options?.ttlFor?.(data) ?? ttlMs });
      inflight.delete(key);
      return { data, fetchedAt, stale: false };
    })
    .catch((error: unknown) => {
      inflight.delete(key);
      if (options?.staleOn429 && isRateLimit(error) && hit) {
        return { data: hit.value as T, fetchedAt: hit.storedAt, stale: true };
      }
      throw error;
    });

  inflight.set(key, promise);
  return promise as Promise<Cached<T>>;
}

export function dropPlayerCache(accountId: number): number {
  const id = String(accountId);
  let dropped = 0;
  for (const key of memory.keys()) {
    const owned =
      key === `player:${id}` ||
      key === `recent:${id}` ||
      key === `totals:${id}` ||
      key === `counts:${id}` ||
      key === `peers:${id}` ||
      key.startsWith(`wl:${id}:`) ||
      key.startsWith(`heroes:${id}:`) ||
      key.startsWith(`matches:${id}:`);
    if (!owned) continue;
    memory.delete(key);
    inflight.delete(key);
    dropped += 1;
  }
  return dropped;
}
