"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DateRangeFilter } from "./DateRangeFilter";

interface Props {
  reps: { id: string; name: string }[];
}

const inputClasses =
  "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export function DashboardFilters({ reps }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const owner = searchParams.get("owner") ?? "all";

  function updateOwner(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("refresh");
    if (value === "all") params.delete("owner");
    else params.set("owner", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <DateRangeFilter>
      <div>
        <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Rep</label>
        <select value={owner} onChange={(e) => updateOwner(e.target.value)} className={inputClasses}>
          <option value="all">All reps</option>
          {reps.map((rep) => (
            <option key={rep.id} value={rep.id}>
              {rep.name}
            </option>
          ))}
        </select>
      </div>
    </DateRangeFilter>
  );
}
