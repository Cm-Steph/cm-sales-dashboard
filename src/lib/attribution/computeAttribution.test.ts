import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSourceAttribution, computeLandingPageAttribution } from "./computeAttribution";
import type { SafeOpportunity } from "../ghl/opportunities";
import type { GhlStage } from "../ghl/pipelines";

const stagesById = new Map<string, GhlStage>([
  ["s-won", { id: "s-won", name: "CMBA Closed - WON! 🎉", position: 12 }],
  ["s-qualified", { id: "s-qualified", name: "Qualified Booking ✅", position: 2 }],
]);

function opp(overrides: Partial<SafeOpportunity>): SafeOpportunity {
  return {
    id: Math.random().toString(36),
    contactRef: "hash",
    pipelineStageId: "s-qualified",
    assignedTo: null,
    status: "open",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastStageChangeAt: "2026-01-01T00:00:00.000Z",
    firstTouchSource: null,
    lastTouchSource: null,
    ...overrides,
  };
}

test("groups by first-touch utmSource and tracks wins", () => {
  const result = computeSourceAttribution(
    [
      opp({ pipelineStageId: "s-won", firstTouchSource: { utmSource: "ig" } }),
      opp({ pipelineStageId: "s-qualified", firstTouchSource: { utmSource: "ig" } }),
      opp({ pipelineStageId: "s-qualified", firstTouchSource: { utmSource: "google" } }),
    ],
    stagesById,
    "first",
  );

  const ig = result.find((r) => r.source === "ig");
  const google = result.find((r) => r.source === "google");
  assert.equal(ig?.total, 2);
  assert.equal(ig?.won, 1);
  assert.equal(ig?.winRate, 0.5);
  assert.equal(google?.total, 1);
  assert.equal(google?.won, 0);
});

test("falls back through session source / referrer / medium before Unknown", () => {
  const result = computeSourceAttribution(
    [
      opp({ firstTouchSource: { utmSessionSource: "Social media" } }),
      opp({ firstTouchSource: null }),
    ],
    stagesById,
    "first",
  );

  assert.ok(result.find((r) => r.source === "Social media"));
  assert.ok(result.find((r) => r.source === "Unknown"));
});

test("landing page attribution groups by URL path, dropping host and query string", () => {
  const result = computeLandingPageAttribution(
    [
      opp({
        pipelineStageId: "s-won",
        firstTouchSource: {
          url: "https://bookings.clinicmastery.com/how-to-come-off-the-tools-thank-you",
        },
      }),
      opp({
        firstTouchSource: {
          url: "https://bookings.clinicmastery.com/how-to-come-off-the-tools-thank-you?utm_source=ig",
        },
      }),
      opp({ firstTouchSource: { url: "https://bookings.clinicmastery.com/other-page" } }),
      opp({ firstTouchSource: null }),
    ],
    stagesById,
  );

  const leadMagnet = result.find((r) => r.source === "/how-to-come-off-the-tools-thank-you");
  assert.equal(leadMagnet?.total, 2, "same path with/without query string should group together");
  assert.equal(leadMagnet?.won, 1);
  assert.ok(result.find((r) => r.source === "/other-page"));
  assert.ok(result.find((r) => r.source === "Unknown"));
});

test("landing page attribution falls back to the raw string if the URL fails to parse", () => {
  const result = computeLandingPageAttribution(
    [opp({ firstTouchSource: { url: "not-a-valid-url" } })],
    stagesById,
  );
  assert.ok(result.find((r) => r.source === "not-a-valid-url"));
});
