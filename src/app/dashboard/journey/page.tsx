import { Suspense } from "react";
import { getCachedStages, getCachedOpportunities, getCachedFormSubmissions } from "@/lib/dashboardData";
import { withinRange } from "@/lib/ghl/opportunities";
import {
  computeSourceAttribution,
  computeLandingPageAttribution,
} from "@/lib/attribution/computeAttribution";
import { computeFormSubmissionAttribution } from "@/lib/attribution/computeFormSubmissions";
import { resolveDateRange } from "@/lib/dateRanges";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { SourceBreakdownTable } from "@/components/dashboard/SourceBreakdownTable";
import { FormSubmissionTable } from "@/components/dashboard/FormSubmissionTable";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";

export default async function JourneyPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string; refresh?: string }>;
}) {
  const params = await searchParams;
  const range = resolveDateRange(params);
  const bypassCache = Boolean(params.refresh);

  const [stages, allOpportunities, allFormSubmissions] = await Promise.all([
    getCachedStages(bypassCache),
    getCachedOpportunities(bypassCache),
    getCachedFormSubmissions(bypassCache),
  ]);

  const inRange = allOpportunities.filter((o) => withinRange(o, range.from, range.to));
  const firstTouch = computeSourceAttribution(inRange, stages, "first");
  const lastTouch = computeSourceAttribution(inRange, stages, "last");
  const landingPages = computeLandingPageAttribution(inRange, stages);

  const submissionsInRange = allFormSubmissions.filter((s) => {
    const submittedAt = new Date(s.submittedAt).getTime();
    return submittedAt >= range.from.getTime() && submittedAt <= range.to.getTime();
  });
  // Joined against the FULL opportunity history, not just inRange -- a form
  // submitted in this window may only convert to a booking/win later, and
  // we still want to credit that when it happens.
  const formSubmissions = computeFormSubmissionAttribution(
    submissionsInRange,
    allOpportunities,
    stages,
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
      <div>
        <h1 className="font-heading text-xl font-medium text-brand-eggplant dark:text-zinc-50">
          Customer Journey
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Aggregate only — no individual customer is ever shown here, just which channels, pages,
          and forms bring bookings in and which ones convert. Built from GHL&apos;s own
          attribution and form-submission data, not an individual-level path history.
        </p>
      </div>

      <Suspense>
        <DateRangeFilter />
      </Suspense>

      <div>
        <h2 className="mb-2 flex items-center font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
          By form submitted — which specific form drives real pipeline activity
          <InfoTooltip text="Every GHL form submission in this range, joined to whether that same (de-identified) contact ever became a pipeline opportunity or won. Low 'Became Opportunity' numbers usually mean an internal/admin form rather than a lead-gen one." />
        </h2>
        <FormSubmissionTable rows={formSubmissions} />
      </div>

      <div>
        <h2 className="mb-2 flex items-center font-heading text-sm font-medium text-zinc-500 dark:text-zinc-400">
          By landing page — which specific offer or lead magnet drove the booking
          <InfoTooltip text="The path of the page a contact first landed on before ever booking (e.g. a specific lead magnet or webinar page), not just the broad channel. Sourced from GHL's own first-touch tracking." />
        </h2>
        <SourceBreakdownTable
          rows={landingPages}
          columnLabel="Page"
          columnInfo="The URL path of the first page GHL recorded for this contact — identifies the specific offer/lead magnet, not just the channel."
          nounLabel="page"
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
