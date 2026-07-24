import { db } from "./client";
import { hashContactId } from "../privacy/hashContact";
import type { TouchpointEventInsert } from "./types";

export interface TouchpointInput {
  eventId: string;
  contactId: string;
  eventType: string;
  source?: Record<string, unknown> | null;
  occurredAt: string;
}

/** Same idempotency behavior as recordStageChange -- see there for why. */
export async function recordTouchpoint(input: TouchpointInput): Promise<{ inserted: boolean }> {
  const row: TouchpointEventInsert = {
    ghl_event_id: input.eventId,
    contact_ref: hashContactId(input.contactId),
    event_type: input.eventType,
    source: input.source ?? null,
    event_at: input.occurredAt,
  };
  const { error } = await db().from("touchpoint_events").insert(row as never);

  if (error) {
    if (error.code === "23505") return { inserted: false };
    throw error;
  }
  return { inserted: true };
}
