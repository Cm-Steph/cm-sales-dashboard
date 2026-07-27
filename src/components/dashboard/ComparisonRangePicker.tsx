"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { dateFilterInputClasses as inputClasses } from "./DateRangeFilter";

/**
 * Shown only when the "Compare" checkbox is on (see DashboardFilters.tsx).
 * Lets the comparison window be picked independently of the main date
 * range -- e.g. main range "Last 30 days" compared against just "Last 7
 * days", or a fully custom historical window -- rather than being locked
 * to "immediately preceding, same length" (still the default via the
 * "Previous period" option).
 */
export function ComparisonRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const comparePreset = searchParams.get("comparePreset") ?? "previous";
  const compareFrom = searchParams.get("compareFrom") ?? "";
  const compareTo = searchParams.get("compareTo") ?? "";

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("refresh");
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
      <div>
        <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
          Compare against
        </label>
        <select
          value={comparePreset}
          onChange={(e) =>
            updateParams({ comparePreset: e.target.value, compareFrom: null, compareTo: null })
          }
          className={inputClasses}
        >
          <option value="previous">Previous period (auto)</option>
          <option value="last7">Last 7 days</option>
          <option value="last30">Last 30 days</option>
          <option value="last90">Last 90 days</option>
          <option value="lastYear">Last year</option>
          <option value="custom">Custom range</option>
        </select>
      </div>

      {comparePreset === "custom" && (
        <>
          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">From</label>
            <input
              type="date"
              defaultValue={compareFrom}
              onChange={(e) => updateParams({ compareFrom: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">To</label>
            <input
              type="date"
              defaultValue={compareTo}
              onChange={(e) => updateParams({ compareTo: e.target.value })}
              className={inputClasses}
            />
          </div>
        </>
      )}
    </div>
  );
}
