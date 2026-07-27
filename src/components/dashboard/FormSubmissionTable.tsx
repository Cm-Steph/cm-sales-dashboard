import type { FormSubmissionBreakdown } from "@/lib/attribution/computeFormSubmissions";
import { InfoTooltip } from "./InfoTooltip";

function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}

export function FormSubmissionTable({ rows }: { rows: FormSubmissionBreakdown[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No form submissions in this range.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-zinc-50 text-left font-heading text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-2 font-medium">
              <span className="inline-flex items-center">
                Form
                <InfoTooltip
                  text="The name of the GHL form submitted (e.g. a specific lead magnet or internal request form)."
                  placement="below"
                />
              </span>
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <span className="inline-flex items-center justify-end">
                Submissions
                <InfoTooltip
                  text="How many times this form was submitted in the selected date range."
                  align="end"
                  placement="below"
                />
              </span>
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <span className="inline-flex items-center justify-end">
                Became Opportunity
                <InfoTooltip
                  text="Of those submitters, how many have any opportunity at all in '03. Sales Pipeline' -- confirms this is a real lead-gen form, not just an internal/admin one."
                  align="end"
                  placement="below"
                />
              </span>
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <span className="inline-flex items-center justify-end">
                Won
                <InfoTooltip
                  text="Of those submitters, how many are currently in a 'Closed - WON' stage."
                  align="end"
                  placement="below"
                />
              </span>
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <span className="inline-flex items-center justify-end">
                Conversion Rate
                <InfoTooltip text="Won ÷ Submissions for this form." align="end" placement="below" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.formName}>
              <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">
                {row.formName}
              </td>
              <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300">
                {row.submissions}
              </td>
              <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300">
                {row.becameOpportunity}
              </td>
              <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300">{row.won}</td>
              <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300">
                {formatRate(row.conversionRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
