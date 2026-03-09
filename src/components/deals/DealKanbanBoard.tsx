/**
 * DEAL KANBAN BOARD COMPONENT
 * 
 * Main board layout for deal funnels with Kanban + Table views,
 * drag-and-drop, filters, refresh, and deal creation.
 * 
 * Architecturally separated from sales funnel KanbanBoard.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { List, DollarSign, Loader2 as ExportLoader, Tags } from 'lucide-react';
import { TbLayoutKanbanFilled } from 'react-icons/tb';
import DealSettingsDropdown from './DealSettingsDropdown';
import { useDealDisplaySettings } from '@/hooks/useDealDisplaySettings';
import { exportDealFunnelToExcel, prepareDealFunnelExportData } from '@/utils/dealFunnelExport';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DealKanbanColumn from './DealKanbanColumn';
import DealTableView from './DealTableView';
import DealCard from './DealCard';
import { DealCreationDialog } from './DealCreationDialog';
import { DealFilterDialog } from './DealFilterDialog';
import DealPreviewModal from './DealPreviewModal';
import { TagCreationDialog } from '@/components/leads/TagCreationDialog';
import DealTagManagementModal from './DealTagManagementModal';
import {
  Plus, Filter, Download, Loader2, RefreshCw,
} from 'lucide-react';
import {
  DndContext, DragOverlay, useSensor, useSensors, PointerSensor, KeyboardSensor,
  DragStartEvent, DragEndEvent, CollisionDetection, pointerWithin, rectIntersection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { dealFunnelService } from '@/services/dealFunnelApi';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';

interface DealKanbanBoardProps {
  funnel: any;
  availableTags: any[];
  onRefresh?: () => void;
}

const DealKanbanBoard = ({ funnel, availableTags, onRefresh }: DealKanbanBoardProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currencyCode: companyCurrency } = useCurrency();

  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<any>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [isExporting, setIsExporting] = useState(false);
  const { settings: displaySettings, setShowProducts, setShowCharges } = useDealDisplaySettings();
  const [previewDealId, setPreviewDealId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedDealForTag, setSelectedDealForTag] = useState<any>(null);

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>(() => {
    return (localStorage.getItem('deal_funnel_view_mode') as 'kanban' | 'table') || 'kanban';
  });

  const handleViewModeChange = useCallback((mode: 'kanban' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('deal_funnel_view_mode', mode);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Transform API data to column format (deals, not leads)
  const kanbanColumns = useMemo(() => {
    return funnel.stages
      ?.sort((a: any, b: any) => a.order - b.order)
      .map((stage: any) => ({
        id: stage.id.toString(),
        title: stage.name,
        description: stage.description,
        type: stage.type,
        stageColor: stage.color || '#FFFFFF',
        currency: funnel.currency || companyCurrency,
        totalValue: (stage.deals || []).reduce((sum: number, d: any) => sum + (d.final_total || 0), 0),
        deals: (stage.deals || []).map((deal: any) => ({
          ...deal,
          id: deal.id.toString(),
        })),
      })) || [];
  }, [funnel]);

  const [columns, setColumns] = useState(kanbanColumns);
  const [filteredColumns, setFilteredColumns] = useState(kanbanColumns);

  const columnIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    columnIdsRef.current = new Set(columns.map(col => col.id));
  }, [columns]);

  useEffect(() => {
    setColumns(kanbanColumns);
  }, [kanbanColumns]);

  // Filter deals
  const filterDeals = useCallback((deals: any[], filters: any) => {
    return deals.filter(deal => {
      if (filters.dealName && !deal.name?.toLowerCase().includes(filters.dealName.toLowerCase())) return false;
      if (filters.leadName) {
        const leadName = deal.lead ? `${deal.lead.first_name} ${deal.lead.last_name || ''}` : '';
        if (!leadName.toLowerCase().includes(filters.leadName.toLowerCase())) return false;
      }
      if (filters.minValue && (deal.final_total || 0) < filters.minValue) return false;
      if (filters.maxValue && (deal.final_total || 0) > filters.maxValue) return false;
      return true;
    });
  }, []);

  useEffect(() => {
    if (Object.keys(activeFilters).length === 0) {
      setFilteredColumns(columns);
    } else {
      // Stage filter
      let cols = columns;
      if (activeFilters.stageId) {
        cols = cols.filter(c => c.id === activeFilters.stageId);
      }
      setFilteredColumns(cols.map(col => ({ ...col, deals: filterDeals(col.deals, activeFilters) })));
    }
  }, [columns, activeFilters, filterDeals]);

  const handleAddDeal = useCallback((columnId: string) => {
    setSelectedStageId(columnId);
    setDealDialogOpen(true);
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const exportData = prepareDealFunnelExportData(funnel);
      exportDealFunnelToExcel(exportData);
      toast.success(`Exported ${exportData.deals.length} deals to Excel`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export deals. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [funnel]);

  // Collision detection (same strategy as sales kanban)
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    const columnIds = columnIdsRef.current;
    const filterToColumns = (collisions: any[]) => collisions.filter(c => columnIds.has(c.id as string));

    const pointerCollisions = filterToColumns(pointerWithin(args));
    if (pointerCollisions.length > 0) return [pointerCollisions[0]];

    const rectCollisions = filterToColumns(rectIntersection(args));
    if (rectCollisions.length > 0) return [rectCollisions[0]];

    return [];
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const dragId = event.active.id as string;
    setActiveId(dragId);
    const deal = columns.flatMap(col => col.deals).find(d => d.id === dragId);
    if (deal) setDraggedDeal(deal);
  }, [columns]);

  const handleDragOver = useCallback((event: any) => {
    const { over } = event;
    if (over && columnIdsRef.current.has(over.id as string)) {
      setOverId(over.id as string);
    } else {
      setOverId(null);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedDeal(null);
    setOverId(null);

    if (!over || !active.id) return;

    const dealId = active.id as string;
    const targetId = over.id as string;

    if (!columns.some(col => col.id === targetId)) return;

    const currentStage = columns.find(col => col.deals.some((d: any) => d.id === dealId));
    if (!currentStage || currentStage.id === targetId) return;

    const dealToMove = currentStage.deals.find((d: any) => d.id === dealId);
    if (!dealToMove) return;

    const oldStageId = currentStage.id;
    const dealValue = dealToMove.final_total || 0;

    // Optimistic update
    setColumns(prev => prev.map(col => {
      if (col.id === oldStageId) {
        return {
          ...col,
          deals: col.deals.filter((d: any) => d.id !== dealId),
          totalValue: Math.max(0, (col.totalValue || 0) - dealValue),
        };
      }
      if (col.id === targetId) {
        return {
          ...col,
          deals: [{ ...dealToMove, stage_id: parseInt(targetId) }, ...col.deals],
          totalValue: (col.totalValue || 0) + dealValue,
        };
      }
      return col;
    }));

    try {
      await dealFunnelService.moveDealToStage(dealId, targetId);
      toast.success('Deal moved successfully');
    } catch {
      // Revert
      setColumns(prev => prev.map(col => {
        if (col.id === targetId) {
          return {
            ...col,
            deals: col.deals.filter((d: any) => d.id !== dealId),
            totalValue: Math.max(0, (col.totalValue || 0) - dealValue),
          };
        }
        if (col.id === oldStageId) {
          return {
            ...col,
            deals: [...col.deals, dealToMove],
            totalValue: (col.totalValue || 0) + dealValue,
          };
        }
        return col;
      }));
      toast.error('Failed to move deal');
    }
  }, [columns]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setDraggedDeal(null);
    setOverId(null);
  }, []);

  const handleDealClick = (dealId: string) => {
    setPreviewDealId(dealId);
    setPreviewOpen(true);
  };

  const totalDeals = funnel.stages?.reduce((sum: number, s: any) => sum + (s.deals?.length || 0), 0) || 0;
  const totalSalesValue = useMemo(() => {
    return (funnel.stages || []).reduce((sum: number, s: any) => {
      return sum + (s.deals || []).reduce((dSum: number, d: any) => dSum + (d.final_total || 0), 0);
    }, 0);
  }, [funnel]);
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: funnel.currency || companyCurrency }).format(value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-medium">{funnel.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-4">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">{funnel.name}</h1>
            <Badge variant="secondary" className="bg-deal/15 text-deal border-deal/30 px-3 py-1">
              {totalDeals} {totalDeals === 1 ? 'Deal' : 'Deals'}
            </Badge>
          </div>

          {/* Description & Total Sales Value KPI */}
          {funnel.description && (
            <p className="text-sm text-muted-foreground">{funnel.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">Total Sales Value:</span>
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-3 text-sm font-semibold flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {formatCurrency(totalSalesValue)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {/* View Switcher */}
          <div className="flex items-center rounded-md border border-deal/30 overflow-hidden">
            <Button
              variant="ghost" size="sm"
              className={`rounded-none h-9 px-2.5 ${viewMode === 'kanban' ? 'bg-deal/20 text-deal' : 'text-muted-foreground hover:text-deal'}`}
              onClick={() => handleViewModeChange('kanban')}
            >
              <TbLayoutKanbanFilled className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="sm"
              className={`rounded-none h-9 px-2.5 border-l border-deal/30 ${viewMode === 'table' ? 'bg-deal/20 text-deal' : 'text-muted-foreground hover:text-deal'}`}
              onClick={() => handleViewModeChange('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Refresh */}
          <Button
            variant="outline" size="sm"
            className="deal-glass-card border-deal/20 hover:bg-deal/10"
            onClick={async () => {
              if (onRefresh) {
                setIsRefreshing(true);
                try { await onRefresh(); } finally { setIsRefreshing(false); }
              }
            }}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 sm:mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </Button>

          {/* Settings Dropdown */}
          <DealSettingsDropdown
            showProducts={displaySettings.showProducts}
            showCharges={displaySettings.showCharges}
            onShowProductsChange={setShowProducts}
            onShowChargesChange={setShowCharges}
          />

          {/* Export Button */}
          <Button
            variant="outline" size="sm"
            className="deal-glass-card border-deal/20 hover:bg-deal/10"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <ExportLoader className="h-4 w-4 sm:mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 sm:mr-1" />
            )}
            <span className="hidden sm:inline">{isExporting ? t('funnel.page.exporting') : t('funnel.page.export')}</span>
          </Button>

          {/* Create Tag */}
          <Button
            variant="outline" size="sm"
            className="deal-glass-card border-deal/20 hover:bg-deal/10"
            onClick={() => setTagDialogOpen(true)}
          >
            <Tags className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Create Tag</span>
          </Button>

          <Button
            variant="outline" size="sm"
            className={`deal-glass-card border-deal/20 hover:bg-deal/10 ${
              Object.keys(activeFilters).length > 0 ? 'ring-2 ring-deal/50 bg-deal/10' : ''
            }`}
            onClick={() => setFilterDialogOpen(true)}
          >
            <Filter className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{t('funnel.page.filters')}</span>
            {Object.keys(activeFilters).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-deal text-deal-foreground rounded-full">
                {Object.keys(activeFilters).length}
              </span>
            )}
          </Button>

          {/* Create Deal */}
          <Button
            size="sm"
            onClick={() => {
              setSelectedStageId('');
              setDealDialogOpen(true);
            }}
            className="bg-gradient-deal hover:opacity-90 text-white font-medium"
          >
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Create Deal</span>
          </Button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'kanban' ? (
        <>
          <style>{`
            .deal-kanban-board { max-width: 640px; overflow-x: auto; }
            @media (min-width: 768px) { .deal-kanban-board { max-width: 768px; } }
            @media (min-width: 1024px) { .deal-kanban-board { max-width: 1024px; } }
            @media (min-width: 1280px) { .deal-kanban-board { max-width: 1200px; } }
            @media (min-width: 1536px) { .deal-kanban-board { max-width: 1600px; } }
          `}</style>

          <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex gap-6 pb-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 deal-kanban-board">
              {filteredColumns.map((column, index) => (
              <DealKanbanColumn
                  key={column.id}
                  column={column}
                  index={index}
                  onAddDeal={handleAddDeal}
                  onDealClick={handleDealClick}
                  onTagClick={(deal) => { setSelectedDealForTag(deal); setTagModalOpen(true); }}
                  activeId={activeId}
                  overId={overId}
                  showProducts={displaySettings.showProducts}
                  showCharges={displaySettings.showCharges}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
              {activeId && draggedDeal ? (
                <div className="relative transform rotate-2 scale-105 transition-all duration-200 pointer-events-none">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-lg transform scale-110" />
                  <div className="relative glass-card border-2 border-primary/50 shadow-2xl">
                    <DealCard deal={draggedDeal} isDragging={false} onDealClick={handleDealClick} showProducts={displaySettings.showProducts} showCharges={displaySettings.showCharges} />
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      ) : (
        <DealTableView
          columns={filteredColumns}
          funnel={funnel}
          onAddDeal={handleAddDeal}
          onDealClick={handleDealClick}
          setColumns={setColumns}
          showProducts={displaySettings.showProducts}
          showCharges={displaySettings.showCharges}
        />
      )}

      {/* Deal Creation Dialog */}
      <DealCreationDialog
        isOpen={dealDialogOpen}
        onClose={() => { setDealDialogOpen(false); setSelectedStageId(''); }}
        funnelId={funnel.id?.toString() || ''}
        stages={funnel.stages || []}
        selectedStageId={selectedStageId}
        onDealCreated={() => {
          setDealDialogOpen(false);
          setSelectedStageId('');
          onRefresh?.();
        }}
      />

      {/* Deal Filter Dialog */}
      <DealFilterDialog
        isOpen={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        stages={funnel.stages || []}
        onFilterApply={setActiveFilters}
        onFilterClear={() => setActiveFilters({})}
      />

      {/* Deal Preview Modal */}
      <DealPreviewModal
        isOpen={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewDealId(null); }}
        dealId={previewDealId}
      />

      {/* Create Tag Dialog */}
      <TagCreationDialog
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
        onTagCreated={() => onRefresh?.()}
      />

      {/* Deal Tag Management Modal */}
      <DealTagManagementModal
        isOpen={tagModalOpen}
        onClose={() => { setTagModalOpen(false); setSelectedDealForTag(null); }}
        deal={selectedDealForTag}
        availableTags={availableTags}
        onTagsUpdated={() => onRefresh?.()}
      />
    </div>
  );
};

export default DealKanbanBoard;
