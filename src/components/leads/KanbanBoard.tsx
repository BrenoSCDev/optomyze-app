/**
 * KANBAN BOARD COMPONENT
 * 
 * Main Kanban board layout with drag and drop functionality using @dnd-kit
 * 
 * ARCHITECTURE NOTES:
 * - Uses useDroppable for columns (drop targets only)
 * - Uses useDraggable for lead cards (draggable only, NOT sortable)
 * - Collision detection strictly validates column targets
 * - All IDs are string-based, never index-based
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import KanbanColumn from './KanbanColumn';
import { 
  Plus, 
  Filter, 
  Tag,
  UserPlus,
  Download,
  Loader2
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  CollisionDetection,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
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
import FunnelSettingsDropdown from './FunnelSettingsDropdown';
import { leadService } from '@/services/leadApi';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFunnelDisplaySettings } from '@/hooks/useFunnelDisplaySettings';
import { exportFunnelToExcel, prepareFunnelExportData } from '@/utils/funnelExport';

interface KanbanBoardProps {
  funnel: any;
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
  const { t } = useLanguage();
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<any>(null);
  const [overId, setOverId] = useState<string | null>(null);
  
  // Funnel display settings
  const { settings: displaySettings, setShowEstimatedValues, setShowAssignedUser } = useFunnelDisplaySettings();
  
  // Filter state
  const [activeFilters, setActiveFilters] = useState<any>({});
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  
  // Tag modal state
  const [tagModalState, setTagModalState] = useState({
    isOpen: false,
    selectedLead: null
  });

  // Handle export to Excel
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const exportData = prepareFunnelExportData(funnel);
      exportFunnelToExcel(exportData);
      toast.success(`Exported ${exportData.leads.length} leads to Excel`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export leads. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [funnel]);

  // DnD sensors with optimized settings for reliability
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Require 10px movement to start drag - prevents accidental drags
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Transform API data to kanban format
  const kanbanColumns = useMemo(() => {
    return funnel.stages
      ?.sort((a: any, b: any) => a.order - b.order)
      .map((stage: any) => ({
        id: stage.id.toString(),
        title: stage.name,
        description: stage.description,
        type: stage.type,
        stageColor: stage.color || '#FFFFFF',
        valueEstimated: stage.value_estimated || 0,
        currency: stage.currency || funnel.currency || 'USD',
        leads: stage.active_leads.map((lead: any) => ({
          id: lead.id.toString(),
          name: `${lead.first_name} ${lead.last_name ? lead.last_name : ""}`,
          email: lead.email,
          phone: lead.phone,
          company: lead.custom_fields?.industry || 'N/A',
          title: lead.custom_fields?.title || 'Contact',
          score: parseFloat(lead.ai_score || '0'),
          value: parseFloat(lead.value_estimated || lead.estimated_value || '0'),
          source: lead.source_platform || 'Direct',
          tags: Array.isArray(lead.tags) ? lead.tags : [],
          lastActivity: lead.updated_at ? timeAgo(lead.updated_at) : 'No activity',
          priority: lead.priority || 'medium',
          stage: stage.id.toString(),
          avatar: lead.platform_data?.profile_picture,
          notes: lead.notes,
          createdAt: lead.created_at,
          assignedTo: lead.assigned_to,
          assigned_user: lead.assigned_user,
          currency: lead.currency || 'USD',
          initialMessage: lead.initial_message,
          contactMethods: lead.contact_methods || [],
          preferredContact: lead.preferred_contact_method || 'email'
        }))
      })) || [];
  }, [funnel]);

  const [columns, setColumns] = useState(kanbanColumns);
  const [filteredColumns, setFilteredColumns] = useState(kanbanColumns);
  
  // Keep a ref to column IDs for collision detection (avoids stale closure)
  const columnIdsRef = useRef<Set<string>>(new Set());
  
  // Update columnIdsRef whenever columns change
  useEffect(() => {
    columnIdsRef.current = new Set(columns.map(col => col.id));
  }, [columns]);

  // Sync columns when funnel data changes
  useEffect(() => {
    setColumns(kanbanColumns);
  }, [kanbanColumns]);

  // Filter leads based on active filters
  const filterLeads = useCallback((leads: any[], filters: any) => {
    return leads.filter(lead => {
      if (filters.firstName && !lead.name.toLowerCase().includes(filters.firstName.toLowerCase())) {
        return false;
      }
      if (filters.lastName && !lead.name.toLowerCase().includes(filters.lastName.toLowerCase())) {
        return false;
      }
      if (filters.email && !lead.email?.toLowerCase().includes(filters.email.toLowerCase())) {
        return false;
      }
      if (filters.phone && !lead.phone?.includes(filters.phone.replace(/\D/g, ''))) {
        return false;
      }
      if (filters.ddi && !lead.phone?.startsWith(filters.ddi)) {
        return false;
      }
      if (filters.sourcePlatform && lead.source !== filters.sourcePlatform) {
        return false;
      }
      if (filters.stageId && lead.stage !== filters.stageId) {
        return false;
      }
      if (filters.scoreRange) {
        const [min, max] = filters.scoreRange;
        if (lead.score < min || lead.score > max) {
          return false;
        }
      }
      if (filters.valueRange) {
        const [min, max] = filters.valueRange;
        if (lead.value < min || lead.value > max) {
          return false;
        }
      }
      if (filters.tags && filters.tags.length > 0) {
        const leadTags = lead.tags.map((tag: any) => typeof tag === 'string' ? tag : tag.name);
        const hasMatchingTag = filters.tags.some((filterTag: string) => leadTags.includes(filterTag));
        if (!hasMatchingTag) {
          return false;
        }
      }
      return true;
    });
  }, []);

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
  }, [columns, activeFilters, filterLeads]);

  const handleFilterApply = (filters: any) => {
    setActiveFilters(filters);
  };

  const handleFilterClear = () => {
    setActiveFilters({});
  };
  
  const handleAddLead = useCallback((columnId: string) => {
    setSelectedStageId(columnId);
    setLeadDialogOpen(true);
  }, []);

  /**
   * COLLISION DETECTION STRATEGY
   * 
   * This is the critical function that determines which column a dragged card is over.
   * 
   * Strategy:
   * 1. Use pointerWithin for precise detection when pointer is clearly inside a column
   * 2. Fall back to rectIntersection for edge cases
   * 3. NEVER use closestCenter - it can pick wrong targets across screen sizes
   * 4. ONLY return collisions with valid column IDs - filter out lead card IDs
   * 5. If no valid column detected, return empty array (abort drop)
   */
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    const columnIds = columnIdsRef.current;
    
    // Helper to filter collisions to only valid columns
    const filterToColumns = (collisions: ReturnType<CollisionDetection>) => {
      return collisions.filter(collision => columnIds.has(collision.id as string));
    };
    
    // Strategy 1: pointerWithin - most accurate when pointer is inside a column
    const pointerCollisions = pointerWithin(args);
    const pointerColumnCollisions = filterToColumns(pointerCollisions);
    
    if (pointerColumnCollisions.length > 0) {
      // Return the first (highest priority) column collision
      return [pointerColumnCollisions[0]];
    }
    
    // Strategy 2: rectIntersection - for when dragging near edges
    const rectCollisions = rectIntersection(args);
    const rectColumnCollisions = filterToColumns(rectCollisions);
    
    if (rectColumnCollisions.length > 0) {
      // Sort by intersection ratio and return the best match
      return [rectColumnCollisions[0]];
    }
    
    // No valid column detected - return empty to prevent incorrect drops
    return [];
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const dragId = active.id as string;
    
    setActiveId(dragId);
    
    // Find the dragged lead from current columns state
    const lead = columns
      .flatMap(col => col.leads)
      .find(lead => lead.id === dragId);
    
    if (lead) {
      setDraggedLead(lead);
    }
  }, [columns]);

  // Handle drag over - track which column we're hovering
  const handleDragOver = useCallback((event: any) => {
    const { over } = event;
    
    if (over && columnIdsRef.current.has(over.id as string)) {
      setOverId(over.id as string);
    } else {
      setOverId(null);
    }
  }, []);

  // Handle drag end - the main logic for moving leads between stages
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Reset drag state immediately
    setActiveId(null);
    setDraggedLead(null);
    setOverId(null);
    
    // VALIDATION 1: Check we have both active and over
    if (!over || !active.id) {
      console.log('[DnD] No valid drop target');
      return;
    }

    const leadId = active.id as string;
    const targetId = over.id as string;
    
    // VALIDATION 2: Verify target is a valid column ID (not a lead ID)
    const isValidColumn = columns.some(col => col.id === targetId);
    if (!isValidColumn) {
      console.warn('[DnD] Drop target is not a valid column:', targetId);
      return;
    }
    
    const newStageId = targetId;

    // VALIDATION 3: Find current stage of the lead
    const currentStage = columns.find(col => 
      col.leads.some(lead => lead.id === leadId)
    );

    if (!currentStage) {
      console.warn('[DnD] Could not find current stage for lead:', leadId);
      return;
    }

    // VALIDATION 4: Don't process if dropping in same column
    if (currentStage.id === newStageId) {
      console.log('[DnD] Dropped in same column, no action needed');
      return;
    }

    const oldStageId = currentStage.id;
    const leadToMove = currentStage.leads.find(lead => lead.id === leadId);

    if (!leadToMove) {
      console.warn('[DnD] Could not find lead to move:', leadId);
      return;
    }

    // Get the lead value for updating stage estimated values
    const leadValue = leadToMove.value || 0;

    console.log('[DnD] Moving lead', { leadId, from: oldStageId, to: newStageId, value: leadValue });

    // Optimistic update - add to top of target column and update estimated values
    setColumns(prevColumns => {
      return prevColumns.map(col => {
        if (col.id === oldStageId) {
          return {
            ...col,
            leads: col.leads.filter(lead => lead.id !== leadId),
            valueEstimated: Math.max(0, (col.valueEstimated || 0) - leadValue)
          };
        }
        if (col.id === newStageId) {
          return {
            ...col,
            leads: [{ ...leadToMove, stage: newStageId }, ...col.leads],
            valueEstimated: (col.valueEstimated || 0) + leadValue
          };
        }
        return col;
      });
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
      console.error('[DnD] Error moving lead:', error);
      
      // Revert optimistic update
      setColumns(prevColumns => {
        return prevColumns.map(col => {
          if (col.id === newStageId) {
            return {
              ...col,
              leads: col.leads.filter(lead => lead.id !== leadId),
              valueEstimated: Math.max(0, (col.valueEstimated || 0) - leadValue)
            };
          }
          if (col.id === oldStageId) {
            return {
              ...col,
              leads: [...col.leads, leadToMove],
              valueEstimated: (col.valueEstimated || 0) + leadValue
            };
          }
          return col;
        });
      });

      toast.error('Failed to move lead. Please try again.');
    }
  }, [columns, onUpdateLeadStage]);

  // Handle drag cancel - reset state
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setDraggedLead(null);
    setOverId(null);
  }, []);

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
      assigned_user: updatedLead.assigned_user,
      currency: updatedLead.currency || 'USD',
      initialMessage: updatedLead.initial_message,
      contactMethods: updatedLead.contact_methods || [],
      preferredContact: updatedLead.preferred_contact_method || 'email'
    };

    setColumns(prevColumns => {
      return prevColumns.map(column => ({
        ...column,
        leads: column.leads.map(lead => 
          lead.id === leadId ? transformedLead : lead
        )
      }));
    });

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
              {funnel.stages?.reduce((total: number, stage: any) => total + (stage.active_leads?.length || 0), 0) || 0} {t('funnel.page.total-leads')}
            </Badge>
          </div>
          
          {/* Funnel Estimated Value */}
          {displaySettings.showEstimatedValues && funnel.value_estimated > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">{t('funnel.page.estimated-funnel-value')}</span>
              <Badge className="px-3 text-sm font-semibold">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: funnel.currency || 'USD' }).format(funnel.value_estimated)}
              </Badge>
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Settings Dropdown */}
          <FunnelSettingsDropdown
            showEstimatedValues={displaySettings.showEstimatedValues}
            showAssignedUser={displaySettings.showAssignedUser}
            onShowEstimatedValuesChange={setShowEstimatedValues}
            onShowAssignedUserChange={setShowAssignedUser}
          />
          
          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            className="glass-card border-white/20 hover:bg-white/10"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            {isExporting ? t('funnel.page.exporting') : t('funnel.page.export')}
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
              {t('funnel.page.create-tag')}
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
            {t('funnel.page.filters')}
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
            {t('funnel.page.create-lead')}
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <style>
      {`
        .kanban-board {
          max-width: 640px;
          overflow-x: auto;
        }

        @media (min-width: 768px) {
          .kanban-board {
            max-width: 768px;
          }
        }

        @media (min-width: 1024px) {
          .kanban-board {
            max-width: 1024px;
          }
        }

        @media (min-width: 1280px) {
          .kanban-board {
            max-width: 1200px;
          }
        }

        @media (min-width: 1536px) {
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
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
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
              overId={overId}
              stageValueEstimated={(column as any).valueEstimated}
              stageCurrency={(column as any).currency}
              showEstimatedValues={displaySettings.showEstimatedValues}
              showAssignedUser={displaySettings.showAssignedUser}
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
