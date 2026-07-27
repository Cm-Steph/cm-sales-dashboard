import type { GhlStage } from "../ghl/pipelines";
import type { SafeOpportunity } from "../ghl/opportunities";
import type { SafeFormSubmission } from "../ghl/formSubmissions";
import { stageMappingByName } from "../funnel/stageMapping";

export interface FormSubmissionBreakdown {
  formName: string;
  submissions: number;
  /** Of those who submitted, how many have any opportunity at all in "03. Sales Pipeline". */
  becameOpportunity: number;
  won: number;
  /** Won / submissions. */
  conversionRate: number | null;
}

/**
 * Groups form submissions by form name, and joins each to whether that
 * contact ever became a pipeline opportunity / won -- purely via the
 * hashed contactRef, since both sides were hashed the same way at fetch
 * time and the raw contactId never needs to be compared directly.
 */
export function computeFormSubmissionAttribution(
  submissions: SafeFormSubmission[],
  opportunities: SafeOpportunity[],
  stagesById: Map<string, GhlStage>,
): FormSubmissionBreakdown[] {
  const contactRefsWithOpportunity = new Set<string>();
  const contactRefsWon = new Set<string>();

  for (const opp of opportunities) {
    contactRefsWithOpportunity.add(opp.contactRef);
    const stageName = stagesById.get(opp.pipelineStageId)?.name;
    const bucket = stageName ? stageMappingByName.get(stageName)?.bucket : undefined;
    if (bucket === "Won") contactRefsWon.add(opp.contactRef);
  }

  const totals = new Map<string, number>();
  const becameOpportunity = new Map<string, number>();
  const won = new Map<string, number>();

  for (const submission of submissions) {
    const key = submission.formName;
    totals.set(key, (totals.get(key) ?? 0) + 1);
    if (contactRefsWithOpportunity.has(submission.contactRef)) {
      becameOpportunity.set(key, (becameOpportunity.get(key) ?? 0) + 1);
    }
    if (contactRefsWon.has(submission.contactRef)) {
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
