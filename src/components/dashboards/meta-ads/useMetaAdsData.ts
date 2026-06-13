import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { metaAdsApi, type MetaAdsDateRangeValue, type MetaAdsQueryParams, type MetaAdsResponse } from '@/services/metaAdsApi';

/** Owns date-range filter state and fetches Meta Ads dashboard data via React Query. */
export function useMetaAdsData(demoMode: boolean, demoData?: MetaAdsResponse) {
  const [dateRange, setDateRange] = useState<MetaAdsDateRangeValue>('30_days');
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['meta-ads', dateRange, customDateFrom, customDateTo],
    queryFn: () => {
      const params: MetaAdsQueryParams = { date_range: dateRange };
      if (dateRange === 'custom') {
        if (customDateFrom) params.date_from = format(customDateFrom, 'yyyy-MM-dd');
        if (customDateTo) params.date_to = format(customDateTo, 'yyyy-MM-dd');
      }
      return metaAdsApi.fetchMetaData(params);
    },
    enabled: !demoMode,
  });

  return {
    data: demoMode ? demoData : data,
    isLoading: demoMode ? false : isLoading,
    error: demoMode ? null : error,
    dateRange,
    setDateRange,
    customDateFrom,
    customDateTo,
    setCustomDates: (from: Date | null, to: Date | null) => {
      setCustomDateFrom(from);
      setCustomDateTo(to);
    },
  };
}
