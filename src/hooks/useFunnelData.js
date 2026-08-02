import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { funnelService, LEADS_PER_STAGE } from '@/services/funnelApi';
import { getEcho } from '@/services/echo';
import { tagAppliesTo } from '@/components/tags/TagScopeSelector';
import { leadFiltersToParams } from '@/lib/leadFilters';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DEFAULT_SORT = 'newest';

const sameId = (a, b) => String(a) === String(b);

/** Replaces one stage inside the funnel payload, leaving the rest untouched. */
const mapStage = (data, stageId, fn) => {
  if (!data?.funnel?.stages) return data;

  return {
    ...data,
    funnel: {
      ...data.funnel,
      stages: data.funnel.stages.map(stage => (sameId(stage.id, stageId) ? fn(stage) : stage)),
    },
  };
};

/**
 * A stage's lead count and estimated value are server-side totals over every
 * matching lead, not over the page that happens to be loaded, so anything that
 * adds or removes a lead has to nudge them by hand.
 */
const shiftStage = (stage, leadsDelta, valueDelta = 0) => ({
  ...stage,
  leads_total: Math.max(0, (stage.leads_total ?? (stage.active_leads || []).length) + leadsDelta),
  value_estimated: Math.max(0, Number(stage.value_estimated || 0) + valueDelta),
});

/** The lead's own estimated value, used to keep stage totals in step. */
const leadValue = (lead) => Number(lead?.value_estimated || 0);

/** Finds a lead among the pages currently loaded, if it is there at all. */
const findLoadedLead = (data, stageId, leadId) =>
  data?.funnel?.stages
    ?.find(stage => sameId(stage.id, stageId))
    ?.active_leads
    ?.find(lead => sameId(lead.id, leadId));

/**
 * Contact funnel board data.
 *
 * Leads are paginated ten per stage and pulled in as columns are scrolled, so
 * filters are resolved by the API rather than over the loaded cards — a
 * client-side pass would only ever search the pages already fetched.
 */
export const useFunnelData = (funnelId, filters) => {
  const { user } = useAuth();
  const [funnelData, setFunnelData] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Per-stage "loading another page" flags, keyed by stage id.
  const [stageLoading, setStageLoading] = useState({});
  const loadingStagesRef = useRef(new Set());

  // Latest request per stage, so a response that has been overtaken (a sort
  // flip landing before the page load it replaced) is discarded rather than
  // written over the newer one.
  const requestSeqRef = useRef({});

  // Per-stage sort choice. Kept out of funnelData so a full reload doesn't
  // silently reset the columns the user reordered.
  const [stageSorts, setStageSorts] = useState({});
  const stageSortsRef = useRef({});

  const filterParams = useMemo(() => leadFiltersToParams(filters), [filters]);
  const filterParamsRef = useRef(filterParams);
  filterParamsRef.current = filterParams;

  // Serialised so the fetch effect reruns on a real filter change rather than
  // on every render that rebuilds the object.
  const filterKey = JSON.stringify(filterParams);

  const funnelDataRef = useRef(null);
  funnelDataRef.current = funnelData;

  const markStageLoading = (stageId, isLoading) => {
    setStageLoading(prev => ({ ...prev, [String(stageId)]: isLoading }));
  };

  /**
   * Fetches one page of leads for a single stage. `replace` swaps the column's
   * contents (used when its sort changes); otherwise the page is appended.
   *
   * Scroll-driven loads are dropped while one is already in flight — the
   * observer fires repeatedly — but `force` lets a deliberate action (a sort
   * change) through regardless.
   */
  const loadStagePage = useCallback(async (stageId, page, { replace = false, sort, force = false } = {}) => {
    if (!funnelId) return;

    const key = String(stageId);
    if (!force && loadingStagesRef.current.has(key)) return;

    const seq = (requestSeqRef.current[key] || 0) + 1;
    requestSeqRef.current[key] = seq;

    loadingStagesRef.current.add(key);
    markStageLoading(key, true);

    try {
      const response = await funnelService.getStageLeads(funnelId, stageId, {
        ...filterParamsRef.current,
        page,
        per_page: LEADS_PER_STAGE,
        sort: sort ?? stageSortsRef.current[key] ?? DEFAULT_SORT,
      });

      // A newer request for this stage has since been issued; its answer wins.
      if (requestSeqRef.current[key] !== seq) return;

      const incoming = response?.data || [];
      const meta = response?.meta || {};

      setFunnelData(prev => mapStage(prev, stageId, stage => {
        const existing = replace ? [] : (stage.active_leads || []);
        const seen = new Set(existing.map(lead => String(lead.id)));

        return {
          ...stage,
          active_leads: [...existing, ...incoming.filter(lead => !seen.has(String(lead.id)))],
          leads_total: meta.total ?? stage.leads_total,
          leads_current_page: meta.current_page ?? page,
          leads_last_page: meta.last_page ?? stage.leads_last_page,
          leads_has_more: meta.has_more ?? false,
          value_estimated: meta.value_estimated ?? stage.value_estimated,
        };
      }));
    } catch (err) {
      if (requestSeqRef.current[key] !== seq) return;

      console.error('Failed to load stage leads:', err);
      toast.error('Failed to load more leads', {
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

  const fetchFunnelData = useCallback(async (id) => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await funnelService.getFunnelData(id, {
        ...filterParamsRef.current,
        per_page: LEADS_PER_STAGE,
      });

      // Tags arrive embedded in the funnel payload, so they cannot be narrowed
      // with `?scope=` and are filtered here instead.
      const tags = (data?.tags || []).filter(tag => tagAppliesTo(tag, 'lead'));
      setAvailableTags(tags);
      setFunnelData(data);

      // The board request carries a single sort, so any column the user had
      // set to a different order is refetched on its own. Stage ids left over
      // from another funnel are skipped.
      Object.entries(stageSortsRef.current)
        .filter(([stageId, sort]) =>
          sort && sort !== DEFAULT_SORT &&
          data?.funnel?.stages?.some(stage => sameId(stage.id, stageId)))
        .forEach(([stageId, sort]) => loadStagePage(stageId, 1, { replace: true, sort, force: true }));
    } catch (err) {
      console.error('Failed to fetch funnel data:', err);
      setError(err);

      if (err.response?.status === 404) {
        toast.error('Funnel not found', {
          description: 'The requested funnel does not exist or you do not have access to it.'
        });
      } else if (err.response?.status === 401) {
        toast.error('Authentication required', {
          description: 'Please login to access this funnel.'
        });
      } else {
        toast.error('Failed to load funnel data', {
          description: 'There was an error loading the funnel. Please try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [loadStagePage]);

  /** Pulls the next page into a column; a no-op once the column is exhausted. */
  const loadMoreStage = useCallback((stageId) => {
    const stage = funnelDataRef.current?.funnel?.stages?.find(s => sameId(s.id, stageId));
    if (!stage?.leads_has_more) return;

    return loadStagePage(stageId, (stage.leads_current_page || 1) + 1);
  }, [loadStagePage]);

  /** Reorders a single column, which means reloading it from page one. */
  const setStageSort = useCallback((stageId, sort) => {
    const key = String(stageId);
    if ((stageSortsRef.current[key] ?? DEFAULT_SORT) === sort) return;

    stageSortsRef.current = { ...stageSortsRef.current, [key]: sort };
    setStageSorts(stageSortsRef.current);

    return loadStagePage(stageId, 1, { replace: true, sort, force: true });
  }, [loadStagePage]);

  /**
   * Mirrors a stage change that the caller has already persisted — the board
   * and the table both move the lead through the API themselves and then call
   * this to keep the shared payload (and the stage totals) in step.
   */
  const syncLeadStage = useCallback((leadId, newStageId, oldStageId) => {
    setFunnelData(prev => {
      if (!prev?.funnel?.stages) return prev;

      const movedLead = findLoadedLead(prev, oldStageId, leadId);
      const value = leadValue(movedLead);

      return {
        ...prev,
        funnel: {
          ...prev.funnel,
          stages: prev.funnel.stages.map(stage => {
            if (sameId(stage.id, oldStageId)) {
              return shiftStage({
                ...stage,
                active_leads: (stage.active_leads || []).filter(lead => !sameId(lead.id, leadId)),
              }, -1, -value);
            }

            if (sameId(stage.id, newStageId)) {
              return shiftStage({
                ...stage,
                active_leads: movedLead
                  ? [{ ...movedLead, stage_id: newStageId }, ...(stage.active_leads || [])]
                  : (stage.active_leads || []),
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
    fetchFunnelData(funnelId);
  }, [funnelId, filterKey, fetchFunnelData]);

  // Live lead updates via company channel (guaranteed to work — same channel notifications use).
  // Filters by funnel_id so only events for this funnel are applied.
  // Visibility rules mirror the backend visibleToUser scope:
  //   admin   → sees all leads
  //   manager → sees all (team boundary not available client-side; initial load already filtered)
  //   agent   → only sees leads assigned to themselves
  useEffect(() => {
    if (!funnelId || !user?.id || !user?.company_id) return;
    const echo = getEcho();
    if (!echo) return;

    const channelName = `company.${user.company_id}`;
    console.log(`[FunnelData] Subscribing to channel: ${channelName} for funnel ${funnelId}`);
    const channel = echo.private(channelName);

    channel.listen('.lead.live', (payload) => {
      console.log('[FunnelData] Received lead.live:', payload);

      // Only process events belonging to this funnel
      const payloadFunnelId = payload.lead?.funnel_id ?? payload.funnel_id;
      if (String(payloadFunnelId) !== String(funnelId)) return;

      setFunnelData(prev => {
        if (!prev?.funnel?.stages) return prev;

        if (payload.action === 'created') {
          const lead = payload.lead;

          // Apply visibility rules for the created event
          const role = user.role;
          if (role === 'agent' && lead.assigned_to !== user.id) return prev;

          const alreadyExists = prev.funnel.stages.some(
            s => s.active_leads?.some(l => sameId(l.id, lead.id))
          );
          if (alreadyExists) return prev;

          return {
            ...prev,
            funnel: {
              ...prev.funnel,
              stages: prev.funnel.stages.map(stage =>
                sameId(stage.id, lead.stage_id)
                  ? shiftStage(
                      { ...stage, active_leads: [lead, ...(stage.active_leads || [])] },
                      1,
                      leadValue(lead)
                    )
                  : stage
              ),
            },
          };
        }

        if (payload.action === 'stage_changed') {
          const { lead_id, old_stage_id, new_stage_id, new_stage_type } = payload;

          const movedLead = findLoadedLead(prev, old_stage_id, lead_id);
          const value = leadValue(movedLead);

          return {
            ...prev,
            funnel: {
              ...prev.funnel,
              stages: prev.funnel.stages.map(stage => {
                if (sameId(stage.id, old_stage_id)) {
                  return shiftStage({
                    ...stage,
                    active_leads: (stage.active_leads || []).filter(l => !sameId(l.id, lead_id)),
                  }, -1, -value);
                }

                if (
                  sameId(stage.id, new_stage_id) &&
                  new_stage_type !== 'lost' &&
                  new_stage_type !== 'won'
                ) {
                  return shiftStage({
                    ...stage,
                    active_leads: movedLead
                      ? [{ ...movedLead, stage_id: new_stage_id }, ...(stage.active_leads || [])]
                      : (stage.active_leads || []),
                  }, 1, value);
                }

                return stage;
              }),
            },
          };
        }

        if (payload.action === 'deleted') {
          const { lead_id, stage_id } = payload;
          const value = leadValue(findLoadedLead(prev, stage_id, lead_id));

          return mapStage(prev, stage_id, stage => shiftStage({
            ...stage,
            active_leads: (stage.active_leads || []).filter(l => !sameId(l.id, lead_id)),
          }, -1, -value));
        }

        return prev;
      });
    });

    return () => {
      console.log(`[FunnelData] Stopping lead.live listener on: ${channelName}`);
      channel.stopListening('.lead.live');
    };
  }, [funnelId, user?.id, user?.company_id, user?.role]);

  return {
    funnelData,
    availableTags,
    loading,
    error,
    refetch: () => fetchFunnelData(funnelId),
    syncLeadStage,
    loadMoreStage,
    setStageSort,
    stageSorts,
    stageLoading,
  };
};
