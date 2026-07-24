import { recordStageChange } from "../src/lib/db/stageEvents";
import { recordTouchpoint } from "../src/lib/db/touchpointEvents";
import { db } from "../src/lib/db/client";

async function main() {
  const contactId = `test-contact-${Date.now()}`;

  const first = await recordStageChange({
    contactId,
    ownerId: "test-owner",
    toStageId: "stage-b",
  });
  console.log("First insert:", first); // expect { inserted: true }

  const duplicate = await recordStageChange({
    contactId,
    toStageId: "stage-b", // same contact+stage within the same minute -- should de-dup
  });
  console.log("Duplicate insert (same contact+stage+minute):", duplicate); // expect { inserted: false }

  const second = await recordStageChange({
    contactId,
    toStageId: "stage-c", // a genuinely different move -- should derive from_stage_id = "stage-b"
  });
  console.log("Second move (expect from_stage_id: 'stage-b'):", second);

  const touchpoint = await recordTouchpoint({
    contactId,
    eventType: "form_submitted",
    source: { utmSource: "test" },
  });
  console.log("Touchpoint insert:", touchpoint);

  const { data, error } = await db()
    .from("stage_events")
    .select("*")
    .like("ghl_event_id", `${contactId}:%`);
  console.log("Rows stored (checking no PII columns exist):", data, error);

  // Clean up test rows so they don't pollute real data
  await db().from("stage_events").delete().like("ghl_event_id", `${contactId}:%`);
  await db().from("touchpoint_events").delete().like("ghl_event_id", `${contactId}:%`);
  console.log("Cleaned up test rows.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
