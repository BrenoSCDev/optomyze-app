/**
 * DEAL FUNNEL DATA HOOK
 *
 * Fetches and manages deal funnel data independently from sales funnels.
 */

import { useState, useEffect, useCallback } from 'react';
import { dealFunnelService } from '@/services/dealFunnelApi';
import { getEcho } from '@/services/echo';
import { tagAppliesTo } from '@/components/tags/TagScopeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useDealFunnelData = (funnelId: string | undefined) => {
  const { user } = useAuth() as { user: { id: number; company_id: number } | null };
  const [funnelData, setFunnelData] = useState<any>(null);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!funnelId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await dealFunnelService.getDealFunnelData(funnelId);
      setFunnelData(data);
      // Embedded in the funnel payload, so filtered here rather than via ?scope=.
      setAvailableTags((data?.tags || []).filter((tag: any) => tagAppliesTo(tag, 'deal')));
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
  }, [funnelId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          const role = (user as any).role;
          if (role === 'agent' && deal.lead?.assigned_to !== user!.id) return prev;

          const dealStageId = Number(deal.stage_id);
          const alreadyExists = prev.funnel.stages.some(
            (s: any) => s.deals?.some((d: any) => d.id === deal.id)
          );
          if (alreadyExists) return prev;

          return {
            ...prev,
            funnel: {
              ...prev.funnel,
              stages: prev.funnel.stages.map((stage: any) =>
                Number(stage.id) === dealStageId
                  ? { ...stage, deals: [deal, ...(stage.deals || [])] }
                  : stage
              ),
            },
          };
        }

        if (payload.action === 'stage_changed') {
          const deal_id = Number(payload.deal_id);
          const old_stage_id = Number(payload.old_stage_id);
          const new_stage_id = Number(payload.new_stage_id);
          const { new_stage_type } = payload;

          return {
            ...prev,
            funnel: {
              ...prev.funnel,
              stages: prev.funnel.stages.map((stage: any) => {
                const stageId = Number(stage.id);
                if (stageId === old_stage_id) {
                  return {
                    ...stage,
                    deals: (stage.deals || []).filter((d: any) => d.id !== deal_id),
                  };
                }
                if (
                  stageId === new_stage_id &&
                  new_stage_type !== 'lost' &&
                  new_stage_type !== 'won'
                ) {
                  const movedDeal = prev.funnel.stages
                    .find((s: any) => Number(s.id) === old_stage_id)
                    ?.deals?.find((d: any) => d.id === deal_id);

                  if (movedDeal) {
                    return {
                      ...stage,
                      deals: [
                        { ...movedDeal, stage_id: new_stage_id },
                        ...(stage.deals || []),
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
          const deal_id = Number(payload.deal_id);
          const stage_id = Number(payload.stage_id);
          return {
            ...prev,
            funnel: {
              ...prev.funnel,
              stages: prev.funnel.stages.map((stage: any) =>
                Number(stage.id) === stage_id
                  ? { ...stage, deals: (stage.deals || []).filter((d: any) => d.id !== deal_id) }
                  : stage
              ),
            },
          };
        }

        return prev;
      });
    });

    return () => {
      console.log(`[DealFunnelData] Stopping deal.live listener on: ${channelName}`);
      channel.stopListening('.deal.live');
    };
  }, [funnelId, user?.id, user?.company_id]);

  return {
    funnelData,
    availableTags,
    loading,
    error,
    refetch: fetchData,
  };
};
