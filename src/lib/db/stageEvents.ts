import { db } from "./client";
import { hashContactId } from "../privacy/hashContact";
import type { StageEventInsert } from "./types";

export interface StageChangeInput {
  eventId: string;
  contactId: string;
  ownerId?: string | null;
  fromStageId?: string | null;
  toStageId: string;
  product?: string | null;
  occurredAt: string;
}

/**
 * Records one pipeline stage move. Idempotent -- if `eventId` (GHL's event
 * id) has already been recorded, this is a silent no-op rather than an
 * error, since webhook deliveries can be retried by the sender.
 */
export async function recordStageChange(input: StageChangeInput): Promise<{ inserted: boolean }> {
  const row: StageEventInsert = {
    ghl_event_id: input.eventId,
    contact_ref: hashContactId(input.contactId),
    owner_id: input.ownerId ?? null,
    from_stage_id: input.fromStageId ?? null,
    to_stage_id: input.toStageId,
    product: input.product ?? null,
    event_at: input.occurredAt,
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
