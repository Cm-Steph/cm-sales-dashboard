"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DateRangeFilter } from "./DateRangeFilter";

interface Props {
  reps: { id: string; name: string }[];
}

const inputClasses =
  "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-brand-violet dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export function DashboardFilters({ reps }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const owner = searchParams.get("owner") ?? "all";
  const compare = searchParams.get("compare") === "1";

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("refresh");
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <DateRangeFilter>
      <div>
        <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Rep</label>
        <select
          value={owner}
          onChange={(e) => updateParams({ owner: e.target.value === "all" ? null : e.target.value })}
          className={inputClasses}
        >
          <option value="all">All reps</option>
          {reps.map((rep) => (
            <option key={rep.id} value={rep.id}>
              {rep.name}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 pb-1.5 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={compare}
          onChange={(e) => updateParams({ compare: e.target.checked ? "1" : null })}
          className="h-4 w-4 rounded border-zinc-300 text-brand-violet focus:ring-brand-violet dark:border-zinc-700"
        />
        Compare to previous period
      </label>
    </DateRangeFilter>
  );
}
