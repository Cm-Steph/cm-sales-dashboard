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
    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      {unresolvedPastCount} of {total} Strategy Sessions in this range ({unresolvedPct}%) have already
      happened but were never marked Showed / No-Show in GHL — they&apos;re excluded from the counts
      below, which only reflect the {resolvedCount} sessions someone updated. Get in the habit of
      marking attendance after each call for these numbers to become reliable.
    </div>
  );
}
