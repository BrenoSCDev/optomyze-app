/**
 * LEAD FILTER PARAMS
 *
 * The contact funnel paginates leads per stage, so filtering has to happen in
 * SQL — a client-side pass would only ever see the pages already loaded. This
 * translates the filter dialog's shape into the query string the funnel
 * endpoints expect.
 */

export interface LeadFilters {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  ddi?: string;
  sourcePlatform?: string;
  stageId?: string;
  assignedTo?: string;
  tags?: string[];
  scoreRange?: [number, number];
  valueRange?: [number, number];
}

/** Defaults the dialog treats as "no filter" — never sent to the server. */
const SCORE_BOUNDS: [number, number] = [0, 100];
const VALUE_BOUNDS: [number, number] = [0, 10000];

const text = (value?: string) => (typeof value === 'string' ? value.trim() : '');

export const leadFiltersToParams = (filters: LeadFilters = {}): Record<string, unknown> => {
  const params: Record<string, unknown> = {};

  const map: Array<[keyof LeadFilters, string]> = [
    ['firstName', 'first_name'],
    ['lastName', 'last_name'],
    ['email', 'email'],
    ['phone', 'phone'],
    ['ddi', 'ddi'],
    ['sourcePlatform', 'source_platform'],
    ['stageId', 'stage_id'],
    ['assignedTo', 'assigned_to'],
  ];

  map.forEach(([key, param]) => {
    const value = text(filters[key] as string | undefined);
    if (value) params[param] = value;
  });

  if (filters.tags?.length) {
    params.tags = filters.tags;
  }

  const [scoreMin, scoreMax] = filters.scoreRange || SCORE_BOUNDS;
  if (scoreMin > SCORE_BOUNDS[0]) params.score_min = scoreMin;
  if (scoreMax < SCORE_BOUNDS[1]) params.score_max = scoreMax;

  const [valueMin, valueMax] = filters.valueRange || VALUE_BOUNDS;
  if (valueMin > VALUE_BOUNDS[0]) params.value_min = valueMin;
  if (valueMax < VALUE_BOUNDS[1]) params.value_max = valueMax;

  return params;
};

/**
 * How many filters the user has actually set — drives the toolbar badge. A
 * range sends two params but reads as one filter.
 */
export const countActiveFilters = (filters: LeadFilters = {}): number => {
  const params = leadFiltersToParams(filters);
  let count = Object.keys(params).length;

  if ('score_min' in params && 'score_max' in params) count -= 1;
  if ('value_min' in params && 'value_max' in params) count -= 1;

  return count;
};
