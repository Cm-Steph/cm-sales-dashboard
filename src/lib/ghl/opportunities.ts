import { ghlFetch, ghlLocationId, ghlPipelineId } from "./client";
import { hashContactId } from "../privacy/hashContact";

export interface AttributionSource {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  utmSessionSource?: string;
  medium?: string;
  referrer?: string;
}

/**
 * An opportunity with all customer-identifying fields stripped. This is the
 * only shape allowed to flow into caching, storage, or the UI — raw GHL
 * opportunity JSON (which embeds the contact's name/email/phone inline)
 * must never leave lib/ghl/opportunities.ts.
 */
export interface SafeOpportunity {
  id: string;
  contactRef: string;
  pipelineStageId: string;
  assignedTo: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastStageChangeAt: string;
  firstTouchSource: AttributionSource | null;
  lastTouchSource: AttributionSource | null;
}

interface RawAttribution extends AttributionSource {
  isFirst?: boolean;
  isLast?: boolean;
  ip?: string;
  userAgent?: string;
  pageUrl?: string;
  url?: string;
}

interface RawOpportunity {
  id: string;
  contactId: string;
  pipelineStageId: string;
  assignedTo?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastStageChangeAt?: string;
  attributions?: RawAttribution[];
}

interface SearchResponse {
  opportunities: RawOpportunity[];
  meta: {
    total: number;
    startAfter?: number;
    startAfterId?: string;
    nextPage?: number | null;
  };
}

const PAGE_LIMIT = 100;
// Safety cap on pagination so a runaway loop can't hammer the GHL API
// indefinitely. Revisit if the pipeline genuinely grows past ~10k open+closed
// opportunities — at that point, full-scan pagination on every cache miss
// (see fetchAllSalesPipelineOpportunities) stops being cheap and this should
// move to the Phase 2 database instead of live GHL calls.
const MAX_PAGES = 100;

function pickAttribution(raw?: RawAttribution): AttributionSource | undefined {
  if (!raw) return undefined;
  const {
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    utmSessionSource,
    medium,
    referrer,
  } = raw;
  return {
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    utmSessionSource,
    medium,
    referrer,
  };
}

function sanitize(raw: RawOpportunity): SafeOpportunity {
  const attributions = raw.attributions ?? [];
  return {
    id: raw.id,
    contactRef: hashContactId(raw.contactId),
    pipelineStageId: raw.pipelineStageId,
    assignedTo: raw.assignedTo ?? null,
    status: raw.status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    lastStageChangeAt: raw.lastStageChangeAt ?? raw.updatedAt,
    firstTouchSource: pickAttribution(attributions.find((a) => a.isFirst)) ?? null,
    lastTouchSource: pickAttribution(attributions.find((a) => a.isLast)) ?? null,
  };
}

/**
 * Fetches every opportunity in the configured Sales Pipeline, sanitized
 * (no customer name/email/phone) and de-identified (contactId one-way
 * hashed to contactRef).
 *
 * GHL's /opportunities/search has no server-side date-range filter, and
 * because Steph wants reporting based on *last pipeline movement* (not
 * creation date), we can't rely on the API's newest-created-first sort
 * order to stop early either — an old lead can move stages today. So this
 * does a full paginated scan of the pipeline. It's called behind the
 * short-TTL cache in lib/cache.ts, not on every request.
 *
 * NOTE the param casing here is `location_id`/`pipeline_id` (snake_case) —
 * this endpoint does NOT match the camelCase used by /opportunities/pipelines
 * or /users/. Confirmed against the live API, not assumed.
 */
export async function fetchAllSalesPipelineOpportunities(): Promise<SafeOpportunity[]> {
  const results: SafeOpportunity[] = [];
  let startAfter: number | undefined;
  let startAfterId: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await ghlFetch<SearchResponse>("/opportunities/search", {
      location_id: ghlLocationId(),
      pipeline_id: ghlPipelineId(),
      limit: PAGE_LIMIT,
      startAfter,
      startAfterId,
    });

    for (const raw of response.opportunities) {
      results.push(sanitize(raw));
    }

    if (response.opportunities.length < PAGE_LIMIT) break;

    startAfter = response.meta.startAfter;
    startAfterId = response.meta.startAfterId;
    if (startAfter === undefined || startAfterId === undefined) break;
  }

  return results;
}

export function withinRange(
  opportunity: SafeOpportunity,
  from: Date,
  to: Date,
  dateField: "lastStageChangeAt" | "createdAt" = "lastStageChangeAt",
): boolean {
  const value = new Date(opportunity[dateField]).getTime();
  return value >= from.getTime() && value <= to.getTime();
}
