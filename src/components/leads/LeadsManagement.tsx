/**
 * LEADS MANAGEMENT COMPONENT
 * 
 * Main component that renders the appropriate Kanban board based on the selected funnel
 */

import { useState } from 'react';
import { useFunnelData } from '@/hooks/useFunnelData';
import { LeadFilters } from '@/lib/leadFilters';
import KanbanBoard from './KanbanBoard';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface LeadsManagementProps {
  funnelId: string;
}

const LeadsManagement = ({ funnelId }: LeadsManagementProps) => {
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filters live here rather than in the board: leads are paginated per stage,
  // so they have to reach the API, which is what feeds the board back.
  const [filters, setFilters] = useState<LeadFilters>({});

  const {
    funnelData,
    availableTags,
    loading,
    error,
    syncLeadStage,
    refetch,
    loadMoreStage,
    setStageSort,
    stageSorts,
    stageLoading,
  } = useFunnelData(funnelId, filters);

  // Loading state. Only the very first load blanks the page — a filter change
  // refetches the board, and swapping it for a skeleton every time would tear
  // the toolbar (and the open filter dialog) out from under the user.
  if (loading && !funnelData?.funnel) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 3 }).map((_, cardIndex) => (
                <Skeleton key={cardIndex} className="h-32 w-full" />
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">
            {error.response?.status === 404 ? 'Funnel Not Found' : 'Error Loading Funnel'}
          </h2>
          <p className="text-muted-foreground">
            {error.response?.status === 404 
              ? 'The requested sales funnel could not be found or you do not have access to it.'
              : 'There was an error loading the funnel data. Please try refreshing the page.'
            }
          </p>
        </div>
      </div>
    );
  }

  // No funnel data
  if (!funnelData?.funnel) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">No Funnel Data</h2>
          <p className="text-muted-foreground">No funnel data available.</p>
        </div>
      </div>
    );
  }

  const handleCreateLead = () => {
    toast.success('Create Lead feature coming soon!', {
      description: 'This will open a comprehensive lead creation form.'
    });
  };

  const handleCreateTag = () => {
    toast.success('Create Tag feature coming soon!', {
      description: 'This will open a tag creation modal with color selection.'
    });
  };

  const handleOpenFilters = () => {
    // The filter dialog lives in the KanbanBoard; the values it produces are
    // held here so they can be sent to the API.
  };

  const handleTagCreated = (newTag: any) => {
    // Trigger refetch to update available tags
    refetch();
  };

  const handleTagsUpdated = (leadId: string, updatedLead: any) => {
    // No need to refetch - the KanbanBoard already handles the update
    // This callback can be used for any additional logic if needed
    console.log('Lead tags updated:', leadId, updatedLead);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <KanbanBoard
        funnel={funnelData.funnel}
        availableTags={availableTags}
        onCreateLead={handleCreateLead}
        onCreateTag={handleCreateTag}
        onOpenFilters={handleOpenFilters}
        onUpdateLeadStage={syncLeadStage}
        onLeadCreated={refetch}
        onTagCreated={handleTagCreated}
        onTagsUpdated={handleTagsUpdated}
        onRefresh={refetch}
        filters={filters}
        onFiltersChange={setFilters}
        isFiltering={loading}
        onLoadMoreStage={loadMoreStage}
        onStageSortChange={setStageSort}
        stageSorts={stageSorts}
        stageLoading={stageLoading}
      />
    </motion.div>
  );
};

export default LeadsManagement;