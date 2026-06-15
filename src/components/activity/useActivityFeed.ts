import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { recordsApi, type RecordItem } from '@/services/recordsApi';
import { onLeadTransaction, onDealTransaction } from '@/contexts/NotificationContext';
import { resolveActivityRegistryEntry } from './registry';
import {
  adaptRecord,
  adaptLeadTransactionPayload,
  adaptDealTransactionPayload,
} from './types';
import type {
  ActivityDateRangeValue,
  ActivityDomain,
  ActivityEvent,
  ActivityFeedDomain,
  ActivityFilterValue,
  ActivityMeta,
  ActivityQueryParams,
} from './types';

export function useActivityFeed(domain: ActivityFeedDomain) {
  const [group, setGroup] = useState<ActivityFilterValue>('all');
  const [dateRange, setDateRange] = useState<ActivityDateRangeValue>('today');
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: [`${domain}-activity`, dateRange, customDateFrom, customDateTo],
    queryFn: () => {
      const params: ActivityQueryParams = { date_range: dateRange };
      if (dateRange === 'custom') {
        if (customDateFrom) params.date_from = format(customDateFrom, 'yyyy-MM-dd');
        if (customDateTo) params.date_to = format(customDateTo, 'yyyy-MM-dd');
      }
      if (domain === 'lead') return recordsApi.fetchLeadActivity(params);
      if (domain === 'deal') return recordsApi.fetchDealActivity(params);
      return recordsApi.fetchAllActivity(params);
    },
  });

  const adapted = useMemo<ActivityEvent[]>(() => {
    if (!data) return [];
    return (data.transactions as RecordItem[]).map((record) => {
      const recordDomain: ActivityDomain =
        domain === 'all' ? (record.recordable_type === 'Lead' ? 'lead' : 'deal') : domain;
      return adaptRecord(record, recordDomain);
    });
  }, [data, domain]);

  // Real-time prepend — only while viewing "Today", and only until the next refetch.
  const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    setLiveEvents([]);
  }, [data]);

  useEffect(() => {
    if (dateRange !== 'today') return;

    const unsubscribers: Array<() => void> = [];

    if (domain === 'lead' || domain === 'all') {
      unsubscribers.push(onLeadTransaction((payload) => {
        const event = adaptLeadTransactionPayload(payload);
        setLiveEvents((prev) => (prev.some((e) => e.id === event.id) ? prev : [event, ...prev]));
      }));
    }

    if (domain === 'deal' || domain === 'all') {
      unsubscribers.push(onDealTransaction((payload) => {
        const event = adaptDealTransactionPayload(payload);
        setLiveEvents((prev) => (prev.some((e) => e.id === event.id) ? prev : [event, ...prev]));
      }));
    }

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [domain, dateRange]);

  const merged = useMemo(() => {
    const seen = new Set(adapted.map((e) => e.id));
    return [...liveEvents.filter((e) => !seen.has(e.id)), ...adapted];
  }, [adapted, liveEvents]);

  const events = useMemo(
    () => (group === 'all' ? merged : merged.filter((e) => resolveActivityRegistryEntry(e).group === group)),
    [merged, group]
  );

  return {
    events,
    loading: isLoading,
    error,
    group,
    setGroup,
    dateRange,
    setDateRange,
    customDateFrom,
    customDateTo,
    setCustomDates: (from: Date | null, to: Date | null) => {
      setCustomDateFrom(from);
      setCustomDateTo(to);
    },
    meta: (data?.meta ?? null) as ActivityMeta | null,
  };
}
