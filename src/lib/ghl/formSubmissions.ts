import { ghlFetch, ghlLocationId } from "./client";
import { hashContactId } from "../privacy/hashContact";

/**
 * A form submission with every customer-identifying field stripped. GHL's
 * raw submission record embeds the contact's full name, email, phone, IP
 * address, and every free-text answer they typed -- none of that is kept
 * here, only the channel/page/timing context needed for the Journey view.
 */
export interface SafeFormSubmission {
  contactRef: string;
  /** Human-readable form name (e.g. "New | Systems Blueprint | 2025 | PDF File") -- falls back to the opaque formId if GHL didn't record one. */
  formName: string;
  source?: string;
  medium?: string;
  pageUrl?: string;
  submittedAt: string;
}

// The tracking/attribution context actually lives nested under `others.eventData`
// (confirmed via live testing -- GHL's docs suggest a top-level `eventData`,
// which does not exist on real records). Facebook Lead Ads submissions all
// share one synthetic formId (`fb-{locationId}`) and carry no eventData at
// all -- their real per-ad-form identity is `others.facebookFormId`/`facebookFormName` instead.
interface RawSubmission {
  id: string;
  contactId: string;
  formId: string;
  createdAt: string;
  others?: {
    facebookFormId?: string;
    facebookFormName?: string;
    eventData?: {
      source?: string;
      medium?: string;
      parentName?: string;
      page?: { url?: string };
    };
  };
}

interface SubmissionsResponse {
  submissions: RawSubmission[];
  meta: {
    total: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
  };
}

interface RawForm {
  id: string;
  name: string;
}

const PAGE_LIMIT = 100;
// Same reasoning as MAX_PAGES in opportunities.ts -- fine while volume is
// low (254 total submissions location-wide as of writing), revisit if this
// grows into the tens of thousands.
const MAX_PAGES = 100;
const FORMS_LIST_LIMIT = 100;
const FORMS_LIST_MAX_PAGES = 20;

/**
 * Maps GHL native formId -> the human name set in the form builder. Needed
 * because most submission records leave `eventData.parentName` blank; only
 * a fallback source of truth, not PII (form names, not submitter data).
 */
async function fetchFormNameMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let page = 0; page < FORMS_LIST_MAX_PAGES; page++) {
    const skip = page * FORMS_LIST_LIMIT;
    const response = await ghlFetch<{ forms: RawForm[]; total: number }>("/forms/", {
      locationId: ghlLocationId(),
      limit: FORMS_LIST_LIMIT,
      skip,
    });
    for (const form of response.forms) {
      map.set(form.id, form.name);
    }
    if (response.forms.length < FORMS_LIST_LIMIT || skip + response.forms.length >= response.total) {
      break;
    }
  }
  return map;
}

function resolveFormName(raw: RawSubmission, formNameMap: Map<string, string>): string {
  const facebookFormName = raw.others?.facebookFormName;
  if (raw.others?.facebookFormId && facebookFormName) return facebookFormName;

  const parentName = raw.others?.eventData?.parentName;
  if (parentName) return parentName;

  return formNameMap.get(raw.formId) || raw.formId;
}

function sanitize(raw: RawSubmission, formNameMap: Map<string, string>): SafeFormSubmission {
  const eventData = raw.others?.eventData;
  return {
    contactRef: hashContactId(raw.contactId),
    formName: resolveFormName(raw, formNameMap),
    source: eventData?.source,
    medium: eventData?.medium,
    pageUrl: eventData?.page?.url,
    submittedAt: raw.createdAt,
  };
}

/**
 * All form submissions location-wide, sanitized. GHL's /forms/submissions
 * endpoint doesn't support filtering by contact (confirmed: passing
 * contactId returns a 422), so this always does a full scan -- matching
 * this to specific contacts/opportunities happens after the fact, by
 * comparing contactRef (both sides already hashed the same way, so the
 * join never needs the raw contactId).
 */
export async function fetchAllFormSubmissions(): Promise<SafeFormSubmission[]> {
  const formNameMap = await fetchFormNameMap();
  const results: SafeFormSubmission[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await ghlFetch<SubmissionsResponse>("/forms/submissions", {
      locationId: ghlLocationId(),
      limit: PAGE_LIMIT,
      page,
    });

    for (const raw of response.submissions) {
      results.push(sanitize(raw, formNameMap));
    }

    if (!response.meta.nextPage || response.submissions.length < PAGE_LIMIT) break;
  }

  return results;
}
