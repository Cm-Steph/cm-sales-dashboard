import { test } from "node:test";
import assert from "node:assert/strict";
import { computeFormSubmissionAttribution } from "./computeFormSubmissions";
import type { SafeOpportunity } from "../ghl/opportunities";
import type { SafeFormSubmission } from "../ghl/formSubmissions";
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

function submission(overrides: Partial<SafeFormSubmission>): SafeFormSubmission {
  return {
    contactRef: "hash",
    formName: "Some Form",
    submittedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

test("joins submissions to opportunity outcomes purely via contactRef", () => {
  const result = computeFormSubmissionAttribution(
    [
      submission({ formName: "Lead Magnet A", contactRef: "won-contact" }),
      submission({ formName: "Lead Magnet A", contactRef: "qualified-contact" }),
      submission({ formName: "Lead Magnet A", contactRef: "no-opportunity-contact" }),
    ],
    [
      opp({ contactRef: "won-contact", pipelineStageId: "s-won" }),
      opp({ contactRef: "qualified-contact", pipelineStageId: "s-qualified" }),
    ],
    stagesById,
  );

  const row = result.find((r) => r.formName === "Lead Magnet A");
  assert.equal(row?.submissions, 3);
  assert.equal(row?.becameOpportunity, 2, "2 of the 3 submitters have an opportunity");
  assert.equal(row?.won, 1, "only 1 of the 3 submitters won");
  assert.equal(row?.conversionRate, 1 / 3);
});

test("does not credit a form with an unrelated opportunity that pre-dates the submission", () => {
  const result = computeFormSubmissionAttribution(
    [
      submission({
        formName: "Newsletter Subscription",
        contactRef: "existing-member",
        submittedAt: "2026-06-01T00:00:00.000Z",
      }),
    ],
    [
      // This opportunity existed a year before the submission -- an
      // existing member subscribing to a newsletter didn't cause it.
      opp({
        contactRef: "existing-member",
        pipelineStageId: "s-won",
        createdAt: "2025-06-01T00:00:00.000Z",
      }),
    ],
    stagesById,
  );

  const row = result.find((r) => r.formName === "Newsletter Subscription");
  assert.equal(row?.becameOpportunity, 0, "pre-existing opportunity isn't credited to this form");
  assert.equal(row?.won, 0);
});

test("credits a form when the resulting opportunity is created after the submission", () => {
  const result = computeFormSubmissionAttribution(
    [
      submission({
        formName: "New | Systems Blueprint",
        contactRef: "new-lead",
        submittedAt: "2026-06-01T00:00:00.000Z",
      }),
    ],
    [
      opp({
        contactRef: "new-lead",
        pipelineStageId: "s-won",
        createdAt: "2026-06-15T00:00:00.000Z",
      }),
    ],
    stagesById,
  );

  const row = result.find((r) => r.formName === "New | Systems Blueprint");
  assert.equal(row?.becameOpportunity, 1);
  assert.equal(row?.won, 1);
});

test("a form with zero conversions still reports a real 0, not null", () => {
  const result = computeFormSubmissionAttribution(
    [submission({ formName: "Internal Admin Form", contactRef: "some-member" })],
    [],
    stagesById,
  );
  const row = result[0];
  assert.equal(row.becameOpportunity, 0);
  assert.equal(row.won, 0);
  assert.equal(row.conversionRate, 0);
});

test("excludes member-servicing / internal-ops forms regardless of naming variant", () => {
  const result = computeFormSubmissionAttribution(
    [
      submission({ formName: "Billing & Accounts Change/Update Request" }),
      submission({ formName: "Form 2 | Mentor Mastery Enrolment " }),
      submission({ formName: "Form 1 | Practice Leaders Program Enrolment" }),
      submission({ formName: "Member Gift Request" }),
      submission({ formName: "[INTERNAL] Membership Change/Update Request " }),
      submission({ formName: "Membership Change/Update Request" }),
      submission({ formName: "[Internal] Refund Request Form" }),
      submission({ formName: "Member General Support Enquiry" }),
      submission({ formName: "New | Systems Blueprint | 2025 | PDF File" }),
    ],
    [],
    stagesById,
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].formName, "New | Systems Blueprint | 2025 | PDF File");
});

test("groups multiple submissions of the same form together", () => {
  const result = computeFormSubmissionAttribution(
    [
      submission({ formName: "Repeat Form", contactRef: "a" }),
      submission({ formName: "Repeat Form", contactRef: "b" }),
      submission({ formName: "Other Form", contactRef: "c" }),
    ],
    [],
    stagesById,
  );
  assert.equal(result.length, 2);
  assert.equal(result.find((r) => r.formName === "Repeat Form")?.submissions, 2);
});
