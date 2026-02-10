/**
 * DEAL FUNNEL DATA HOOK
 * 
 * Fetches and manages deal funnel data independently from sales funnels.
 */

import { useState, useEffect, useCallback } from 'react';
import { dealFunnelService } from '@/services/dealFunnelApi';
import { toast } from 'sonner';

export const useDealFunnelData = (funnelId: string | undefined) => {
  const [funnelData, setFunnelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!funnelId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await dealFunnelService.getDealFunnelData(funnelId);
      setFunnelData(data);
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
    loading,
    error,
    refetch: fetchData,
  };
};
