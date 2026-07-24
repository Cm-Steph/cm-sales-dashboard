import { db } from "./client";
import { hashContactId } from "../privacy/hashContact";
import type { StageEventInsert, StageEventRow } from "./types";

export interface StageChangeInput {
  /** GHL exposes no execution/event-id merge field -- derived server-side if omitted. */
  eventId?: string;
  contactId: string;
  ownerId?: string | null;
  toStageId: string;
  /** GHL exposes no reliable timestamp merge field -- defaults to receipt time if omitted. */
  occurredAt?: string;
}

function deriveEventId(input: StageChangeInput): string {
  // GHL doesn't give us a per-execution id, so build a deterministic one
  // from what we do have. Minute-bucketed so retried webhook deliveries
  // for the *same* move collide (get de-duped), while a genuine later
  // move back to the same stage (a different minute) is treated as new.
  const minuteBucket = Math.floor(Date.now() / 60_000);
  return `${input.contactId}:${input.toStageId}:${minuteBucket}`;
}

/**
 * Records one pipeline stage move. Idempotent -- if the (derived or
 * supplied) event id has already been recorded, this is a silent no-op
 * rather than an error, since webhook deliveries can be retried.
 *
 * GHL's webhook payload only ever tells us the *current* stage, never the
 * previous one -- so from_stage_id is derived here by looking up this
 * contact's most recently recorded stage, not supplied by the caller.
 */
export async function recordStageChange(input: StageChangeInput): Promise<{ inserted: boolean }> {
  const contactRef = hashContactId(input.contactId);

  const { data: previous, error: lookupError } = await db()
    .from("stage_events")
    .select("to_stage_id")
    .eq("contact_ref", contactRef)
    .order("event_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const row: StageEventInsert = {
    ghl_event_id: input.eventId ?? deriveEventId(input),
    contact_ref: contactRef,
    owner_id: input.ownerId ?? null,
    from_stage_id: (previous as { to_stage_id: string } | null)?.to_stage_id ?? null,
    to_stage_id: input.toStageId,
    event_at: input.occurredAt ?? new Date().toISOString(),
  };
  // postgrest-js can't infer table row types without a codegen'd schema
  // (see lib/db/client.ts) -- `row` above is the real type check.
  const { error } = await db().from("stage_events").insert(row as never);

  if (error) {
    if (error.code === "23505") return { inserted: false }; // unique_violation = duplicate delivery
    throw error;
  }
  return { inserted: true };
}

// Safety cap matching the same reasoning as lib/ghl/opportunities.ts's
// MAX_PAGES -- fine while event volume is low; revisit (e.g. paginate, or
// pre-aggregate in SQL) once this pipeline has been live long enough to
// accumulate tens of thousands of events.
const MAX_ROWS = 20_000;

/** All recorded stage events, oldest first -- the full history needed to reconstruct past pipeline state. */
export async function fetchAllStageEvents(): Promise<StageEventRow[]> {
  const { data, error } = await db()
    .from("stage_events")
    .select("*")
    .order("event_at", { ascending: true })
    .limit(MAX_ROWS);
  if (error) throw error;
  return (data ?? []) as unknown as StageEventRow[];
}
