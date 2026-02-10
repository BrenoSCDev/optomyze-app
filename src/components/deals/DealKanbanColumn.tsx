/**
 * DEAL KANBAN COLUMN COMPONENT
 * 
 * Drop target column for the Deal Kanban board.
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DealCard from './DealCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreVertical, Package } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

interface DealKanbanColumnProps {
  column: any;
  index: number;
  onAddDeal: (columnId: string) => void;
  onDealClick?: (dealId: string) => void;
  activeId?: string | null;
  overId?: string | null;
}

const DealKanbanColumn = ({ column, index, onAddDeal, onDealClick, activeId, overId }: DealKanbanColumnProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const { isOver, setNodeRef } = useDroppable({ id: column.id });
  const isDropTarget = overId === column.id;

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      ref={setNodeRef}
      className={`glass-card p-4 w-80 flex-shrink-0 transition-all duration-300 relative min-h-[400px] overflow-hidden border-white/10 ${
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
            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">
              {column.deals.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => onAddDeal(column.id)}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stage Total Value */}
        {column.totalValue > 0 && (
          <Badge className="text-xs font-medium w-fit">
            {formatCurrency(column.totalValue, column.currency)}
          </Badge>
        )}
      </div>

      {/* Column Body */}
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
        {/* Drop placeholder */}
        {activeId && isDropTarget && (
          <motion.div
            className="glass-card border-2 border-dashed border-primary bg-primary/10 rounded-lg p-4 min-h-[80px] flex items-center justify-center mb-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-sm text-primary font-medium">Drop here</p>
          </motion.div>
        )}

        <AnimatePresence>
          {column.deals.map((deal: any) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              style={{ opacity: activeId === deal.id ? 0.3 : 1 }}
            >
              <DealCard
                deal={deal}
                isDragging={activeId === deal.id}
                onDealClick={onDealClick}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {column.deals.length === 0 && !activeId && (
          <motion.div
            className="flex flex-col items-center justify-center py-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Package className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">No deals in this stage</p>
            <Button variant="outline" size="sm" onClick={() => onAddDeal(column.id)} className="text-xs">
              Add First Deal
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default DealKanbanColumn;
