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

import { useState } from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { KanbanColumn as ColumnType } from '@/types/leads';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LeadCard from './LeadCard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreVertical,
  Users,
} from 'lucide-react';
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
  onAssignUser?: (lead: any) => void;
  onMoveFunnel?: (lead: any) => void;
  activeId?: string | null;
  overId?: string | null;
  stageValueEstimated?: number;
  stageCurrency?: string;
  showEstimatedValues?: boolean;
  showAssignedUser?: boolean;
}

const KanbanColumn = ({ column, index, onAddLead, onTagClick, onLeadClick, onDeleteLead, onAssignUser, onMoveFunnel, activeId, overId, stageValueEstimated, stageCurrency, showEstimatedValues = true, showAssignedUser = true }: KanbanColumnProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { currencyCode: companyCurrency } = useCurrency();
  
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  const getColumnColor = () => {
    if (column.color === 'green') return 'border-green-500/30 bg-green-500/5';
    if (column.color === 'red') return 'border-red-500/30 bg-red-500/5';
    return 'border-white/10';
  };

  // Determine if this column is the current drop target
  const isDropTarget = overId === column.id;

  return (
    <motion.div
      ref={setNodeRef}
      className={`glass-card p-4 w-80 flex-shrink-0 transition-all duration-300 relative min-h-[400px] overflow-hidden ${getColumnColor()} ${
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
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: companyCurrency }).format(stageValueEstimated)}
          </Badge>
        )}
      </div>

      {/* Column Body */}
      <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
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
        
        <AnimatePresence>
          {column.leads.map((lead) => (
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
                onDeleteLead={onDeleteLead}
                onAssignUser={onAssignUser}
                onMoveFunnel={onMoveFunnel}
                showEstimatedValue={showEstimatedValues}
                showAssignedUser={showAssignedUser}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
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

export default KanbanColumn;