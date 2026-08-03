/**
 * KANBAN COLUMN COMPONENT
 * 
 * Drop target column for the Kanban board with glassmorphism design
 * 
 * ARCHITECTURE:
 * - Uses useDroppable to make column a valid drop target
 * - Does NOT use SortableContext since we're not sorting within columns
 * - Lead cards use useDraggable (not useSortable) to avoid mixed droppable conflicts
 */

import { memo } from 'react';

import { useState, useEffect, useRef } from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { KanbanColumn as ColumnType, StageSort } from '@/types/leads';
import { Button } from '@/components/ui/button';
import LeadCard from './LeadCard';
import { motion } from 'framer-motion';
import {
  Plus,
  MoreVertical,
  Users,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Check,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useDroppable,
} from '@dnd-kit/core';


interface KanbanColumnProps {
  column: ColumnType & { stageColor?: string };
  index: number;
  onAddLead: (columnId: string) => void;
  onTagClick?: (lead: any) => void;
  onLeadClick?: (leadId: string) => void;
  onDeleteLead?: (lead: any) => void;
  onArchiveLead?: (lead: any) => void;
  onAssignUser?: (lead: any) => void;
  onMoveFunnel?: (lead: any) => void;
  activeId?: string | null;
  overId?: string | null;
  stageValueEstimated?: number;
  stageCurrency?: string;
  showEstimatedValues?: boolean;
  showAssignedUser?: boolean;
  /** Pulls the next page of leads into this column. */
  onLoadMore?: (columnId: string) => void;
  isLoadingMore?: boolean;
  sortOrder?: StageSort;
  onSortChange?: (columnId: string, sort: StageSort) => void;
}

const KanbanColumn = ({ column, index, onAddLead, onTagClick, onLeadClick, onDeleteLead, onArchiveLead, onAssignUser, onMoveFunnel, activeId, overId, stageValueEstimated, stageCurrency, showEstimatedValues = true, showAssignedUser = true, onLoadMore, isLoadingMore = false, sortOrder = 'newest', onSortChange }: KanbanColumnProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { currencyCode: companyCurrency } = useCurrency();

  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  const total = column.total ?? column.leads.length;
  const hasMore = !!column.hasMore;

  /*
   * Infinite scroll. Leads arrive ten at a time, so the column watches a
   * sentinel pinned below the last card and asks for the next page as it comes
   * into view. The observer is rooted on the column's own scroller, not the
   * viewport, since each column scrolls independently.
   *
   * Sorting is not done here: it would only reorder the pages already loaded.
   * The order is a server-side concern, handled through onSortChange.
   */
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore(column.id);
      },
      { root: scrollRef.current, rootMargin: '150px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, column.id, column.leads.length]);

  const getColumnColor = () => {
    if (column.color === 'green') return 'border-green-500/30 bg-green-500/5';
    if (column.color === 'red') return 'border-red-500/30 bg-red-500/5';
    return 'border-border';
  };

  // Determine if this column is the current drop target
  const isDropTarget = overId === column.id;

  return (
    <motion.div
      ref={setNodeRef}
      className={`glass-card rounded-lg p-4 w-[25rem] flex-shrink-0 transition-colors duration-base ease-standard relative min-h-[400px] overflow-hidden ${getColumnColor()} ${
        isOver || isDropTarget ? 'ring-2 ring-primary/50 bg-primary/5' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ zIndex: isOver || isDropTarget ? 10 : 1 }}
      data-column-id={column.id}
    >
      {/* Stage Color Bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: column.stageColor || '#FFFFFF' }}
      />
      
      {/* Column Header */}
      <div className="flex flex-col gap-1 mb-4 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{column.title}</h3>
            {/* The stage's full size, not the number of cards loaded. */}
            <span className="text-sm font-medium text-muted-foreground">{total}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/10"
              onClick={() => onAddLead(column.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary/10"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-border">
                <DropdownMenuItem onClick={() => onSortChange?.(column.id, 'newest')} className="cursor-pointer">
                  <ArrowDownNarrowWide className="h-4 w-4" />
                  Newest first
                  {sortOrder === 'newest' && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange?.(column.id, 'oldest')} className="cursor-pointer">
                  <ArrowUpNarrowWide className="h-4 w-4" />
                  Oldest first
                  {sortOrder === 'oldest' && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stage Estimated Value */}
        {showEstimatedValues && stageValueEstimated !== undefined && stageValueEstimated > 0 && (
          <p className="text-xs font-semibold text-foreground/80 w-fit">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: companyCurrency }).format(stageValueEstimated)}
          </p>
        )}
      </div>

      {/* Column Body */}
      <div ref={scrollRef} className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
        {/* Drag Placeholder - shown only when this column is the drop target */}
        {activeId && isDropTarget && (
          <motion.div
            className="glass-card border-2 border-dashed border-primary bg-primary/10 rounded-lg p-4 min-h-[80px] flex items-center justify-center mb-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="text-center">
              <p className="text-sm text-primary font-medium">Drop here</p>
            </div>
          </motion.div>
        )}
        
        {/*
          No AnimatePresence around the cards. The optimistic move removes a
          card from one column and inserts it into another in the same commit;
          an exit animation kept the old copy on screen through the transition,
          so the card appeared in both columns at once. Dragging is not the
          moment for entry/exit choreography.

          The dragged card is hidden rather than faded — the DragOverlay copy
          is the one the user is following, and a 30%-opacity twin left behind
          reads as a rendering fault.
        */}
        {column.leads.map((lead) => (
            <div key={lead.id} className={activeId === lead.id ? 'invisible' : undefined}>
              <LeadCard
                lead={lead}
                isDragging={activeId === lead.id}
                isMoving={false}
                onTagClick={onTagClick}
                onLeadClick={onLeadClick}
                onDeleteLead={onDeleteLead}
                onArchiveLead={onArchiveLead}
                onAssignUser={onAssignUser}
                onMoveFunnel={onMoveFunnel}
                showEstimatedValue={showEstimatedValues}
                showAssignedUser={showAssignedUser}
              />
            </div>
          ))}

        {/* Infinite scroll trigger — also the "loading" affordance. */}
        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className={`h-3.5 w-3.5 ${isLoadingMore ? 'animate-spin' : 'opacity-40'}`} />
            <span>
              {isLoadingMore
                ? 'Loading more leads…'
                : `Showing ${column.leads.length} of ${total}`}
            </span>
          </div>
        )}

        {/* Empty State */}
        {column.leads.length === 0 && !activeId && (
          <motion.div
            className="flex flex-col items-center justify-center py-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">No leads in this stage</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddLead(column.id)}
              className="text-xs"
            >
              Add First Lead
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

/** Memoised for the same reason as LeadCard — see the note there. */
export default memo(KanbanColumn);