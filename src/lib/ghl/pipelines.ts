import { ghlFetch, ghlLocationId, ghlPipelineId } from "./client";

export interface GhlStage {
  id: string;
  name: string;
  position: number;
}

export interface GhlPipeline {
  id: string;
  name: string;
  stages: GhlStage[];
}

interface PipelinesResponse {
  pipelines: GhlPipeline[];
}

/**
 * Resolves the configured sales pipeline's stages, keyed by GHL's opaque
 * stageId. Stage IDs are per-location and can't be hardcoded reliably, so
 * this is always fetched live rather than cached in source.
 */
export async function getSalesPipelineStages(): Promise<Map<string, GhlStage>> {
  const { pipelines } = await ghlFetch<PipelinesResponse>(
    "/opportunities/pipelines",
    { locationId: ghlLocationId() },
  );

  const pipelineId = ghlPipelineId();
  const pipeline = pipelines.find((p) => p.id === pipelineId);
  if (!pipeline) {
    throw new Error(
      `Configured GHL_PIPELINE_ID (${pipelineId}) was not found in this location's pipelines`,
    );
  }

  return new Map(pipeline.stages.map((stage) => [stage.id, stage]));
}
