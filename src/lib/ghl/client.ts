import { requireEnv } from "../env";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

export class GhlApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly body: string,
  ) {
    super(`GHL API error ${status} on ${path}: ${body}`);
  }
}

export function ghlLocationId(): string {
  return requireEnv("GHL_LOCATION_ID");
}

export function ghlPipelineId(): string {
  return requireEnv("GHL_PIPELINE_ID");
}

/**
 * Server-only fetch wrapper for the GHL v2 ("LeadConnector") API.
 * Never import this from a Client Component — the private integration
 * token must not reach the browser.
 *
 * NOTE: GHL is inconsistent about query param casing between endpoints
 * (e.g. /opportunities/search wants `location_id`, but /opportunities/pipelines
 * and /users/ want `locationId`). Pass params exactly as each caller specifies —
 * do not "normalize" casing here.
 */
export async function ghlFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const url = new URL(`${GHL_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${requireEnv("GHL_API_KEY")}`,
      Version: GHL_API_VERSION,
      Accept: "application/json",
    },
    // Aggregate-level caching happens above this layer (lib/cache.ts);
    // never let Next.js cache raw GHL responses.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new GhlApiError(res.status, path, body);
  }

  return (await res.json()) as T;
}
