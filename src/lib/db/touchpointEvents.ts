import { db } from "./client";
import { hashContactId } from "../privacy/hashContact";
import type { TouchpointEventInsert } from "./types";

export interface TouchpointInput {
  /** GHL exposes no execution/event-id merge field -- derived server-side if omitted. */
  eventId?: string;
  contactId: string;
  eventType: string;
  source?: Record<string, unknown> | null;
  /** GHL exposes no reliable timestamp merge field -- defaults to receipt time if omitted. */
  occurredAt?: string;
}

function deriveEventId(input: TouchpointInput): string {
  const minuteBucket = Math.floor(Date.now() / 60_000);
  return `${input.contactId}:${input.eventType}:${minuteBucket}`;
}

/** Same idempotency behavior as recordStageChange -- see there for why. */
export async function recordTouchpoint(input: TouchpointInput): Promise<{ inserted: boolean }> {
  const row: TouchpointEventInsert = {
    ghl_event_id: input.eventId ?? deriveEventId(input),
    contact_ref: hashContactId(input.contactId),
    event_type: input.eventType,
    source: input.source ?? null,
    event_at: input.occurredAt ?? new Date().toISOString(),
  };
  const { error } = await db().from("touchpoint_events").insert(row as never);

  if (error) {
    if (error.code === "23505") return { inserted: false };
    throw error;
  }
  return { inserted: true };
}
