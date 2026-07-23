export type FunnelBucket =
  | "Booked"
  | "Qualified"
  | "NoShow"
  | "Cancelled"
  | "InDeliberation"
  | "Won"
  | "Lost"
  | "Nurture";

export type Product = "CMBA" | "Elevate" | "DNU";

export interface StageMapping {
  /** Exact GHL stage name (source of truth — stage IDs are opaque and per-location). */
  stageName: string;
  bucket: FunnelBucket;
  product?: Product;
}

/**
 * Maps every stage in "03. Sales Pipeline" (GHL pipeline id 8QvAH4AM1KEUZnfe15vY)
 * to a funnel bucket, confirmed against the live pipeline on 2026-07-23.
 *
 * Any stage returned by the API that isn't listed here falls into an
 * "Unmapped" bucket at aggregation time and should surface as a warning on
 * the dashboard rather than silently vanishing from the numbers — update
 * this file when stages are added/renamed in GHL.
 */
export const stageMappings: StageMapping[] = [
  { stageName: "Strategy Session - No Show 📞", bucket: "NoShow" },
  { stageName: "Strategy Session - Cancelled 📞", bucket: "Cancelled" },
  { stageName: "Qualified Booking ✅", bucket: "Qualified" },
  { stageName: "Decision Call Scheduled ✅", bucket: "Booked" },
  { stageName: "Decision Call - No Show 📞", bucket: "NoShow" },
  { stageName: "Decision Call - Cancelled 📞", bucket: "Cancelled" },
  { stageName: "CMBA In Deliberation 🤔", bucket: "InDeliberation", product: "CMBA" },
  { stageName: "Elevate In Deliberation 🤔", bucket: "InDeliberation", product: "Elevate" },
  { stageName: "🔥- 🥶 Elevate In Deliberation", bucket: "InDeliberation", product: "Elevate" },
  { stageName: "🔥- 🥶 CMBA In Deliberation", bucket: "InDeliberation", product: "CMBA" },
  { stageName: "Nurturing Stage (Incubator)🔥", bucket: "Nurture" },
  { stageName: "Long Term Nurture ⌛", bucket: "Nurture" },
  { stageName: "CMBA Closed - WON! 🎉", bucket: "Won", product: "CMBA" },
  { stageName: "Elevate Closed - WON! 🎉", bucket: "Won", product: "Elevate" },
  { stageName: "DNU Closed - WON! 🎉", bucket: "Won", product: "DNU" },
  { stageName: "Closed - Lost 🥶", bucket: "Lost" },
  { stageName: "No Longer Interested 🤷‍♀️", bucket: "Lost" },
];

export const stageMappingByName = new Map(stageMappings.map((m) => [m.stageName, m]));
