/**
 * DASHBOARD LAYOUT PERSISTENCE HOOK
 * 
 * Manages customizable grid layout for the Periodic Performance dashboard.
 * Stores widget positions, sizes, visibility, and grid config in localStorage.
 */

import { useState, useCallback, useEffect } from 'react';

export interface WidgetLayout {
  id: string;
  order: number;
  colSpan: number; // 1 = normal, 2 = full row
  visible: boolean;
}

export type GridColumns = 1 | 2;

export interface DashboardLayoutState {
  gridColumns: GridColumns;
  widgets: WidgetLayout[];
}

const STORAGE_KEY = 'optomyze-dashboard-layout';

const DEFAULT_WIDGETS: WidgetLayout[] = [
  { id: 'kpi-row-1', order: 0, colSpan: 2, visible: true },
  { id: 'kpi-row-2', order: 1, colSpan: 2, visible: true },
  { id: 'leads-by-funnel', order: 2, colSpan: 1, visible: true },
  { id: 'deals-stages', order: 3, colSpan: 1, visible: true },
  { id: 'lead-breakdown', order: 4, colSpan: 1, visible: true },
  { id: 'estimated-vs-closed', order: 5, colSpan: 1, visible: true },
  { id: 'products-sales', order: 6, colSpan: 1, visible: true },
  { id: 'agents-sales', order: 7, colSpan: 1, visible: true },
];

const DEFAULT_STATE: DashboardLayoutState = {
  gridColumns: 2,
  widgets: DEFAULT_WIDGETS,
};

export const WIDGET_LABELS: Record<string, string> = {
  'kpi-row-1': 'Lead KPIs',
  'kpi-row-2': 'Deal KPIs',
  'leads-by-funnel': 'Leads by Funnel',
  'deals-stages': 'Deals Stages',
  'lead-breakdown': 'Lead Pipeline Breakdown',
  'estimated-vs-closed': 'Estimated vs Closed',
  'products-sales': 'Products: Sales x Revenue',
  'agents-sales': 'Agents: Sales x Revenue',
};

function loadState(): DashboardLayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as DashboardLayoutState;
    // Ensure all default widgets exist (in case new ones were added)
    const existingIds = new Set(parsed.widgets.map(w => w.id));
    const merged = [...parsed.widgets];
    for (const dw of DEFAULT_WIDGETS) {
      if (!existingIds.has(dw.id)) {
        merged.push({ ...dw, order: merged.length });
      }
    }
    return { ...parsed, widgets: merged };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: DashboardLayoutState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // silent fail
  }
}

export function useDashboardLayout() {
  const [state, setState] = useState<DashboardLayoutState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setGridColumns = useCallback((cols: GridColumns) => {
    setState(prev => ({ ...prev, gridColumns: cols }));
  }, []);

  const reorderWidgets = useCallback((orderedIds: string[]) => {
    setState(prev => {
      const widgetMap = new Map(prev.widgets.map(w => [w.id, w]));
      const reordered = orderedIds.map((id, index) => {
        const existing = widgetMap.get(id);
        return existing ? { ...existing, order: index } : { id, order: index, colSpan: 1, visible: true };
      });
      // Add any widgets not in the new order
      for (const w of prev.widgets) {
        if (!orderedIds.includes(w.id)) {
          reordered.push({ ...w, order: reordered.length });
        }
      }
      return { ...prev, widgets: reordered };
    });
  }, []);

  const toggleWidgetVisibility = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w),
    }));
  }, []);

  const setWidgetSpan = useCallback((id: string, colSpan: number) => {
    setState(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === id ? { ...w, colSpan } : w),
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const sortedWidgets = [...state.widgets].sort((a, b) => a.order - b.order);

  return {
    gridColumns: state.gridColumns,
    widgets: sortedWidgets,
    setGridColumns,
    reorderWidgets,
    toggleWidgetVisibility,
    setWidgetSpan,
    resetLayout,
  };
}
