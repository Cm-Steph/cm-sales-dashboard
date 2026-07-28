import { DataQualityBanner } from "./DataQualityBanner";

export function AttendanceCoverageBanner({
  unresolvedPastCount,
  resolvedCount,
}: {
  unresolvedPastCount: number;
  resolvedCount: number;
}) {
  if (unresolvedPastCount === 0) return null;

  const total = unresolvedPastCount + resolvedCount;
  const unresolvedPct = Math.round((unresolvedPastCount / total) * 100);

  return (
    <DataQualityBanner>
      {unresolvedPastCount} of {total} Strategy Sessions in this range ({unresolvedPct}%) have already
      happened but were never marked Showed / No-Show in GHL — they&apos;re excluded from the SS
      Attended / SS Show Rate numbers below, which only reflect the {resolvedCount} sessions someone
      updated. Get in the habit of marking attendance after each call for these numbers to become
      reliable.
    </DataQualityBanner>
  );
}
