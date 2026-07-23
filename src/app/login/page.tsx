import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const params = await searchParams;
  const from = params.from && params.from.startsWith("/") ? params.from : "/dashboard";

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <form
        action={login}
        className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Clinic Mastery Sales Dashboard
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Enter the team password to continue.
        </p>
        <input type="hidden" name="from" value={from} />
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
          className="mb-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {params.error && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">Incorrect password.</p>
        )}
        <button
          type="submit"
          className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
