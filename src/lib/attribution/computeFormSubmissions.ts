import type { GhlStage } from "../ghl/pipelines";
import type { SafeOpportunity } from "../ghl/opportunities";
import type { SafeFormSubmission } from "../ghl/formSubmissions";
import { stageMappingByName } from "../funnel/stageMapping";

// Member-servicing / internal-ops forms (billing changes, program enrolment
// paperwork, gift requests) get filled out by people who are already
// members -- counting them here would make it look like "forms" are driving
// new pipeline, when really it's existing customers doing admin. Matched by
// substring (case-insensitive) since GHL's own names carry inconsistent
// "[INTERNAL]" prefixes / trailing whitespace across near-duplicate forms.
const EXCLUDED_FORM_NAME_SUBSTRINGS = [
  "billing & accounts",
  "mentor mastery enrolment",
  "practice leaders program enrolment",
  "member gift request",
  "membership change/update request",
  "refund request",
  "member general support enquiry",
];

function isExcludedForm(formName: string): boolean {
  const normalized = formName.toLowerCase();
  return EXCLUDED_FORM_NAME_SUBSTRINGS.some((substring) => normalized.includes(substring));
}

export interface FormSubmissionBreakdown {
  formName: string;
  submissions: number;
  /** Of those who submitted, how many have an opportunity created on or after that submission -- i.e. plausibly resulting from it, not some unrelated pre-existing pipeline record. */
  becameOpportunity: number;
  won: number;
  /** Won / submissions. */
  conversionRate: number | null;
}

function isWonBucket(opp: SafeOpportunity, stagesById: Map<string, GhlStage>): boolean {
  const stageName = stagesById.get(opp.pipelineStageId)?.name;
  const bucket = stageName ? stageMappingByName.get(stageName)?.bucket : undefined;
  return bucket === "Won";
}

/**
 * Groups form submissions by form name, and joins each to the opportunities
 * that plausibly resulted from it -- purely via the hashed contactRef
 * (both sides hashed the same way at fetch time, no raw contactId needed),
 * AND requiring the opportunity's createdAt to be on or after the
 * submission's submittedAt. Without that ordering check, a contact with
 * any unrelated pre-existing opportunity (e.g. an existing member who
 * later fills out an admin form) would wrongly count as "became an
 * opportunity from" that form -- an opportunity can't be caused by a form
 * submitted after it already existed.
 */
export function computeFormSubmissionAttribution(
  submissions: SafeFormSubmission[],
  opportunities: SafeOpportunity[],
  stagesById: Map<string, GhlStage>,
): FormSubmissionBreakdown[] {
  const opportunitiesByContact = new Map<string, SafeOpportunity[]>();
  for (const opp of opportunities) {
    const existing = opportunitiesByContact.get(opp.contactRef);
    if (existing) existing.push(opp);
    else opportunitiesByContact.set(opp.contactRef, [opp]);
  }

  const totals = new Map<string, number>();
  const becameOpportunity = new Map<string, number>();
  const won = new Map<string, number>();

  for (const submission of submissions) {
    if (isExcludedForm(submission.formName)) continue;
    const key = submission.formName;
    totals.set(key, (totals.get(key) ?? 0) + 1);

    const submittedAtMs = new Date(submission.submittedAt).getTime();
    const resultingOpportunities = (opportunitiesByContact.get(submission.contactRef) ?? []).filter(
      (opp) => new Date(opp.createdAt).getTime() >= submittedAtMs,
    );

    if (resultingOpportunities.length > 0) {
      becameOpportunity.set(key, (becameOpportunity.get(key) ?? 0) + 1);
    }
    if (resultingOpportunities.some((opp) => isWonBucket(opp, stagesById))) {
      won.set(key, (won.get(key) ?? 0) + 1);
    }
  }

  return Array.from(totals.entries())
    .map(([formName, count]) => {
      const wonCount = won.get(formName) ?? 0;
      return {
        formName,
        submissions: count,
        becameOpportunity: becameOpportunity.get(formName) ?? 0,
        won: wonCount,
        conversionRate: count > 0 ? wonCount / count : null,
      };
    })
    .sort((a, b) => b.submissions - a.submissions);
}
