import { test } from "node:test";
import assert from "node:assert/strict";
import { computeFunnel } from "./computeFunnel";
import type { SafeOpportunity } from "../ghl/opportunities";
import type { GhlStage } from "../ghl/pipelines";
import type { GhlUser } from "../ghl/users";

const STAGES: [string, GhlStage][] = [
  ["s-noshow", { id: "s-noshow", name: "Strategy Session - No Show 📞", position: 0 }],
  ["s-cancel", { id: "s-cancel", name: "Strategy Session - Cancelled 📞", position: 1 }],
  ["s-qualified", { id: "s-qualified", name: "Qualified Booking ✅", position: 2 }],
  ["s-cmba-delib", { id: "s-cmba-delib", name: "CMBA In Deliberation 🤔", position: 6 }],
  ["s-cmba-won", { id: "s-cmba-won", name: "CMBA Closed - WON! 🎉", position: 12 }],
  ["s-lost", { id: "s-lost", name: "Closed - Lost 🥶", position: 15 }],
  ["s-unknown", { id: "s-unknown", name: "Some Brand New Stage Nobody Mapped Yet", position: 99 }],
];
const stagesById = new Map(STAGES);

const users: Map<string, GhlUser> = new Map([
  ["jack", { id: "jack", name: "Jack O'Brien" }],
]);

function opp(overrides: Partial<SafeOpportunity>): SafeOpportunity {
  return {
    id: Math.random().toString(36),
    contactRef: "hash",
    pipelineStageId: "s-qualified",
    assignedTo: "jack",
    status: "open",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastStageChangeAt: "2026-01-01T00:00:00.000Z",
    firstTouchSource: null,
    lastTouchSource: null,
    ...overrides,
  };
}

test("buckets opportunities by mapped stage and computes rates", () => {
  const result = computeFunnel(
    [
      opp({ pipelineStageId: "s-noshow" }),
      opp({ pipelineStageId: "s-cancel" }),
      opp({ pipelineStageId: "s-qualified" }),
      opp({ pipelineStageId: "s-cmba-delib" }),
      opp({ pipelineStageId: "s-cmba-won" }),
      opp({ pipelineStageId: "s-lost" }),
    ],
    stagesById,
    users,
  );

  assert.equal(result.totals.total, 6);
  assert.equal(result.totals.noShow, 1);
  assert.equal(result.totals.cancelled, 1);
  assert.equal(result.totals.won, 1);
  assert.equal(result.totals.lost, 1);
  // Qualified = Qualified + InDeliberation + Won + Lost (+ Booked + Nurture) = 4
  assert.equal(result.totals.qualified, 4);
  assert.equal(result.totals.totalToWonRate, 1 / 6);
  assert.equal(result.totals.qualifiedToWonRate, 1 / 4);
});

test("groups by rep, including an explicit unassigned bucket", () => {
  const result = computeFunnel(
    [
      opp({ assignedTo: "jack", pipelineStageId: "s-qualified" }),
      opp({ assignedTo: null, pipelineStageId: "s-qualified" }),
    ],
    stagesById,
    users,
  );

  assert.equal(result.byRep.length, 2);
  const jack = result.byRep.find((r) => r.ownerId === "jack");
  const unassigned = result.byRep.find((r) => r.ownerId === "unassigned");
  assert.equal(jack?.ownerName, "Jack O'Brien");
  assert.equal(jack?.counts.total, 1);
  assert.equal(unassigned?.ownerName, "Unassigned");
  assert.equal(unassigned?.counts.total, 1);
});

test("stages missing from stageMapping.ts surface as unmapped instead of vanishing", () => {
  const result = computeFunnel(
    [opp({ pipelineStageId: "s-unknown" }), opp({ pipelineStageId: "s-qualified" })],
    stagesById,
    users,
  );

  assert.equal(result.totals.total, 1, "unmapped opportunities excluded from bucket totals");
  assert.equal(result.unmappedStages.length, 1);
  assert.equal(result.unmappedStages[0].stageName, "Some Brand New Stage Nobody Mapped Yet");
  assert.equal(result.unmappedStages[0].count, 1);
});

test("handles an empty opportunity list without dividing by zero", () => {
  const result = computeFunnel([], stagesById, users);
  assert.equal(result.totals.total, 0);
  assert.equal(result.totals.totalToWonRate, null);
  assert.equal(result.totals.qualifiedToWonRate, null);
  assert.equal(result.byRep.length, 0);
});
