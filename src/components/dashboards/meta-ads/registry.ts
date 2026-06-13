import type { MetaAdsDateRangeValue } from '@/services/metaAdsApi';

export interface MetaAdsDateRangeOption {
  value: MetaAdsDateRangeValue;
  labelKey: string;
}

/** Options for the date-range filter, in display order. */
export const META_ADS_DATE_RANGE_OPTIONS: MetaAdsDateRangeOption[] = [
  { value: 'today', labelKey: 'meta.filter.range.today' },
  { value: 'yesterday', labelKey: 'meta.filter.range.yesterday' },
  { value: '7_days', labelKey: 'meta.filter.range.7-days' },
  { value: '30_days', labelKey: 'meta.filter.range.30-days' },
  { value: 'this_month', labelKey: 'meta.filter.range.this-month' },
  { value: 'last_month', labelKey: 'meta.filter.range.last-month' },
  { value: 'custom', labelKey: 'meta.filter.range.custom' },
];
