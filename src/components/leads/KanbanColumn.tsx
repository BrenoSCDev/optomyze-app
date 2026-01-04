/**
 * KANBAN COLUMN COMPONENT
 * 
 * Draggable column for the Kanban board with glassmorphism design
 */

import { useState } from 'react';
import { KanbanColumn as ColumnType } from '@/types/leads';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LeadCard from './LeadCard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreVertical,
  Users,
  DollarSign
} from 'lucide-react';
import {
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';


interface KanbanColumnProps {
  column: ColumnType & { stageColor?: string };
  index: number;
  onAddLead: (columnId: string) => void;
  onTagClick?: (lead: any) => void;
  onLeadClick?: (leadId: string) => void;
  activeId?: string | null;
  stageValueEstimated?: number;
  stageCurrency?: string;
  showEstimatedValues?: boolean;
  showAssignedUser?: boolean;
}

const KanbanColumn = ({ column, index, onAddLead, onTagClick, onLeadClick, activeId, stageValueEstimated, stageCurrency, showEstimatedValues = true, showAssignedUser = true }: KanbanColumnProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });
  
  const leadIds = column.leads.map(lead => lead.id);

  const getColumnColor = () => {
    if (column.color === 'green') return 'border-green-500/30 bg-green-500/5';
    if (column.color === 'red') return 'border-red-500/30 bg-red-500/5';
    return 'border-white/10';
  };

  return (
    <motion.div
      ref={setNodeRef}
      className={`glass-card p-4 w-80 flex-shrink-0 transition-all duration-300 relative min-h-[400px] overflow-hidden ${getColumnColor()} ${
        isOver ? 'ring-2 ring-primary/50 bg-primary/5' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ zIndex: isOver ? 10 : 1 }}
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
            <Badge
              variant="secondary"
              className="bg-muted/50 text-muted-foreground"
            >
              {column.leads.length}
            </Badge>
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
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10"
              >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Stage Estimated Value */}
        {showEstimatedValues && stageValueEstimated !== undefined && stageValueEstimated > 0 && (
          <Badge className="text-xs font-medium w-fit">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: stageCurrency || 'USD' }).format(stageValueEstimated)}
          </Badge>
        )}
      </div>

      {/* Column Body */}
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
        {/* Drag Placeholder - shown when dragging any lead */}
        {activeId && (
          <motion.div
            className="glass-card border-2 border-dashed border-primary/50 bg-primary/10 rounded-lg p-4 min-h-[120px] flex items-center justify-center mb-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{ height: '120px' }}
          >
            <div className="text-center">
              <p className="text-sm text-primary font-medium">Drop lead here</p>
              <p className="text-xs text-primary/70 mt-1">Will be added to top of column</p>
            </div>
          </motion.div>
        )}
        
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {column.leads.map((lead, leadIndex) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                style={{
                  opacity: activeId === lead.id ? 0.3 : 1,
                }}
              >
                <LeadCard 
                  lead={lead} 
                  isDragging={activeId === lead.id}
                  isMoving={false}
                  onTagClick={onTagClick}
                  onLeadClick={onLeadClick}
                  showEstimatedValue={showEstimatedValues}
                  showAssignedUser={showAssignedUser}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>
        
        {/* Empty State */}
        {column.leads.length === 0 && (
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

export default KanbanColumn;