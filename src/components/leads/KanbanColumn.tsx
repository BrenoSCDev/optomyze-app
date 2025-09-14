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
import { Droppable, Draggable } from 'react-beautiful-dnd';

interface KanbanColumnProps {
  column: ColumnType;
  index: number;
  onAddLead: (columnId: string) => void;
  movingLeads?: Record<string, boolean>;
}

const KanbanColumn = ({ column, index, onAddLead, movingLeads = {} }: KanbanColumnProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getColumnColor = () => {
    if (column.color === 'green') return 'border-green-500/30 bg-green-500/5';
    if (column.color === 'red') return 'border-red-500/30 bg-red-500/5';
    return 'border-white/10';
  };

  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`glass-card p-4 w-80 flex-shrink-0 transition-all duration-300 ${getColumnColor()} ${
            snapshot.isDragging ? 'rotate-2 scale-105' : ''
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4" {...provided.dragHandleProps}>
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
          <Droppable droppableId={column.id} type="LEAD">
            {(provided, snapshot) => (
              <div 
                className={`space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 transition-all duration-200 ${
                  snapshot.isDraggingOver ? 'bg-primary/5 border-primary/30 border-2 border-dashed rounded-lg' : ''
                }`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <AnimatePresence>
                  {column.leads.map((lead, index) => (
                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                      {(provided, snapshot) => (
                        <motion.div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            ...provided.draggableProps.style,
                            transform: snapshot.isDragging 
                              ? `${provided.draggableProps.style?.transform} rotate(3deg)` 
                              : provided.draggableProps.style?.transform,
                          }}
                        >
                          <LeadCard 
                            lead={lead} 
                            isDragging={snapshot.isDragging}
                            isMoving={movingLeads[lead.id]} 
                          />
                        </motion.div>
                      )}
                    </Draggable>
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
                
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </motion.div>
      )}
    </Draggable>
  );
};

export default KanbanColumn;