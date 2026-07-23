import { getSalesPipelineStages } from "../src/lib/ghl/pipelines";
import { getUsers } from "../src/lib/ghl/users";
import { fetchAllSalesPipelineOpportunities, withinRange } from "../src/lib/ghl/opportunities";
import { computeFunnel } from "../src/lib/funnel/computeFunnel";

async function main() {
  const stages = await getSalesPipelineStages();
  console.log(`Stages resolved: ${stages.size}`);

  const users = await getUsers();
  console.log(`Users resolved: ${users.size}`);

  const opportunities = await fetchAllSalesPipelineOpportunities();
  console.log(`Opportunities fetched: ${opportunities.length}`);

  const sample = opportunities[0];
  console.log("Sample sanitized opportunity (no PII expected):", sample);

  const unmapped = new Set<string>();
  for (const opp of opportunities) {
    if (!stages.has(opp.pipelineStageId)) unmapped.add(opp.pipelineStageId);
  }
  console.log(`Stage ids present on opportunities but missing from /pipelines: ${unmapped.size}`);

  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const inLast30 = opportunities.filter((o) => withinRange(o, last30, now)).length;
  console.log(`Opportunities with lastStageChangeAt in last 30 days: ${inLast30}`);

  const ownerCounts = new Map<string, number>();
  for (const opp of opportunities) {
    const owner = opp.assignedTo ? users.get(opp.assignedTo)?.name ?? opp.assignedTo : "(unassigned)";
    ownerCounts.set(owner, (ownerCounts.get(owner) ?? 0) + 1);
  }
  console.log("Opportunity counts by owner:", Object.fromEntries(ownerCounts));

  const stageCounts = new Map<string, number>();
  for (const opp of opportunities) {
    const name = stages.get(opp.pipelineStageId)?.name ?? `UNKNOWN(${opp.pipelineStageId})`;
    stageCounts.set(name, (stageCounts.get(name) ?? 0) + 1);
  }
  console.log("Opportunity counts by stage:", Object.fromEntries(stageCounts));

  const result = computeFunnel(opportunities, stages, users);
  console.log("\n--- computeFunnel totals ---");
  console.log(result.totals);
  console.log("\n--- computeFunnel unmapped stages ---");
  console.log(result.unmappedStages);
  console.log("\n--- computeFunnel top 5 reps by total ---");
  console.log(result.byRep.slice(0, 5));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
