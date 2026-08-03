/**
 * DEAL KANBAN COLUMN COMPONENT
 * 
 * Teal-accented drop target column for the Deal Kanban board.
 */

import { useState, useEffect, useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import DealCard from './DealCard';
import { StageSort } from '@/types/leads';
import { motion } from 'framer-motion';
import { Plus, MoreVertical, Package, ArrowDownNarrowWide, ArrowUpNarrowWide, Check, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDroppable } from '@dnd-kit/core';
import { useCurrency } from '@/hooks/useCurrency';

interface DealKanbanColumnProps {
  column: any;
  index: number;
  onAddDeal: (columnId: string) => void;
  onDealClick?: (dealId: string) => void;
  onTagClick?: (deal: any) => void;
  activeId?: string | null;
  overId?: string | null;
  showProducts?: boolean;
  showCharges?: boolean;
  /** Pulls the next page of deals into this column. */
  onLoadMore?: (columnId: string) => void;
  isLoadingMore?: boolean;
  sortOrder?: StageSort;
  onSortChange?: (columnId: string, sort: StageSort) => void;
}

const DealKanbanColumn = ({ column, index, onAddDeal, onDealClick, onTagClick, activeId, overId, showProducts = true, showCharges = true, onLoadMore, isLoadingMore = false, sortOrder = 'newest', onSortChange }: DealKanbanColumnProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { currencyCode: companyCurrency } = useCurrency();

  const { isOver, setNodeRef } = useDroppable({ id: column.id });
  const isDropTarget = overId === column.id;

  const formatCurrency = (amount: number, currency: string = companyCurrency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  };

  const total = column.total ?? column.deals.length;
  const hasMore = !!column.hasMore;

  /*
   * Infinite scroll. Deals arrive ten at a time, so the column watches a
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
  }, [hasMore, onLoadMore, column.id, column.deals.length]);

  return (
    <motion.div
      ref={setNodeRef}
      className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4 w-[22rem] flex-shrink-0 transition-colors duration-base ease-standard relative min-h-[400px] overflow-hidden ${
        isOver || isDropTarget ? 'ring-2 ring-deal/50 bg-deal/5' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ zIndex: isOver || isDropTarget ? 10 : 1 }}
      data-column-id={column.id}
    >
      {/* Stage Color Bar - thicker for deals */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
        style={{ backgroundColor: column.stageColor || '#14b8a6' }}
      />

      {/* Column Header */}
      <div className="flex flex-col gap-1 mb-4 pt-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground text-sm">{column.title}</h3>
            {/* The stage's full size, not the number of cards loaded. */}
            <span className="text-xs font-medium text-muted-foreground">{total}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-deal/10 text-muted-foreground hover:text-deal" onClick={() => onAddDeal(column.id)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-deal/10 text-muted-foreground hover:text-deal">
                  <MoreVertical className="h-3.5 w-3.5" />
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

        {/* Stage Total Value */}
        {column.totalValue > 0 && (
          <p className="text-xs font-semibold text-deal w-fit">
            {formatCurrency(column.totalValue, companyCurrency)}
          </p>
        )}
      </div>

      {/* Column Body */}
      <div ref={scrollRef} className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-deal">
        {/* Drop placeholder */}
        {activeId && isDropTarget && (
          <motion.div
            className="rounded-lg border-2 border-dashed border-deal bg-deal/10 p-3 min-h-[60px] flex items-center justify-center mb-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-sm text-deal font-medium">Drop here</p>
          </motion.div>
        )}

        {/*
          No AnimatePresence around the cards — see KanbanColumn for the full
          reasoning: the optimistic move deletes and re-inserts a card in one
          commit, and an exit animation left it visible in both columns at
          once. The dragged card is hidden rather than faded, because the
          DragOverlay copy is the one the user is following.
        */}
        {column.deals.map((deal: any) => (
          <div key={deal.id} className={activeId === deal.id ? 'invisible' : undefined}>
            <DealCard
              deal={deal}
              isDragging={activeId === deal.id}
              onDealClick={onDealClick}
              onTagClick={onTagClick}
              showProducts={showProducts}
              showCharges={showCharges}
            />
          </div>
        ))}

        {/* Infinite scroll trigger — also the "loading" affordance. */}
        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className={`h-3.5 w-3.5 ${isLoadingMore ? 'animate-spin' : 'opacity-40'}`} />
            <span>
              {isLoadingMore ? 'Loading more deals…' : `Showing ${column.deals.length} of ${total}`}
            </span>
          </div>
        )}

        {/* Empty State */}
        {column.deals.length === 0 && !activeId && (
          <motion.div
            className="flex flex-col items-center justify-center py-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Package className="h-8 w-8 text-deal/40 mb-2" />
            <p className="text-sm text-muted-foreground mb-2">No deals in this stage</p>
            <Button variant="outline" size="sm" onClick={() => onAddDeal(column.id)} className="text-xs border-deal/30 text-deal hover:bg-deal/10">
              Add First Deal
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

/** Memoised: see LeadCard — a board-level state change (opening any
 *  modal) must not re-render every card before the modal paints. */
export default memo(DealKanbanColumn);
