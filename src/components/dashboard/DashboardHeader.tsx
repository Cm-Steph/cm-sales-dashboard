import Image from "next/image";
import { logout } from "@/app/dashboard/actions";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950 lg:px-8">
      <div className="flex items-center gap-3">
        <Image src="/brand/logo-main.png" alt="Clinic Mastery" width={140} height={28} priority />
        <span className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />
        <span className="font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Sales
        </span>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="text-sm font-medium text-zinc-500 hover:text-brand-eggplant dark:text-zinc-400 dark:hover:text-brand-yellow"
        >
          Log out
        </button>
      </form>
    </header>
  );
}
