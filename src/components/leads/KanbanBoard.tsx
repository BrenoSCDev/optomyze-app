/**
 * KANBAN BOARD COMPONENT
 * 
 * Main Kanban board layout with drag and drop functionality using react-beautiful-dnd
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import KanbanColumn from './KanbanColumn';
import { 
  Plus, 
  Filter, 
  Tag,
  UserPlus,
  Settings,
  Download
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  rectIntersection,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
  getFirstCollision,
  pointerWithin,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import LeadCard from './LeadCard';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { timeAgo } from '@/lib/utils';
import { TagCreationDialog } from './TagCreationDialog';
import { LeadCreationDialog } from './LeadCreationDialog';
import { LeadFilterDialog } from './LeadFilterDialog';
import TagManagementModal from './TagManagementModal';
import { leadService } from '@/services/leadApi';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface KanbanBoardProps {
  funnel: any; // API funnel object
  availableTags: any[];
  onCreateLead: () => void;
  onCreateTag: () => void;
  onOpenFilters: () => void;
  onUpdateLeadStage?: (leadId: string, newStageId: string, oldStageId: string) => void;
  onLeadCreated?: () => void;
  onTagCreated?: (newTag: any) => void;
  onTagsUpdated?: (leadId: string, updatedLead: any) => void;
}

const KanbanBoard = ({ funnel, availableTags, onCreateLead, onCreateTag, onOpenFilters, onUpdateLeadStage, onLeadCreated, onTagCreated, onTagsUpdated }: KanbanBoardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<any>(null);
  
  // Filter state
  const [activeFilters, setActiveFilters] = useState<any>({});
  
  // Tag modal state
  const [tagModalState, setTagModalState] = useState({
    isOpen: false,
    selectedLead: null
  });

  // DnD sensors with improved detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection for better column detection across screen sizes
  const customCollisionDetection: CollisionDetection = (args) => {
    // First try pointer-within detection for more precise column detection
    const pointerCollisions = pointerWithin(args);
    
    if (pointerCollisions.length > 0) {
      // Filter to only column IDs (exclude lead IDs)
      const columnCollisions = pointerCollisions.filter(collision => 
        columns.some(col => col.id === collision.id)
      );
      
      if (columnCollisions.length > 0) {
        return columnCollisions;
      }
    }
    
    // Fallback to rectangle intersection for edge cases
    const rectCollisions = rectIntersection(args);
    
    if (rectCollisions.length > 0) {
      // Filter to only column IDs
      const columnCollisions = rectCollisions.filter(collision => 
        columns.some(col => col.id === collision.id)
      );
      
      if (columnCollisions.length > 0) {
        return columnCollisions;
      }
    }
    
    // Final fallback to closest center, but still filter for columns
    const centerCollisions = closestCenter(args);
    return centerCollisions.filter(collision => 
      columns.some(col => col.id === collision.id)
    );
  };
  
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
        name: `${lead.first_name} ${lead.last_name ? lead.last_name : ""}`,
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
  const [filteredColumns, setFilteredColumns] = useState(kanbanColumns);

  // Filter leads based on active filters
  const filterLeads = (leads: any[], filters: any) => {
    return leads.filter(lead => {
      
      // Name filters - firstName and lastName are combined in the name field
      if (filters.firstName && !lead.name.toLowerCase().includes(filters.firstName.toLowerCase())) {
        return false;
      }
      if (filters.lastName && !lead.name.toLowerCase().includes(filters.lastName.toLowerCase())) {
        return false;
      }
      
      // Email filter
      if (filters.email && !lead.email.toLowerCase().includes(filters.email.toLowerCase())) {
        return false;
      }
      
      // Phone filter
      if (filters.phone && !lead.phone.includes(filters.phone.replace(/\D/g, ''))) {
        return false;
      }
      
      // DDI filter
      if (filters.ddi && !lead.phone.startsWith(filters.ddi)) {
        return false;
      }
      
      // Source platform filter
      if (filters.sourcePlatform && lead.source !== filters.sourcePlatform) {
        return false;
      }
      
      // Stage filter
      if (filters.stageId && lead.stage !== filters.stageId) {
        return false;
      }
      
      // Score range filter
      if (filters.scoreRange) {
        const [min, max] = filters.scoreRange;
        if (lead.score < min || lead.score > max) {
          return false;
        }
      }
      
      // Value range filter
      if (filters.valueRange) {
        const [min, max] = filters.valueRange;
        if (lead.value < min || lead.value > max) {
          return false;
        }
      }
      
      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const leadTags = lead.tags.map(tag => typeof tag === 'string' ? tag : tag.name);
        const hasMatchingTag = filters.tags.some(filterTag => leadTags.includes(filterTag));
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Apply filters to columns
  useEffect(() => {
    if (Object.keys(activeFilters).length === 0) {
      setFilteredColumns(columns);
    } else {
      const filtered = columns.map(column => ({
        ...column,
        leads: filterLeads(column.leads, activeFilters)
      }));
      setFilteredColumns(filtered);
    }
  }, [columns, activeFilters]);

  // Handle filter apply
  const handleFilterApply = (filters: any) => {
    setActiveFilters(filters);
  };

  // Handle filter clear
  const handleFilterClear = () => {
    setActiveFilters({});
  };
  
  const handleAddLead = useCallback((columnId: string) => {
    setSelectedStageId(columnId);
    setLeadDialogOpen(true);
  }, []);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the dragged lead
    const lead = columns
      .flatMap(col => col.leads)
      .find(lead => lead.id === active.id);
    setDraggedLead(lead);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active.id) {
      setActiveId(null);
      setDraggedLead(null);
      return;
    }

    const leadId = active.id as string;
    const newStageId = over.id as string;

    // Find current stage of the lead
    const currentStage = columns.find(col => 
      col.leads.some(lead => lead.id === leadId)
    );

    // Early return if no current stage found or dropping in same column
    if (!currentStage || currentStage.id === newStageId) {
      setActiveId(null);
      setDraggedLead(null);
      return;
    }

    const oldStageId = currentStage.id;
    const leadToMove = currentStage.leads.find(lead => lead.id === leadId);

    if (!leadToMove) {
      setActiveId(null);
      setDraggedLead(null);
      return;
    }

    // Optimistic update - add to top of target column
    setColumns(prevColumns => {
      const newColumns = prevColumns.map(col => {
        if (col.id === oldStageId) {
          return {
            ...col,
            leads: col.leads.filter(lead => lead.id !== leadId)
          };
        }
        if (col.id === newStageId) {
          return {
            ...col,
            leads: [{ ...leadToMove, stage: newStageId }, ...col.leads]
          };
        }
        return col;
      });
      return newColumns;
    });

    try {
      // Make API call
      const response = await leadService.moveLeadToStage(leadId, newStageId);
      
      // Update with API response data
      setColumns(prevColumns => {
        return prevColumns.map(col => {
          if (col.id === newStageId) {
            return {
              ...col,
              leads: col.leads.map(lead => 
                lead.id === leadId 
                  ? {
                      ...lead,
                      ...response.data,
                      id: response.data.id.toString(),
                      name: `${response.data.first_name} ${response.data.last_name || ''}`,
                      stage: response.data.stage_id.toString()
                    }
                  : lead
              )
            };
          }
          return col;
        });
      });

      toast.success('Lead moved successfully');
      
      // Notify parent component
      if (onUpdateLeadStage) {
        onUpdateLeadStage(leadId, newStageId, oldStageId);
      }
    } catch (error) {
      console.error('Error moving lead:', error);
      
      // Revert optimistic update - restore to original position
      setColumns(prevColumns => {
        const newColumns = prevColumns.map(col => {
          if (col.id === newStageId) {
            return {
              ...col,
              leads: col.leads.filter(lead => lead.id !== leadId)
            };
          }
          if (col.id === oldStageId) {
            // Find original position or add to end if not found
            const originalIndex = col.leads.findIndex(lead => lead.id === leadId);
            const newLeads = [...col.leads];
            if (originalIndex >= 0) {
              newLeads.splice(originalIndex, 0, leadToMove);
            } else {
              newLeads.push(leadToMove);
            }
            return {
              ...col,
              leads: newLeads
            };
          }
          return col;
        });
        return newColumns;
      });

      toast.error('Failed to move lead. Please try again.');
    }

    setActiveId(null);
    setDraggedLead(null);
  };

  // Handle tag icon click
  const handleTagClick = (lead: any) => {
    setTagModalState({
      isOpen: true,
      selectedLead: lead
    });
  };

  // Handle tag modal close
  const handleTagModalClose = () => {
    setTagModalState({
      isOpen: false,
      selectedLead: null
    });
  };

  // Handle lead click to navigate to detail page
  const handleLeadClick = (leadId: string) => {
    navigate(`/leads/${funnel.id}/lead/${leadId}`);
  };

  // Handle tags updated with API response data
  const handleTagsUpdated = (leadId: string, updatedLead: any) => {
    // Transform the API lead data to match our UI format
    const transformedLead = {
      id: updatedLead.id.toString(),
      name: `${updatedLead.first_name} ${updatedLead.last_name}`,
      email: updatedLead.email,
      phone: updatedLead.phone,
      company: updatedLead.custom_fields?.industry || 'N/A',
      title: updatedLead.custom_fields?.title || 'Contact',
      score: parseFloat(updatedLead.ai_score || '0'),
      value: parseFloat(updatedLead.estimated_value || '0'),
      source: updatedLead.source_platform || 'Direct',
      tags: Array.isArray(updatedLead.tags) ? updatedLead.tags.map((tag: any) => tag.name || tag) : [],
      lastActivity: updatedLead.updated_at ? timeAgo(updatedLead.updated_at) : 'No activity',
      priority: updatedLead.priority || 'medium',
      stage: updatedLead.stage_id.toString(),
      avatar: updatedLead.platform_data?.profile_picture,
      notes: updatedLead.notes,
      createdAt: updatedLead.created_at,
      assignedTo: updatedLead.assigned_to,
      currency: updatedLead.currency || 'USD',
      initialMessage: updatedLead.initial_message,
      contactMethods: updatedLead.contact_methods || [],
      preferredContact: updatedLead.preferred_contact_method || 'email'
    };

    // Update the specific lead in the columns state
    setColumns(prevColumns => {
      return prevColumns.map(column => ({
        ...column,
        leads: column.leads.map(lead => 
          lead.id === leadId ? transformedLead : lead
        )
      }));
    });

    // Also notify parent component if callback is provided (but don't refetch)
    if (onTagsUpdated) {
      onTagsUpdated(leadId, updatedLead);
    }
  };

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
            <Badge
              variant="secondary"
              className="bg-primary/20 text-primary px-3 py-1"
            >
              {funnel.stages?.reduce((total: number, stage: any) => total + (stage.active_leads?.length || 0), 0) || 0} total leads
            </Badge>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <Button
            variant="outline"
            size="sm"
            className="glass-card border-white/20 hover:bg-white/10"
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
          
          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            className="glass-card border-white/20 hover:bg-white/10"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          
          {/* Create Tag Button - Hidden for Agent role */}
          {user?.role?.toLowerCase() !== 'agent' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTagDialogOpen(true)}
              className="glass-card border-accent/30 hover:bg-accent/10"
            >
              <Tag className="h-4 w-4 mr-1" />
              Create Tag
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterDialogOpen(true)}
            className={`glass-card border-white/20 hover:bg-white/10 ${
              Object.keys(activeFilters).length > 0 ? 'ring-2 ring-blue-400/50 bg-blue-500/10' : ''
            }`}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {Object.keys(activeFilters).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                {Object.keys(activeFilters).length}
              </span>
            )}
          </Button>
          
          <Button
            size="sm"
            onClick={() => {
              setSelectedStageId('');
              setLeadDialogOpen(true);
            }}
            className="bg-gradient-primary hover:opacity-90 text-white font-medium"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Create Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <style>
      {`
        .kanban-board {
          max-width: 640px; /* Small screens (default) */
          overflow-x: auto;
        }

        @media (min-width: 768px) { /* Mid screens */
          .kanban-board {
            max-width: 768px;
          }
        }

        @media (min-width: 1024px) { /* Normal laptop */
          .kanban-board {
            max-width: 1024px;
          }
        }

        @media (min-width: 1280px) { /* Wide */
          .kanban-board {
            max-width: 1200px;
          }
        }

        @media (min-width: 1536px) { /* Ultra Wide */
          .kanban-board {
            max-width: 1600px;
          }
        }
      `}
      </style>

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        autoScroll={false}
      >
        <div
          className="flex gap-6 pb-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 kanban-board"
        >
          {filteredColumns.map((column, index) => (
            <KanbanColumn
              key={column.id}
              column={column}
              index={index}
              onAddLead={handleAddLead}
              onTagClick={handleTagClick}
              onLeadClick={handleLeadClick}
              activeId={activeId}
            />
          ))}
        </div>
        
        <DragOverlay 
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {activeId && draggedLead ? (
            <div className="relative transform rotate-2 scale-105 transition-all duration-200 pointer-events-none">
              {/* Enhanced shadow and glow effect */}
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-lg transform scale-110" />
              <div className="relative glass-card border-2 border-primary/50 shadow-2xl">
                <LeadCard
                  lead={draggedLead}
                  isDragging={false}
                  onTagClick={handleTagClick}
                  onLeadClick={handleLeadClick}
                />
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>


      {/* Tag Creation Dialog */}
      <TagCreationDialog 
        open={tagDialogOpen} 
        onOpenChange={setTagDialogOpen}
        onTagCreated={onTagCreated}
      />

      {/* Lead Creation Dialog */}
      <LeadCreationDialog
        isOpen={leadDialogOpen}
        onClose={() => {
          setLeadDialogOpen(false);
          setSelectedStageId('');
        }}
        funnelId={funnel.id?.toString() || ''}
        funnelData={{ funnel }}
        selectedStageId={selectedStageId}
        onLeadCreated={() => {
          setLeadDialogOpen(false);
          setSelectedStageId('');
          onLeadCreated?.();
        }}
      />

      {/* Tag Management Modal */}
      <TagManagementModal
        isOpen={tagModalState.isOpen}
        onClose={handleTagModalClose}
        lead={tagModalState.selectedLead}
        availableTags={availableTags}
        onTagsUpdated={handleTagsUpdated}
      />

      {/* Lead Filter Dialog */}
      <LeadFilterDialog
        isOpen={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        funnelData={{ funnel }}
        availableTags={availableTags}
        onFilterApply={handleFilterApply}
        onFilterClear={handleFilterClear}
      />
    </div>
  );
};

export default KanbanBoard;