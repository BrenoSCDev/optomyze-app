import { useState, useEffect, useCallback } from 'react';
import { funnelService } from '@/services/funnelApi';
import { getEcho } from '@/services/echo';
import { tagAppliesTo } from '@/components/tags/TagScopeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useFunnelData = (funnelId) => {
  const { user } = useAuth();
  const [funnelData, setFunnelData] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFunnelData = useCallback(async (id) => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await funnelService.getFunnelData(id);

      // Tags arrive embedded in the funnel payload, so they cannot be narrowed
      // with `?scope=` and are filtered here instead.
      const tags = (data?.tags || []).filter(tag => tagAppliesTo(tag, 'lead'));
      setAvailableTags(tags);
      setFunnelData(data);
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
  }, []);

  const updateLeadStage = async (leadId, newStageId, oldStageId) => {
    try {
      // Optimistic update
      setFunnelData(prevData => {
        if (!prevData?.funnel?.stages) return prevData;

        const newData = { ...prevData };
        newData.funnel.stages = newData.funnel.stages.map(stage => {
          const newStage = { ...stage };

          if (stage.id === oldStageId) {
            newStage.active_leads = stage.active_leads.filter(lead => lead.id !== leadId);
          }

          if (stage.id === newStageId) {
            const leadToMove = prevData.funnel.stages
              .find(s => s.id === oldStageId)
              ?.active_leads
              .find(l => l.id === leadId);

            if (leadToMove) {
              newStage.active_leads = [...stage.active_leads, leadToMove];
            }
          }

          return newStage;
        });

        return newData;
      });

      await funnelService.updateLeadStage(leadId, newStageId);
      toast.success('Lead moved successfully');
    } catch (err) {
      console.error('Failed to update lead stage:', err);
      await fetchFunnelData(funnelId);
      toast.error('Failed to move lead', {
        description: 'There was an error moving the lead. Please try again.'
      });
    }
  };

  useEffect(() => {
    fetchFunnelData(funnelId);
  }, [funnelId, fetchFunnelData]);

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

          const leadStageId = Number(lead.stage_id);
          const alreadyExists = prev.funnel.stages.some(
            s => s.active_leads?.some(l => l.id === lead.id)
          );
          if (alreadyExists) return prev;

          return {
            ...prev,
            funnel: {
              ...prev.funnel,
              stages: prev.funnel.stages.map(stage =>
                Number(stage.id) === leadStageId
                  ? { ...stage, active_leads: [lead, ...(stage.active_leads || [])] }
                  : stage
              ),
            },
          };
        }

        if (payload.action === 'stage_changed') {
          const lead_id = Number(payload.lead_id);
          const old_stage_id = Number(payload.old_stage_id);
          const new_stage_id = Number(payload.new_stage_id);
          const { new_stage_type } = payload;

          return {
            ...prev,
            funnel: {
              ...prev.funnel,
              stages: prev.funnel.stages.map(stage => {
                const stageId = Number(stage.id);
                if (stageId === old_stage_id) {
                  return {
                    ...stage,
                    active_leads: (stage.active_leads || []).filter(l => l.id !== lead_id),
                  };
                }
                if (
                  stageId === new_stage_id &&
                  new_stage_type !== 'lost' &&
                  new_stage_type !== 'won'
                ) {
                  const movedLead = prev.funnel.stages
                    .find(s => Number(s.id) === old_stage_id)
                    ?.active_leads?.find(l => l.id === lead_id);

                  if (movedLead) {
                    return {
                      ...stage,
                      active_leads: [
                        { ...movedLead, stage_id: new_stage_id },
                        ...(stage.active_leads || []),
                      ],
                    };
                  }
                }
                return stage;
              }),
            },
          };
        }

        if (payload.action === 'deleted') {
          const lead_id = Number(payload.lead_id);
          const stage_id = Number(payload.stage_id);
          return {
            ...prev,
            funnel: {
              ...prev.funnel,
              stages: prev.funnel.stages.map(stage =>
                Number(stage.id) === stage_id
                  ? { ...stage, active_leads: (stage.active_leads || []).filter(l => l.id !== lead_id) }
                  : stage
              ),
            },
          };
        }

        return prev;
      });
    });

    return () => {
      console.log(`[FunnelData] Stopping lead.live listener on: ${channelName}`);
      channel.stopListening('.lead.live');
    };
  }, [funnelId, user?.id, user?.company_id]);

  return {
    funnelData,
    availableTags,
    loading,
    error,
    refetch: () => fetchFunnelData(funnelId),
    updateLeadStage
  };
};
