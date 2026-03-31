/**
 * DEAL FUNNEL DATA HOOK
 * 
 * Fetches and manages deal funnel data independently from sales funnels.
 */

import { useState, useEffect, useCallback } from 'react';
import { dealFunnelService } from '@/services/dealFunnelApi';
import { tagService } from '@/services/tagApi';
import { toast } from 'sonner';

export const useDealFunnelData = (funnelId: string | undefined) => {
  const [funnelData, setFunnelData] = useState<any>(null);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!funnelId) return;

    try {
      setLoading(true);
      setError(null);
      const [data, tags] = await Promise.all([
        dealFunnelService.getDealFunnelData(funnelId),
        tagService.getAllTags().catch(() => []),
      ]);
      setFunnelData(data);
      setAvailableTags(data?.tags || tags || []);
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

  return {
    funnelData,
    availableTags,
    loading,
    error,
    refetch: fetchData,
  };
};
