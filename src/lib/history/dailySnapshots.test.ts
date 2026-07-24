import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDailyBucketSnapshots } from "./dailySnapshots";
import type { StageEventRow } from "../db/types";

function event(overrides: Partial<StageEventRow>): StageEventRow {
  return {
    id: Math.random().toString(36),
    ghl_event_id: null,
    contact_ref: "contact-a",
    owner_id: null,
    from_stage_id: null,
    to_stage_id: "Qualified Booking ✅",
    product: null,
    event_at: "2026-07-01T00:00:00.000Z",
    received_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

test("carries a contact's stage forward across days with no new events", () => {
  const events = [event({ contact_ref: "a", to_stage_id: "Qualified Booking ✅", event_at: "2026-07-01T12:00:00.000Z" })];

  const snapshots = computeDailyBucketSnapshots(
    events,
    new Date("2026-07-01T00:00:00.000Z"),
    new Date("2026-07-03T00:00:00.000Z"),
  );

  assert.equal(snapshots.length, 3);
  for (const snapshot of snapshots) {
    assert.equal(snapshot.counts.Qualified, 1, `expected Qualified=1 on ${snapshot.date}`);
  }
});

test("moves a contact between buckets on the correct day", () => {
  const events = [
    event({ contact_ref: "a", to_stage_id: "Qualified Booking ✅", event_at: "2026-07-01T00:00:00.000Z" }),
    event({ contact_ref: "a", to_stage_id: "CMBA Closed - WON! 🎉", event_at: "2026-07-02T00:00:00.000Z" }),
  ];

  const snapshots = computeDailyBucketSnapshots(
    events,
    new Date("2026-07-01T00:00:00.000Z"),
    new Date("2026-07-02T00:00:00.000Z"),
  );

  assert.equal(snapshots[0].counts.Qualified, 1);
  assert.equal(snapshots[0].counts.Won, 0);
  assert.equal(snapshots[1].counts.Qualified, 0);
  assert.equal(snapshots[1].counts.Won, 1);
});

test("a contact's state before their first event doesn't count anywhere", () => {
  const events = [event({ contact_ref: "a", to_stage_id: "Qualified Booking ✅", event_at: "2026-07-05T00:00:00.000Z" })];

  const snapshots = computeDailyBucketSnapshots(
    events,
    new Date("2026-07-01T00:00:00.000Z"),
    new Date("2026-07-05T00:00:00.000Z"),
  );

  const total = (s: (typeof snapshots)[number]) => Object.values(s.counts).reduce((a, b) => a + b, 0);
  assert.equal(total(snapshots[0]), 0, "no events yet on July 1");
  assert.equal(total(snapshots[4]), 1, "event landed on July 5");
});

test("events with a stage name missing from stageMapping.ts are silently excluded, not crashed on", () => {
  const events = [event({ contact_ref: "a", to_stage_id: "Some Brand New Stage" })];
  const snapshots = computeDailyBucketSnapshots(
    events,
    new Date("2026-07-01T00:00:00.000Z"),
    new Date("2026-07-01T00:00:00.000Z"),
  );
  const total = Object.values(snapshots[0].counts).reduce((a, b) => a + b, 0);
  assert.equal(total, 0);
});
