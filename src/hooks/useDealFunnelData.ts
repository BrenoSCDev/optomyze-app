/**
 * DEAL FUNNEL DATA HOOK
 *
 * Fetches and manages deal funnel data independently from contact funnels.
 *
 * Deals are paginated ten per stage and pulled in as columns are scrolled, so
 * filters are resolved by the API rather than over the loaded cards — a
 * client-side pass would only ever search the pages already fetched. Mirrors
 * useFunnelData on the contact side.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { dealFunnelService, DEALS_PER_STAGE } from '@/services/dealFunnelApi';
import { getEcho } from '@/services/echo';
import { tagAppliesTo } from '@/components/tags/TagScopeSelector';
import { DealFilters, dealFiltersToParams } from '@/lib/dealFilters';
import { StageSort } from '@/types/leads';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DEFAULT_SORT: StageSort = 'newest';

const sameId = (a: unknown, b: unknown) => String(a) === String(b);

/** Replaces one stage inside the funnel payload, leaving the rest untouched. */
const mapStage = (data: any, stageId: unknown, fn: (stage: any) => any) => {
  if (!data?.funnel?.stages) return data;

  return {
    ...data,
    funnel: {
      ...data.funnel,
      stages: data.funnel.stages.map((stage: any) => (sameId(stage.id, stageId) ? fn(stage) : stage)),
    },
  };
};

/**
 * A stage's deal count and value are server-side totals over every matching
 * deal, not over the page that happens to be loaded, so anything that adds or
 * removes a deal has to nudge them by hand.
 */
const shiftStage = (stage: any, dealsDelta: number, valueDelta = 0) => ({
  ...stage,
  deals_total: Math.max(0, (stage.deals_total ?? (stage.deals || []).length) + dealsDelta),
  deals_value_total: Math.max(0, Number(stage.deals_value_total || 0) + valueDelta),
});

const dealValue = (deal: any) => Number(deal?.final_total || 0);

/** Finds a deal among the pages currently loaded, if it is there at all. */
const findLoadedDeal = (data: any, stageId: unknown, dealId: unknown) =>
  data?.funnel?.stages
    ?.find((stage: any) => sameId(stage.id, stageId))
    ?.deals
    ?.find((deal: any) => sameId(deal.id, dealId));

export const useDealFunnelData = (funnelId: string | undefined, filters?: DealFilters) => {
  const { user } = useAuth() as { user: { id: number; company_id: number; role?: string } | null };
  const [funnelData, setFunnelData] = useState<any>(null);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Per-stage "loading another page" flags, keyed by stage id.
  const [stageLoading, setStageLoading] = useState<Record<string, boolean>>({});
  const loadingStagesRef = useRef<Set<string>>(new Set());

  // Latest request per stage, so a response that has been overtaken (a sort
  // flip landing before the page load it replaced) is discarded.
  const requestSeqRef = useRef<Record<string, number>>({});

  // Per-stage sort choice. Kept out of funnelData so a full reload doesn't
  // silently reset the columns the user reordered.
  const [stageSorts, setStageSorts] = useState<Record<string, StageSort>>({});
  const stageSortsRef = useRef<Record<string, StageSort>>({});

  const filterParams = useMemo(() => dealFiltersToParams(filters), [filters]);
  const filterParamsRef = useRef(filterParams);
  filterParamsRef.current = filterParams;

  // Serialised so the fetch effect reruns on a real filter change rather than
  // on every render that rebuilds the object.
  const filterKey = JSON.stringify(filterParams);

  const funnelDataRef = useRef<any>(null);
  funnelDataRef.current = funnelData;

  const markStageLoading = (stageId: string, isLoading: boolean) => {
    setStageLoading(prev => ({ ...prev, [stageId]: isLoading }));
  };

  /**
   * Fetches one page of deals for a single stage. `replace` swaps the column's
   * contents (used when its sort changes); otherwise the page is appended.
   *
   * Scroll-driven loads are dropped while one is already in flight — the
   * observer fires repeatedly — but `force` lets a deliberate action (a sort
   * change) through regardless.
   */
  const loadStagePage = useCallback(async (
    stageId: string | number,
    page: number,
    { replace = false, sort, force = false }: { replace?: boolean; sort?: StageSort; force?: boolean } = {}
  ) => {
    if (!funnelId) return;

    const key = String(stageId);
    if (!force && loadingStagesRef.current.has(key)) return;

    const seq = (requestSeqRef.current[key] || 0) + 1;
    requestSeqRef.current[key] = seq;

    loadingStagesRef.current.add(key);
    markStageLoading(key, true);

    try {
      const response = await dealFunnelService.getStageDeals(funnelId, stageId, {
        ...filterParamsRef.current,
        page,
        per_page: DEALS_PER_STAGE,
        sort: sort ?? stageSortsRef.current[key] ?? DEFAULT_SORT,
      });

      // A newer request for this stage has since been issued; its answer wins.
      if (requestSeqRef.current[key] !== seq) return;

      const incoming = response?.data || [];
      const meta = response?.meta || {};

      setFunnelData((prev: any) => mapStage(prev, stageId, (stage: any) => {
        const existing = replace ? [] : (stage.deals || []);
        const seen = new Set(existing.map((deal: any) => String(deal.id)));

        return {
          ...stage,
          deals: [...existing, ...incoming.filter((deal: any) => !seen.has(String(deal.id)))],
          deals_total: meta.total ?? stage.deals_total,
          deals_current_page: meta.current_page ?? page,
          deals_last_page: meta.last_page ?? stage.deals_last_page,
          deals_has_more: meta.has_more ?? false,
          deals_value_total: meta.value_total ?? stage.deals_value_total,
        };
      }));
    } catch (err) {
      if (requestSeqRef.current[key] !== seq) return;

      console.error('Failed to load stage deals:', err);
      toast.error('Failed to load more deals', {
        description: 'There was an error loading this stage. Please try again.',
      });
    } finally {
      // Only the most recent request clears the flag; an overtaken one leaving
      // early would signal "done" while the newer fetch is still running.
      if (requestSeqRef.current[key] === seq) {
        loadingStagesRef.current.delete(key);
        markStageLoading(key, false);
      }
    }
  }, [funnelId]);

  const fetchData = useCallback(async () => {
    if (!funnelId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await dealFunnelService.getDealFunnelData(funnelId, {
        ...filterParamsRef.current,
        per_page: DEALS_PER_STAGE,
      });

      setFunnelData(data);
      // Embedded in the funnel payload, so filtered here rather than via ?scope=.
      setAvailableTags((data?.tags || []).filter((tag: any) => tagAppliesTo(tag, 'deal')));

      // The board request carries a single sort, so any column the user had
      // set to a different order is refetched on its own. Stage ids left over
      // from another funnel are skipped.
      Object.entries(stageSortsRef.current)
        .filter(([stageId, sort]) =>
          sort && sort !== DEFAULT_SORT &&
          data?.funnel?.stages?.some((stage: any) => sameId(stage.id, stageId)))
        .forEach(([stageId, sort]) => loadStagePage(stageId, 1, { replace: true, sort, force: true }));
    } catch (err: any) {
      console.error('Failed to fetch deal funnel data:', err);
      setError(err);

      if (err.response?.status === 404) {
        toast.error('Deal funnel not found', {
          description: 'The requested deal funnel does not exist or you do not have access.'
        });
      } else if (err.response?.status === 401) {
        toast.error('Authentication required');
      } else {
        toast.error('Failed to load deal funnel data');
      }
    } finally {
      setLoading(false);
    }
  }, [funnelId, loadStagePage]);

  /** Pulls the next page into a column; a no-op once the column is exhausted. */
  const loadMoreStage = useCallback((stageId: string) => {
    const stage = funnelDataRef.current?.funnel?.stages?.find((s: any) => sameId(s.id, stageId));
    if (!stage?.deals_has_more) return;

    return loadStagePage(stageId, (stage.deals_current_page || 1) + 1);
  }, [loadStagePage]);

  /** Reorders a single column, which means reloading it from page one. */
  const setStageSort = useCallback((stageId: string, sort: StageSort) => {
    const key = String(stageId);
    if ((stageSortsRef.current[key] ?? DEFAULT_SORT) === sort) return;

    stageSortsRef.current = { ...stageSortsRef.current, [key]: sort };
    setStageSorts(stageSortsRef.current);

    return loadStagePage(stageId, 1, { replace: true, sort, force: true });
  }, [loadStagePage]);

  /**
   * Mirrors a stage change the board has already persisted, keeping the shared
   * payload — and the stage counts and values — in step.
   */
  const syncDealStage = useCallback((dealId: string, newStageId: string, oldStageId: string) => {
    setFunnelData((prev: any) => {
      if (!prev?.funnel?.stages) return prev;

      const movedDeal = findLoadedDeal(prev, oldStageId, dealId);
      const value = dealValue(movedDeal);

      return {
        ...prev,
        funnel: {
          ...prev.funnel,
          stages: prev.funnel.stages.map((stage: any) => {
            if (sameId(stage.id, oldStageId)) {
              return shiftStage({
                ...stage,
                deals: (stage.deals || []).filter((deal: any) => !sameId(deal.id, dealId)),
              }, -1, -value);
            }

            if (sameId(stage.id, newStageId)) {
              return shiftStage({
                ...stage,
                deals: movedDeal
                  ? [{ ...movedDeal, stage_id: newStageId }, ...(stage.deals || [])]
                  : (stage.deals || []),
              }, 1, value);
            }

            return stage;
          }),
        },
      };
    });
  }, []);

  // filterKey stands in for filterParams (read through a ref): a new filter set
  // means a new board.
  useEffect(() => {
    fetchData();
  }, [fetchData, filterKey]);

  // Live deal updates via company channel (guaranteed to work).
  // Filters by funnel_id so only events for this funnel are applied.
  useEffect(() => {
    if (!funnelId || !user?.id || !user?.company_id) return;
    const echo = getEcho();
    if (!echo) return;

    const channelName = `company.${user.company_id}`;
    console.log(`[DealFunnelData] Subscribing to channel: ${channelName} for funnel ${funnelId}`);

    const channel = echo.private(channelName);

    channel.listen('.deal.live', (payload: any) => {
      console.log('[DealFunnelData] Received deal.live:', payload);

      // Only process events belonging to this funnel
      const payloadFunnelId = payload.deal?.funnel_id ?? payload.funnel_id;
      if (String(payloadFunnelId) !== String(funnelId)) return;

      setFunnelData((prev: any) => {
        if (!prev?.funnel?.stages) return prev;

        if (payload.action === 'created') {
          const deal = payload.deal;

          // Visibility: agents only see deals for leads assigned to themselves
          if (user.role === 'agent' && deal.lead?.assigned_to !== user.id) return prev;

          const alreadyExists = prev.funnel.stages.some(
            (s: any) => s.deals?.some((d: any) => sameId(d.id, deal.id))
          );
          if (alreadyExists) return prev;

          return {
            ...prev,
            funnel: {
              ...prev.funnel,
              stages: prev.funnel.stages.map((stage: any) =>
                sameId(stage.id, deal.stage_id)
                  ? shiftStage({ ...stage, deals: [deal, ...(stage.deals || [])] }, 1, dealValue(deal))
                  : stage
              ),
            },
          };
        }

        if (payload.action === 'stage_changed') {
          const { deal_id, old_stage_id, new_stage_id, new_stage_type } = payload;

          const movedDeal = findLoadedDeal(prev, old_stage_id, deal_id);
          const value = dealValue(movedDeal);

          return {
            ...prev,
            funnel: {
              ...prev.funnel,
              stages: prev.funnel.stages.map((stage: any) => {
                if (sameId(stage.id, old_stage_id)) {
                  return shiftStage({
                    ...stage,
                    deals: (stage.deals || []).filter((d: any) => !sameId(d.id, deal_id)),
                  }, -1, -value);
                }

                if (
                  sameId(stage.id, new_stage_id) &&
                  new_stage_type !== 'lost' &&
                  new_stage_type !== 'won'
                ) {
                  return shiftStage({
                    ...stage,
                    deals: movedDeal
                      ? [{ ...movedDeal, stage_id: new_stage_id }, ...(stage.deals || [])]
                      : (stage.deals || []),
                  }, 1, value);
                }

                return stage;
              }),
            },
          };
        }

        if (payload.action === 'deleted') {
          const { deal_id, stage_id } = payload;
          const value = dealValue(findLoadedDeal(prev, stage_id, deal_id));

          return mapStage(prev, stage_id, (stage: any) => shiftStage({
            ...stage,
            deals: (stage.deals || []).filter((d: any) => !sameId(d.id, deal_id)),
          }, -1, -value));
        }

        return prev;
      });
    });

    return () => {
      console.log(`[DealFunnelData] Stopping deal.live listener on: ${channelName}`);
      channel.stopListening('.deal.live');
    };
  }, [funnelId, user?.id, user?.company_id, user?.role]);

  return {
    funnelData,
    availableTags,
    loading,
    error,
    refetch: fetchData,
    syncDealStage,
    loadMoreStage,
    setStageSort,
    stageSorts,
    stageLoading,
  };
};
