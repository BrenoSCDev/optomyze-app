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
import { List, AlertTriangle, Users, DollarSign } from 'lucide-react';
import { TbLayoutKanbanFilled } from "react-icons/tb";
import FunnelTableView from './FunnelTableView';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import KanbanColumn from './KanbanColumn';
import { 
  Plus, 
  Filter, 
  Tag,
  UserPlus,
  Download,
  Loader2,
  RefreshCw
} from 'lucide-react';
import {
  DndContext, DragOverlay, DragStartEvent, DragEndEvent,
} from '@dnd-kit/core';
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
import {
  KANBAN_DROP_ANIMATION, KanbanDragPreview, kanbanCollisionDetection, useKanbanSensors,
} from '@/components/dnd/kanbanDnd';
import { useCurrency } from '@/hooks/useCurrency';
import { useFunnelDisplaySettings } from '@/hooks/useFunnelDisplaySettings';
import { funnelService } from '@/services/funnelApi';
import { LeadFilters, countActiveFilters, leadFiltersToParams } from '@/lib/leadFilters';
import { StageSort } from '@/types/leads';
import { exportFunnelToExcel, prepareFunnelExportData } from '@/utils/funnelExport';
import LeadPreviewModal from './LeadPreviewModal';
import LostReasonModal from './LostReasonModal';
import AssignUserModal, { CompanyUser } from './AssignUserModal';
import MoveFunnelModal from './MoveFunnelModal';
import { userApi } from '@/services/userApi';
import { setContactArchived } from '@/services/contactApi';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  onRefresh?: () => void;
  /** Filters are owned by the page and resolved by the API — see useFunnelData. */
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  isFiltering?: boolean;
  onLoadMoreStage?: (stageId: string) => void;
  onStageSortChange?: (stageId: string, sort: StageSort) => void;
  stageSorts?: Record<string, StageSort>;
  stageLoading?: Record<string, boolean>;
}

const KanbanBoard = ({ funnel, availableTags, onCreateLead, onCreateTag, onOpenFilters, onUpdateLeadStage, onLeadCreated, onTagCreated, onTagsUpdated, onRefresh, filters, onFiltersChange, isFiltering, onLoadMoreStage, onStageSortChange, stageSorts, stageLoading }: KanbanBoardProps) => {
  const navigate = useNavigate();
  const { user, funnels: allFunnels } = useAuth();
  const { t } = useLanguage();
  const { currencyCode: companyCurrency } = useCurrency();
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<any>(null);
  const [lostReasonLeadId, setLostReasonLeadId] = useState<string | null>(null);
  const [entryErrors, setEntryErrors] = useState<{ stageName: string; errors: Array<{ field: string; message: string }> } | null>(null);
  
  // View mode state (persisted in localStorage)
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>(() => {
    return (localStorage.getItem('funnel_view_mode') as 'kanban' | 'table') || 'kanban';
  });
  
  const handleViewModeChange = useCallback((mode: 'kanban' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('funnel_view_mode', mode);
  }, []);
  const [overId, setOverId] = useState<string | null>(null);
  
  // Funnel display settings
  const { settings: displaySettings, setShowEstimatedValues, setShowAssignedUser } = useFunnelDisplaySettings();

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  
  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Tag modal state
  const [tagModalState, setTagModalState] = useState({
    isOpen: false,
    selectedLead: null
  });

  // Lead preview modal state
  const [previewLeadId, setPreviewLeadId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Company users (for the Assign User action)
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);

  // Lead card "more actions" state
  const [assignUserTarget, setAssignUserTarget] = useState<any | null>(null);
  const [moveFunnelTarget, setMoveFunnelTarget] = useState<any | null>(null);
  const [deleteLeadTarget, setDeleteLeadTarget] = useState<any | null>(null);
  const [isDeletingLead, setIsDeletingLead] = useState(false);

  // Fetch company users once for the Assign User modal
  useEffect(() => {
    userApi.getUsers()
      .then(users => setCompanyUsers(users as unknown as CompanyUser[]))
      .catch(() => setCompanyUsers([]));
  }, []);

  // Funnels of the same type the current lead can be moved to
  const moveFunnelOptions = useMemo(() => {
    return (allFunnels || [])
      .filter((f: any) => f.is_active && f.type === funnel.type && Number(f.id) !== Number(funnel.id))
      .map((f: any) => ({ id: f.id, name: f.name }));
  }, [allFunnels, funnel.id, funnel.type]);

  /**
   * Export to Excel.
   *
   * The board only holds the pages that have been scrolled into view, so the
   * export refetches the funnel unpaginated (`per_page=all`) under the same
   * filters — otherwise it would quietly ship the first ten leads per stage.
   */
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const full = await funnelService.getFunnelData(funnel.id, {
        ...leadFiltersToParams(filters),
        per_page: 'all',
      });
      const exportData = prepareFunnelExportData(full?.funnel || funnel);
      exportFunnelToExcel(exportData);
      toast.success(`Exported ${exportData.leads.length} leads to Excel`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export leads. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [funnel, filters]);

  const sensors = useKanbanSensors();
  
  // Transform API data to kanban format. `total` is the stage's server-side
  // count, which is what the column header and the "load more" check go by —
  // `leads` only holds the pages fetched so far.
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
        currency: stage.currency || funnel.currency || companyCurrency,
        total: stage.leads_total ?? (stage.active_leads?.length || 0),
        hasMore: !!stage.leads_has_more,
        leads: (stage.active_leads || []).map((lead: any) => ({
          id: lead.id.toString(),
          name: `${lead.first_name} ${lead.last_name ? lead.last_name : ""}`,
          email: lead.email,
          phone: lead.phone,
          company: lead.custom_fields?.industry || 'N/A',
          title: lead.custom_fields?.title || 'Contact',
          score: parseFloat(lead.ai_score || '0'),
          value: parseFloat(lead.value_estimated || lead.estimated_value || '0'),
          source: lead.source_platform || 'other',
          tags: Array.isArray(lead.tags) ? lead.tags : [],
          lastActivity: lead.updated_at ? timeAgo(lead.updated_at) : 'No activity',
          priority: lead.priority || 'medium',
          stage: stage.id.toString(),
          avatar: lead.whatsapp_inbox_chat?.profile_pic_url || lead.platform_data?.profile_picture,
          avatarKey: lead.avatar_key,
          notes: lead.notes,
          createdAt: lead.created_at,
          assignedTo: lead.assigned_to,
          assigned_user: lead.assigned_user,
          currency: lead.currency || companyCurrency,
          initialMessage: lead.initial_message,
          contactMethods: lead.contact_methods || [],
          preferredContact: lead.preferred_contact_method || 'email'
        }))
      })) || [];
  }, [funnel]);

  const [columns, setColumns] = useState(kanbanColumns);

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

  const handleAddLead = useCallback((columnId: string) => {
    setSelectedStageId(columnId);
    setLeadDialogOpen(true);
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
    const targetColumn = columns.find(col => col.id === newStageId);
    const targetStageName = targetColumn?.title || 'this stage';

    /*
     * Optimistic move, then reconcile.
     *
     * This used to await the API before touching the columns, so the card sat
     * frozen in its old stage for the whole round trip and only jumped once the
     * server replied — the single biggest reason this board felt heavier than
     * the Tasks board. The move is applied immediately and rolled back if the
     * server refuses (entry requirements return 422).
     */
    const applyMove = (target: string) =>
      setColumns(prevColumns => prevColumns.map(col => {
        if (col.id === oldStageId) {
          return {
            ...col,
            leads: col.leads.filter(lead => lead.id !== leadId),
            valueEstimated: Math.max(0, (col.valueEstimated || 0) - leadValue),
          };
        }
        if (col.id === target) {
          return {
            ...col,
            leads: [{ ...leadToMove, stage: target }, ...col.leads],
            valueEstimated: (col.valueEstimated || 0) + leadValue,
          };
        }
        return col;
      }));

    const revertMove = () =>
      setColumns(prevColumns => prevColumns.map(col => {
        if (col.id === newStageId) {
          return {
            ...col,
            leads: col.leads.filter(lead => lead.id !== leadId),
            valueEstimated: Math.max(0, (col.valueEstimated || 0) - leadValue),
          };
        }
        if (col.id === oldStageId) {
          return {
            ...col,
            leads: [leadToMove, ...col.leads],
            valueEstimated: (col.valueEstimated || 0) + leadValue,
          };
        }
        return col;
      }));

    applyMove(newStageId);

    try {
      const response = await leadService.moveLeadToStage(leadId, newStageId);

      // Patch in the server's version of the row — the optimistic copy carried
      // the old name/stage fields.
      setColumns(prevColumns => prevColumns.map(col => (
        col.id === newStageId
          ? {
              ...col,
              leads: col.leads.map(lead => (
                lead.id === leadId
                  ? {
                      ...lead,
                      ...response.data,
                      id: response.data.id.toString(),
                      name: `${response.data.first_name} ${response.data.last_name || ''}`,
                      stage: response.data.stage_id.toString(),
                    }
                  : lead
              )),
            }
          : col
      )));

      toast.success('Lead moved successfully');

      // Check if we need to prompt for lost reason
      if (response.prompt_lost_reason) {
        setLostReasonLeadId(leadId);
      }

      // Notify parent component
      if (onUpdateLeadStage) {
        onUpdateLeadStage(leadId, newStageId, oldStageId);
      }
    } catch (error: any) {
      console.error('[DnD] Error moving lead:', error);
      revertMove();

      // Check for 422 entry requirement errors
      const responseData = error?.response?.data;
      if (error?.response?.status === 422 && responseData?.entry_requirement_errors?.length > 0) {
        setEntryErrors({
          stageName: targetStageName,
          errors: responseData.entry_requirement_errors,
        });
      } else {
        toast.error('Failed to move lead. Please try again.');
      }
    }
  }, [columns, onUpdateLeadStage]);

  // Handle drag cancel - reset state
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setDraggedLead(null);
    setOverId(null);
  }, []);

  // Handle tag icon click
  const handleTagClick = useCallback((lead: any) => {
    setTagModalState({
      isOpen: true,
      selectedLead: lead
    });
  }, []);

  // Handle tag modal close
  const handleTagModalClose = () => {
    setTagModalState({
      isOpen: false,
      selectedLead: null
    });
  };

  // Handle lead click to open preview modal
  const handleLeadClick = useCallback((leadId: string) => {
    setPreviewLeadId(leadId);
    setPreviewOpen(true);
  }, []);

  // Handle tags updated with API response data
  const handleTagsUpdated = (leadId: string, updatedLead: any) => {
    const updatedTags = Array.isArray(updatedLead.tags) ? updatedLead.tags : [];

    // Only merge the tags into the existing lead - the tags-update endpoint
    // doesn't return the full lead payload (e.g. assigned_user, value), so
    // rebuilding the whole card from it would wipe those fields out.
    setColumns(prevColumns => {
      return prevColumns.map(column => ({
        ...column,
        leads: column.leads.map(lead =>
          lead.id === leadId ? { ...lead, tags: updatedTags } : lead
        )
      }));
    });

    if (onTagsUpdated) {
      onTagsUpdated(leadId, updatedLead);
    }
  };

  // Remove a lead from all columns (used after delete / move to another funnel)
  const removeLeadFromColumns = (leadId: string) => {
    setColumns(prevColumns => prevColumns.map(col => ({
      ...col,
      leads: col.leads.filter((lead: any) => lead.id !== leadId)
    })));
  };

  // Handle delete lead click - open confirmation dialog
  /** Archive/unarchive from the board; the lead leaves the default view. */
  const handleArchiveLead = useCallback(async (lead: any) => {
    const next = lead.is_active !== false;
    try {
      await setContactArchived(Number(lead.id), next);
      onRefresh?.();
    } catch {
      // surfaced by the caller's own error handling on refresh
    }
  }, [onRefresh]);

  const handleDeleteLeadClick = useCallback((lead: any) => {
    setDeleteLeadTarget(lead);
  }, []);

  // Confirm lead deletion
  const handleConfirmDeleteLead = async () => {
    if (!deleteLeadTarget) return;
    try {
      setIsDeletingLead(true);
      await leadService.deleteLead(deleteLeadTarget.id);
      toast.success(t('lead-details.delete-lead-success'));
      removeLeadFromColumns(deleteLeadTarget.id);
      setDeleteLeadTarget(null);
      onRefresh?.();
    } catch {
      toast.error(t('lead-details.delete-lead-error'));
    } finally {
      setIsDeletingLead(false);
    }
  };

  // Handle assign user click - open assign user modal
  const handleAssignUserClick = useCallback((lead: any) => {
    setAssignUserTarget(lead);
  }, []);

  // Merge the newly assigned user into the lead card
  const handleUserAssigned = (userId: number, userName: string, userEmail: string) => {
    if (!assignUserTarget) return;
    const leadId = assignUserTarget.id;
    setColumns(prevColumns => prevColumns.map(col => ({
      ...col,
      leads: col.leads.map((lead: any) =>
        lead.id === leadId
          ? { ...lead, assignedTo: userId, assigned_user: { id: userId, name: userName, email: userEmail } }
          : lead
      )
    })));
  };

  // Handle move-to-funnel click - open move funnel modal
  const handleMoveFunnelClick = useCallback((lead: any) => {
    setMoveFunnelTarget(lead);
  }, []);

  // After a lead has been moved to a different funnel, remove it from this board
  const handleLeadMovedToFunnel = (leadId: string) => {
    removeLeadFromColumns(leadId);
    setMoveFunnelTarget(null);
    onRefresh?.();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Side */}
        <div className="space-y-2">
          
          {/* Title */}
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">{funnel.name}</h1>

          {/* Funnel Stats */}
          <div className="flex items-center gap-4 flex-wrap text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              {/* Server-side totals — the columns hold only the loaded pages. */}
              <span className="font-semibold text-foreground">
                {columns.reduce((total: number, column: any) => total + (column.total || 0), 0)}
              </span>
              <span>{t('funnel.page.total-leads')}</span>
            </div>
            {displaySettings.showEstimatedValues && funnel.value_estimated > 0 && (
              <>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: companyCurrency }).format(funnel.value_estimated)}
                  </span>
                  <span>{t('funnel.page.estimated-funnel-value')}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {/*
            View switcher. The group is height-matched to the size="sm" buttons
            beside it (h-8 = 32px): the border sits inside that height, and the
            buttons fill it, so the outer box lines up exactly. It previously
            forced h-9 on each button, which with the wrapper border came to
            38px against the neighbours' 32px.
          */}
          <div className="flex h-8 items-center overflow-hidden rounded-md border">
            <Button
              variant="ghost"
              size="sm"
              className={`h-full rounded-none px-2.5 ${viewMode === 'kanban' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-accent-foreground'}`}
              onClick={() => handleViewModeChange('kanban')}
              title={t('funnel.page.view-kanban') || 'Kanban'}
            >
              <TbLayoutKanbanFilled className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-full rounded-none border-l px-2.5 ${viewMode === 'table' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-accent-foreground'}`}
              onClick={() => handleViewModeChange('table')}
              title={t('funnel.page.view-table') || 'Table'}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            className="glass-card hover:bg-muted hover:text-foreground"
            onClick={async () => {
              if (onRefresh) {
                setIsRefreshing(true);
                try {
                  await onRefresh();
                } finally {
                  setIsRefreshing(false);
                }
              }
            }}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 sm:mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </Button>

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
            className="glass-card hover:bg-muted hover:text-foreground"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 sm:mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 sm:mr-1" />
            )}
            <span className="hidden sm:inline">{isExporting ? t('funnel.page.exporting') : t('funnel.page.export')}</span>
          </Button>
          
          {/* Create Tag Button - Hidden for Agent role */}
          {user?.role?.toLowerCase() !== 'agent' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTagDialogOpen(true)}
              className="glass-card hover:bg-muted dark:hover:bg-accent/10 hover:text-foreground"
            >
              <Tag className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t('funnel.page.create-tag')}</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterDialogOpen(true)}
            className={`glass-card  hover:bg-muted  hover:text-foreground ${
              activeFilterCount > 0 ? 'ring-2 ring-blue-400/50 bg-blue-500/10' : ''
            }`}
          >
            {isFiltering ? (
              <Loader2 className="h-4 w-4 sm:mr-1 animate-spin" />
            ) : (
              <Filter className="h-4 w-4 sm:mr-1" />
            )}
            <span className="hidden sm:inline">{t('funnel.page.filters')}</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
          
          <Button
            size="sm"
            onClick={() => {
              setSelectedStageId('');
              setLeadDialogOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{t('funnel.page.create-lead')}</span>
          </Button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'kanban' ? (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={kanbanCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
            <div className="flex gap-4 pb-4 min-w-max">
              {columns.map((column, index) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  index={index}
                  onAddLead={handleAddLead}
                  onTagClick={handleTagClick}
                  onLeadClick={handleLeadClick}
                  onDeleteLead={handleDeleteLeadClick}
                  onArchiveLead={handleArchiveLead}
                  onAssignUser={handleAssignUserClick}
                  onMoveFunnel={handleMoveFunnelClick}
                  activeId={activeId}
                  overId={overId}
                  stageValueEstimated={(column as any).valueEstimated}
                  stageCurrency={(column as any).currency}
                  showEstimatedValues={displaySettings.showEstimatedValues}
                  showAssignedUser={displaySettings.showAssignedUser}
                  onLoadMore={onLoadMoreStage}
                  isLoadingMore={!!stageLoading?.[column.id]}
                  sortOrder={stageSorts?.[column.id] || 'newest'}
                  onSortChange={onStageSortChange}
                />
              ))}
            </div>
            </div>

            <DragOverlay dropAnimation={KANBAN_DROP_ANIMATION}>
              {activeId && draggedLead ? (
                <KanbanDragPreview className="w-[23rem]">
                  <LeadCard
                    lead={draggedLead}
                    isDragging={false}
                    onTagClick={handleTagClick}
                    onLeadClick={handleLeadClick}
                  />
                </KanbanDragPreview>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      ) : (
        <FunnelTableView
          columns={columns}
          funnel={funnel}
          onAddLead={handleAddLead}
          onTagClick={handleTagClick}
          onLeadClick={handleLeadClick}
          onUpdateLeadStage={onUpdateLeadStage}
          showEstimatedValues={displaySettings.showEstimatedValues}
          showAssignedUser={displaySettings.showAssignedUser}
          setColumns={setColumns}
          onLoadMore={onLoadMoreStage}
          stageLoading={stageLoading}
        />
      )}


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
        filters={filters}
        onFilterApply={onFiltersChange}
        onFilterClear={() => onFiltersChange({})}
      />

      {/* Lead Preview Modal */}
      <LeadPreviewModal
        isOpen={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewLeadId(null); }}
        leadId={previewLeadId}
        onLeadDeleted={onRefresh}
      />
      {/* Lost Reason Modal */}
      <LostReasonModal
        isOpen={!!lostReasonLeadId}
        onClose={() => setLostReasonLeadId(null)}
        leadId={lostReasonLeadId || ''}
      />

      {/* Assign User Modal */}
      <AssignUserModal
        isOpen={!!assignUserTarget}
        onClose={() => setAssignUserTarget(null)}
        leadId={assignUserTarget ? Number(assignUserTarget.id) : 0}
        users={companyUsers}
        currentAssignedUserId={assignUserTarget?.assigned_user?.id}
        onUserAssigned={handleUserAssigned}
      />

      {/* Move Funnel Modal */}
      <MoveFunnelModal
        isOpen={!!moveFunnelTarget}
        onClose={() => setMoveFunnelTarget(null)}
        leadId={moveFunnelTarget?.id || ''}
        funnels={moveFunnelOptions}
        onMoved={handleLeadMovedToFunnel}
      />

      {/* Delete Lead Confirmation */}
      <AlertDialog open={!!deleteLeadTarget} onOpenChange={(open) => !open && setDeleteLeadTarget(null)}>
        <AlertDialogContent className="bg-background border-border z-[80]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('lead-details.delete-lead-title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('lead-details.delete-lead-confirmation')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingLead}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteLead}
              disabled={isDeletingLead}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingLead ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.deleting')}</> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Entry Requirement Errors Modal */}
      {entryErrors && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={() => setEntryErrors(null)} />
          <div className="relative glass-card p-6 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {t('leads.entry-requirements.title').replace('{stage}', entryErrors.stageName)}
              </h3>
            </div>
            <div className="space-y-2">
              {entryErrors.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{err.message}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setEntryErrors(null)} variant="outline">
                {t('common.ok') || 'OK'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
