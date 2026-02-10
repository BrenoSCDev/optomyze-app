/**
 * LEADS MANAGEMENT COMPONENT
 * 
 * Main component that renders the appropriate Kanban board based on the selected funnel
 */

import { useState } from 'react';
import { useFunnelData } from '@/hooks/useFunnelData';
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

  const { funnelData, availableTags, loading, error, updateLeadStage, refetch } = useFunnelData(funnelId);

  // Loading state
  if (loading) {
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
    // Filters are now handled directly in the KanbanBoard component
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
        onUpdateLeadStage={updateLeadStage}
        onLeadCreated={refetch}
        onTagCreated={handleTagCreated}
        onTagsUpdated={handleTagsUpdated}
        onRefresh={refetch}
      />
    </motion.div>
  );
};

export default LeadsManagement;