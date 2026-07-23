"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface Props {
  reps: { id: string; name: string }[];
}

const inputClasses =
  "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export function DashboardFilters({ reps }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const preset = searchParams.get("preset") ?? "last30";
  const owner = searchParams.get("owner") ?? "all";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    // Any filter change should read from cache again, not force-bypass —
    // only the explicit Refresh button does that.
    params.delete("refresh");
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Date range</label>
        <select
          value={preset}
          onChange={(e) => updateParams({ preset: e.target.value, from: null, to: null })}
          className={inputClasses}
        >
          <option value="last30">Last 30 days</option>
          <option value="last90">Last 90 days</option>
          <option value="lastYear">Last year</option>
          <option value="custom">Custom range</option>
        </select>
      </div>

      {preset === "custom" && (
        <>
          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">From</label>
            <input
              type="date"
              defaultValue={from}
              onChange={(e) => updateParams({ from: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">To</label>
            <input
              type="date"
              defaultValue={to}
              onChange={(e) => updateParams({ to: e.target.value })}
              className={inputClasses}
            />
          </div>
        </>
      )}

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

      <button
        type="button"
        onClick={() => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("refresh", Date.now().toString());
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        Refresh
      </button>
    </div>
  );
}
