import { useState, useEffect } from 'react';
import { funnelService } from '@/services/funnelApi';
import { toast } from 'sonner';
import { getMockSalesFunnelData } from '@/data/mockFunnelLeadsData';

export const useFunnelData = (funnelId) => {
  const [funnelData, setFunnelData] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFunnelData = async (id) => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);

      // TODO: restore API call later
      // const data = await funnelService.getFunnelData(id);
      const data = getMockSalesFunnelData(id);
      
      const tags = data?.tags || [];
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
  };

  const updateLeadStage = async (leadId, newStageId, oldStageId) => {
    try {
      // Optimistic update
      setFunnelData(prevData => {
        if (!prevData?.funnel?.stages) return prevData;
        
        const newData = { ...prevData };
        newData.funnel.stages = newData.funnel.stages.map(stage => {
          const newStage = { ...stage };
          
          // Remove lead from old stage
          if (stage.id === oldStageId) {
            newStage.active_leads = stage.active_leads.filter(lead => lead.id !== leadId);
          }
          
          // Add lead to new stage
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

      // Make API call
      await funnelService.updateLeadStage(leadId, newStageId);
      
      toast.success('Lead moved successfully');
    } catch (err) {
      console.error('Failed to update lead stage:', err);
      
      // Revert optimistic update
      await fetchFunnelData(funnelId);
      
      toast.error('Failed to move lead', {
        description: 'There was an error moving the lead. Please try again.'
      });
    }
  };

  useEffect(() => {
    fetchFunnelData(funnelId);
  }, [funnelId]);

  return {
    funnelData,
    availableTags,
    loading,
    error,
    refetch: () => fetchFunnelData(funnelId),
    updateLeadStage
  };
};