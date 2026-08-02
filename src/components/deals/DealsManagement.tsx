/**
 * DEALS MANAGEMENT COMPONENT
 * 
 * Main component for rendering deal funnels.
 * Uses its own data hook and board, fully isolated from sales funnels.
 */

import { useState } from 'react';
import { useDealFunnelData } from '@/hooks/useDealFunnelData';
import { DealFilters } from '@/lib/dealFilters';
import DealKanbanBoard from './DealKanbanBoard';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface DealsManagementProps {
  funnelId: string;
}

const DealsManagement = ({ funnelId }: DealsManagementProps) => {
  // Filters live here rather than in the board: deals are paginated per stage,
  // so they have to reach the API, which is what feeds the board back.
  const [filters, setFilters] = useState<DealFilters>({});

  const {
    funnelData,
    availableTags,
    loading,
    error,
    refetch,
    syncDealStage,
    loadMoreStage,
    setStageSort,
    stageSorts,
    stageLoading,
  } = useDealFunnelData(funnelId, filters);

  // Only the very first load blanks the page — a filter change refetches the
  // board, and swapping it for a skeleton every time would tear the toolbar
  // (and the open filter dialog) out from under the user.
  if (loading && !funnelData?.funnel) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 2 }).map((_, cardIndex) => (
                <Skeleton key={cardIndex} className="h-32 w-full" />
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">
            {error.response?.status === 404 ? 'Deal Funnel Not Found' : 'Error Loading Deal Funnel'}
          </h2>
          <p className="text-muted-foreground">
            {error.response?.status === 404
              ? 'The requested deal funnel could not be found.'
              : 'There was an error loading the deal funnel data.'}
          </p>
        </div>
      </div>
    );
  }

  if (!funnelData?.funnel) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">No Funnel Data</h2>
          <p className="text-muted-foreground">No deal funnel data available.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <DealKanbanBoard
        funnel={funnelData.funnel}
        availableTags={availableTags}
        onRefresh={refetch}
        filters={filters}
        onFiltersChange={setFilters}
        isFiltering={loading}
        onDealStageChanged={syncDealStage}
        onLoadMoreStage={loadMoreStage}
        onStageSortChange={setStageSort}
        stageSorts={stageSorts}
        stageLoading={stageLoading}
      />
    </motion.div>
  );
};

export default DealsManagement;
