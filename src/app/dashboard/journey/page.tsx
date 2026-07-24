import { Suspense } from "react";
import { getCachedStages, getCachedOpportunities } from "@/lib/dashboardData";
import { withinRange } from "@/lib/ghl/opportunities";
import {
  computeSourceAttribution,
  computeLandingPageAttribution,
} from "@/lib/attribution/computeAttribution";
import { resolveDateRange } from "@/lib/dateRanges";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { SourceBreakdownTable } from "@/components/dashboard/SourceBreakdownTable";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";

export default async function JourneyPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string; refresh?: string }>;
}) {
  const params = await searchParams;
  const range = resolveDateRange(params);
  const bypassCache = Boolean(params.refresh);

  const [stages, allOpportunities] = await Promise.all([
    getCachedStages(bypassCache),
    getCachedOpportunities(bypassCache),
  ]);

  const inRange = allOpportunities.filter((o) => withinRange(o, range.from, range.to));
  const firstTouch = computeSourceAttribution(inRange, stages, "first");
  const lastTouch = computeSourceAttribution(inRange, stages, "last");
  const landingPages = computeLandingPageAttribution(inRange, stages);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
      <div>
        <h1 className="font-heading text-xl font-medium text-brand-eggplant dark:text-zinc-50">
          Customer Journey
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Aggregate only — no individual customer is ever shown here, just which channels and
          pages bring bookings in and which ones convert. Built from GHL&apos;s built-in
          first/last-touch attribution, not an individual-level path history.
        </p>
      </div>

      <Suspense>
        <DateRangeFilter />
      </Suspense>

      <div>
        <h2 className="mb-2 flex items-center font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
          By landing page — which specific offer or lead magnet drove the booking
          <InfoTooltip text="The path of the page a contact first landed on before ever booking (e.g. a specific lead magnet or webinar page), not just the broad channel. Sourced from GHL's own first-touch tracking." />
        </h2>
        <SourceBreakdownTable
          rows={landingPages}
          columnLabel="Page"
          columnInfo="The URL path of the first page GHL recorded for this contact — identifies the specific offer/lead magnet, not just the channel."
        />
      </div>

      <div>
        <h2 className="mb-2 flex items-center font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
          By first-touch source — where bookings originally came from
          <InfoTooltip text="The channel/campaign a contact was attributed to the very first time they showed up in GHL, before ever booking. Sourced from GHL's own UTM/session tracking." />
        </h2>
        <SourceBreakdownTable rows={firstTouch} />
      </div>

      <div>
        <h2 className="mb-2 flex items-center font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
          By last-touch source — what drove the actual booking
          <InfoTooltip text="The channel/campaign active at the moment the contact actually booked, which may differ from their first-touch source if they returned through a different channel." />
        </h2>
        <SourceBreakdownTable rows={lastTouch} />
      </div>
    </div>
  );
}
