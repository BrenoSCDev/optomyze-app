/**
 * DEAL FILTER PARAMS
 *
 * The deal funnel paginates deals per stage, so filtering has to happen in SQL
 * — a client-side pass would only ever see the pages already loaded. This
 * translates the filter dialog's shape into the query string the deal funnel
 * endpoints expect. Mirrors `leadFilters.ts` on the contact side.
 */

/**
 * Every field is a string: these come straight out of the dialog's inputs, and
 * the numeric coercion happens here rather than at apply time so the applied
 * object and the form state never disagree about their types.
 */
export interface DealFilters {
  dealName?: string;
  leadName?: string;
  stageId?: string;
  minValue?: string;
  maxValue?: string;
}

const text = (value?: string) => (value === undefined || value === null ? '' : String(value).trim());

export const dealFiltersToParams = (filters: DealFilters = {}): Record<string, unknown> => {
  const params: Record<string, unknown> = {};

  const name = text(filters.dealName);
  if (name) params.name = name;

  const leadName = text(filters.leadName);
  if (leadName) params.lead_name = leadName;

  const stageId = text(filters.stageId);
  if (stageId) params.stage_id = stageId;

  // 0 is a meaningful floor but the dialog uses '' for "unset", so only a
  // parseable number is forwarded.
  const min = Number(filters.minValue);
  if (text(filters.minValue) !== '' && Number.isFinite(min)) params.value_min = min;

  const max = Number(filters.maxValue);
  if (text(filters.maxValue) !== '' && Number.isFinite(max)) params.value_max = max;

  return params;
};

/** How many filters the user has actually set — drives the toolbar badge. */
export const countActiveDealFilters = (filters: DealFilters = {}): number =>
  Object.keys(dealFiltersToParams(filters)).length;
