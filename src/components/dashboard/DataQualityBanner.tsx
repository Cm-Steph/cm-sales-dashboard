/**
 * Consistent visual for "here's a real gap in the data behind the numbers
 * below" -- used any time a metric on this dashboard is known to be
 * incomplete or unreliable for the selected date range, so the team reads
 * the number correctly instead of trusting it at face value. Always state
 * what's missing, how much, and why, in that order.
 */
export function DataQualityBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      {children}
    </div>
  );
}
