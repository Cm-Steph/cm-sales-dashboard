import { getSalesPipelineStages, type GhlStage } from "./ghl/pipelines";
import { getUsers, type GhlUser } from "./ghl/users";
import { fetchAllSalesPipelineOpportunities, type SafeOpportunity } from "./ghl/opportunities";
import { fetchAllStageEvents } from "./db/stageEvents";
import { getOrSetCache } from "./cache";
import type { StageEventRow } from "./db/types";

// Stages/users change rarely (only when the pipeline or team roster is
// edited in GHL) so they get a longer TTL than the opportunity/event data.
const REFERENCE_DATA_TTL_SECONDS = 60 * 60;
const OPPORTUNITIES_TTL_SECONDS = 5 * 60;
const STAGE_EVENTS_TTL_SECONDS = 5 * 60;

// getSalesPipelineStages/getUsers return Maps, which JSON-serialize to "{}"
// in Redis — cache their entries as arrays and rebuild the Map on read.
export async function getCachedStages(bypass: boolean): Promise<Map<string, GhlStage>> {
  const entries = await getOrSetCache(
    "ghl:sales-pipeline-stages",
    REFERENCE_DATA_TTL_SECONDS,
    async () => Array.from((await getSalesPipelineStages()).entries()),
    { bypass },
  );
  return new Map(entries);
}

export async function getCachedUsers(bypass: boolean): Promise<Map<string, GhlUser>> {
  const entries = await getOrSetCache(
    "ghl:users",
    REFERENCE_DATA_TTL_SECONDS,
    async () => Array.from((await getUsers()).entries()),
    { bypass },
  );
  return new Map(entries);
}

export async function getCachedOpportunities(bypass: boolean): Promise<SafeOpportunity[]> {
  return getOrSetCache(
    "ghl:sales-pipeline-opportunities",
    OPPORTUNITIES_TTL_SECONDS,
    fetchAllSalesPipelineOpportunities,
    { bypass },
  );
}

export async function getCachedStageEvents(bypass: boolean): Promise<StageEventRow[]> {
  return getOrSetCache("db:stage-events", STAGE_EVENTS_TTL_SECONDS, fetchAllStageEvents, { bypass });
}
