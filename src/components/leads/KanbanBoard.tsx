/**
 * KANBAN BOARD COMPONENT
 * 
 * Main Kanban board layout with drag and drop functionality
 */

import { useState, useCallback } from 'react';
import { SalesFunnel, Lead } from '@/types/leads';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import KanbanColumn from './KanbanColumn';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Filter, 
  Tag,
  UserPlus,
  TrendingUp,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import LeadCard from './LeadCard';

interface KanbanBoardProps {
  funnel: SalesFunnel;
  onCreateLead: () => void;
  onCreateTag: () => void;
  onOpenFilters: () => void;
}

const KanbanBoard = ({ funnel, onCreateLead, onCreateTag, onOpenFilters }: KanbanBoardProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [columns, setColumns] = useState(funnel.columns);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findColumn = (unique: string) => {
    if (!columns) return null;
    
    if (columns.some(c => c.id === unique)) {
      return columns.find(c => c.id === unique) || null;
    }
    
    const id = String(unique);
    return columns.find(c => c.leads.some(lead => lead.id === id)) || null;
  };

  const findLead = (unique: string) => {
    if (!columns) return null;
    
    const id = String(unique);
    for (const column of columns) {
      const lead = column.leads.find(lead => lead.id === id);
      if (lead) return lead;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId) return;

    const activeColumn = findColumn(active.id as string);
    const overColumn = findColumn(overId as string);

    if (!activeColumn || !overColumn) return;
    if (activeColumn.id === overColumn.id) return;

    setColumns(prevColumns => {
      const activeItems = activeColumn.leads;
      const overItems = overColumn.leads;

      const activeIndex = activeItems.findIndex(item => item.id === active.id);
      const overIndex = overItems.findIndex(item => item.id === overId);

      const activeItem = activeItems[activeIndex];
      if (!activeItem) return prevColumns;

      const updatedActiveItem = { ...activeItem, stage: overColumn.id };

      return prevColumns.map(column => {
        if (column.id === activeColumn.id) {
          return {
            ...column,
            leads: activeItems.filter(item => item.id !== active.id)
          };
        } else if (column.id === overColumn.id) {
          const newItems = [...overItems];
          const insertIndex = overIndex >= 0 ? overIndex : newItems.length;
          newItems.splice(insertIndex, 0, updatedActiveItem);
          return {
            ...column,
            leads: newItems
          };
        }
        return column;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const activeColumn = findColumn(active.id as string);
      const overColumn = findColumn(over.id as string);

      if (activeColumn && overColumn && activeColumn.id === overColumn.id) {
        setColumns(prevColumns => {
          return prevColumns.map(column => {
            if (column.id === activeColumn.id) {
              const oldIndex = column.leads.findIndex(lead => lead.id === active.id);
              const newIndex = column.leads.findIndex(lead => lead.id === over.id);
              
              return {
                ...column,
                leads: arrayMove(column.leads, oldIndex, newIndex)
              };
            }
            return column;
          });
        });
      }
    }
  };

  const handleAddLead = useCallback((columnId: string) => {
    onCreateLead();
  }, [onCreateLead]);

  const activeLead = activeId ? findLead(activeId) : null;

  // Calculate trend (mock data)
  const trendPercentage = Math.floor(Math.random() * 20) + 5;
  const isPositiveTrend = Math.random() > 0.3;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Side */}
        <div className="space-y-2">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" className="text-muted-foreground hover:text-foreground">
                  Leads
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-medium">
                  {funnel.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          {/* Title and Stats */}
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-foreground">{funnel.name}</h1>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-primary/20 text-primary px-3 py-1"
              >
                {funnel.totalLeads} total leads
              </Badge>
              <div className={`flex items-center gap-1 text-sm ${
                isPositiveTrend ? 'text-green-400' : 'text-red-400'
              }`}>
                {isPositiveTrend ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                <span>{trendPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onCreateTag}
            className="glass-card border-accent/30 hover:bg-accent/10"
          >
            <Tag className="h-4 w-4 mr-2" />
            Create Tag
          </Button>
          
          <Button
            variant="outline"
            onClick={onOpenFilters}
            className="glass-card border-white/20 hover:bg-white/10"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button
            onClick={onCreateLead}
            className="bg-gradient-primary hover:opacity-90 text-white font-medium"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="relative">
          {/* Horizontal Scroll Container */}
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 scroll-smooth w-[1200px]">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onAddLead={handleAddLead}
              />
            ))}
          </div>
          
          {/* Scroll Indicators */}
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gradient-to-r from-background to-transparent w-8 h-20 pointer-events-none opacity-50" />
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gradient-to-l from-background to-transparent w-8 h-20 pointer-events-none opacity-50" />
        </div>
        
        <DragOverlay>
          {activeLead ? (
            <LeadCard lead={activeLead} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;