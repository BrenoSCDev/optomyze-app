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
  Users
} from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { 
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface KanbanColumnProps {
  column: ColumnType;
  onAddLead: (columnId: string) => void;
}

const KanbanColumn = ({ column, onAddLead }: KanbanColumnProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: column.id,
  });

  const getColumnColor = () => {
    if (column.color === 'green') return 'border-green-500/30 bg-green-500/5';
    if (column.color === 'red') return 'border-red-500/30 bg-red-500/5';
    return 'border-white/10';
  };

  return (
    <motion.div
      ref={setNodeRef}
      className={`glass-card p-4 w-80 flex-shrink-0 transition-all duration-300 ${getColumnColor()} ${
        isOver ? 'ring-2 ring-accent/50 scale-102' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
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

      {/* Column Body */}
      <SortableContext
        items={column.leads.map(lead => lead.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
          <AnimatePresence>
            {column.leads.map((lead) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <LeadCard lead={lead} />
              </motion.div>
            ))}
          </AnimatePresence>
          
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
      </SortableContext>
      
      {/* Drop Zone Indicator */}
      {isOver && (
        <motion.div
          className="absolute inset-0 bg-accent/10 border-2 border-accent/50 border-dashed rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
};

export default KanbanColumn;