import { recordStageChange } from "../src/lib/db/stageEvents";
import { recordTouchpoint } from "../src/lib/db/touchpointEvents";
import { db } from "../src/lib/db/client";

async function main() {
  const eventId = `test-${Date.now()}`;

  const first = await recordStageChange({
    eventId,
    contactId: "test-contact-id",
    ownerId: "test-owner",
    fromStageId: "stage-a",
    toStageId: "stage-b",
    product: "CMBA",
    occurredAt: new Date().toISOString(),
  });
  console.log("First insert:", first); // expect { inserted: true }

  const duplicate = await recordStageChange({
    eventId, // same eventId -- should be treated as a duplicate delivery
    contactId: "test-contact-id",
    toStageId: "stage-c",
    occurredAt: new Date().toISOString(),
  });
  console.log("Duplicate insert (same eventId):", duplicate); // expect { inserted: false }

  const touchpoint = await recordTouchpoint({
    eventId: `test-tp-${Date.now()}`,
    contactId: "test-contact-id",
    eventType: "form_submitted",
    source: { utmSource: "test" },
    occurredAt: new Date().toISOString(),
  });
  console.log("Touchpoint insert:", touchpoint);

  const { data, error } = await db()
    .from("stage_events")
    .select("*")
    .eq("ghl_event_id", eventId);
  console.log("Row stored (checking no PII columns exist):", data, error);

  // Clean up test rows so they don't pollute real data
  await db().from("stage_events").delete().eq("ghl_event_id", eventId);
  await db().from("touchpoint_events").delete().like("ghl_event_id", "test-tp-%");
  console.log("Cleaned up test rows.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
