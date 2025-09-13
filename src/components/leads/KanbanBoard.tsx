/**
 * KANBAN BOARD COMPONENT
 * 
 * Main Kanban board layout with drag and drop functionality
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import { timeAgo } from '@/lib/utils';
import { TagCreationDialog } from './TagCreationDialog';

interface KanbanBoardProps {
  funnel: any; // API funnel object
  onCreateLead: () => void;
  onCreateTag: () => void;
  onOpenFilters: () => void;
  onUpdateLeadStage?: (leadId: string, newStageId: string, oldStageId: string) => void;
}

const KanbanBoard = ({ funnel, onCreateLead, onCreateTag, onOpenFilters, onUpdateLeadStage }: KanbanBoardProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  
  // Transform API data to kanban format
  const kanbanColumns = funnel.stages
    ?.sort((a: any, b: any) => a.order - b.order)
    .map((stage: any) => ({
      id: stage.id.toString(),
      title: stage.name,
      description: stage.description,
      type: stage.type,
      leads: stage.active_leads.map((lead: any) => ({
        id: lead.id.toString(),
        name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        phone: lead.phone,
        company: lead.custom_fields?.industry || 'N/A',
        title: lead.custom_fields?.title || 'Contact',
        score: parseFloat(lead.ai_score || '0'),
        value: parseFloat(lead.estimated_value || '0'),
        source: lead.source_platform || 'Direct',
        tags: Array.isArray(lead.tags) ? lead.tags : [],
        lastActivity: lead.updated_at ? timeAgo(lead.updated_at) : 'No activity',
        priority: lead.priority || 'medium',
        stage: stage.id.toString(),
        avatar: lead.platform_data?.profile_picture,
        notes: lead.notes,
        createdAt: lead.created_at,
        assignedTo: lead.assigned_to,
        currency: lead.currency || 'USD',
        initialMessage: lead.initial_message,
        contactMethods: lead.contact_methods || [],
        preferredContact: lead.preferred_contact_method || 'email'
      }))
    })) || [];

  const [columns, setColumns] = useState(kanbanColumns);
  
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
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);
    
    if (!activeColumn) {
      setActiveId(null);
      return;
    }
    
    // If dropping on the same column (reordering)
    if (activeColumn === overColumn && overColumn) {
      setColumns(columns => 
        columns.map(column => {
          if (column.id !== overColumn.id) return column;
          
          const leads = column.leads;
          const oldIndex = leads.findIndex(lead => lead.id === activeId);
          const newIndex = leads.findIndex(lead => lead.id === overId);
          
          return {
            ...column,
            leads: arrayMove(leads, oldIndex, newIndex)
          };
        })
      );
    } else if (overColumn && activeColumn.id !== overColumn.id) {
      // Moving to different column
      const oldStageId = activeColumn.id;
      const newStageId = overColumn.id;
      
      if (onUpdateLeadStage) {
        // Call the API update function
        onUpdateLeadStage(activeId, newStageId, oldStageId);
      }
    }
    
    setActiveId(null);
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
                <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground">
                  Dashboard
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
                {funnel.stages?.reduce((total: number, stage: any) => total + (stage.active_leads?.length || 0), 0) || 0} total leads
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
            onClick={() => setTagDialogOpen(true)}
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
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onAddLead={handleAddLead}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeLead ? (
            <LeadCard lead={activeLead} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Tag Creation Dialog */}
      <TagCreationDialog 
        open={tagDialogOpen} 
        onOpenChange={setTagDialogOpen} 
      />
    </div>
  );
};

export default KanbanBoard;