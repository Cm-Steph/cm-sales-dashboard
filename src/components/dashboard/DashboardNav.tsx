"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/trend", label: "Trend" },
  { href: "/dashboard/journey", label: "Journey" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <nav className="flex gap-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={query ? `${tab.href}?${query}` : tab.href}
            className={`border-b-2 px-3 py-2.5 font-heading text-sm font-medium ${
              active
                ? "border-brand-yellow text-brand-eggplant dark:border-brand-yellow dark:text-brand-yellow"
                : "border-transparent text-zinc-500 hover:text-brand-eggplant dark:text-zinc-400 dark:hover:text-brand-yellow"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
