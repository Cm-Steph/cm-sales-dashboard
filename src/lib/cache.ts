import { Redis } from "@upstash/redis";
import { requireEnv } from "./env";

let client: Redis | null = null;

function redis(): Redis {
  if (!client) {
    client = new Redis({
      url: requireEnv("KV_REST_API_URL"),
      token: requireEnv("KV_REST_API_TOKEN"),
    });
  }
  return client;
}

/**
 * Caches the result of an expensive fetch (the full GHL pipeline scan) so
 * repeated dashboard loads / filter changes don't re-hit the GHL API on
 * every request. Short TTL by design — this is "feels live", not a
 * database: worst case, data is a few minutes stale until the next
 * request past the TTL refreshes it, or the user hits Refresh.
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  options: { bypass?: boolean } = {},
): Promise<T> {
  if (!options.bypass) {
    const cached = await redis().get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  }

  const fresh = await fetcher();
  await redis().set(key, fresh, { ex: ttlSeconds });
  return fresh;
}
