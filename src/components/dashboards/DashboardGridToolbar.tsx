/**
 * DASHBOARD GRID TOOLBAR
 * 
 * Controls for customizing the dashboard layout:
 * - Grid column selector (1x1, 2x2, 3x3)
 * - Edit mode toggle for drag & drop
 * - Widget visibility toggles
 * - Reset to defaults
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, Columns2, Square, Settings2, RotateCcw, Eye, EyeOff, GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type GridColumns, type WidgetLayout, WIDGET_LABELS } from '@/hooks/useDashboardLayout';

interface DashboardGridToolbarProps {
  gridColumns: GridColumns;
  widgets: WidgetLayout[];
  editMode: boolean;
  onSetGridColumns: (cols: GridColumns) => void;
  onToggleEditMode: () => void;
  onToggleVisibility: (id: string) => void;
  onResetLayout: () => void;
  isErpModule?: boolean;
}

const GRID_OPTIONS: { value: GridColumns; label: string; icon: React.ReactNode }[] = [
  { value: 1, label: '1 Column', icon: <Square className="w-4 h-4" /> },
  { value: 2, label: '2 Columns', icon: <Columns2 className="w-4 h-4" /> },
];

const DashboardGridToolbar = ({
  gridColumns, widgets, editMode, onSetGridColumns, onToggleEditMode, onToggleVisibility, onResetLayout, isErpModule,
}: DashboardGridToolbarProps) => {
  const filteredWidgets = isErpModule
    ? widgets.filter(w => !['deals-stages', 'estimated-vs-closed'].includes(w.id))
    : widgets;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        {/* Grid columns selector */}
        <div className="flex items-center gap-0.5 p-0.5 bg-surface-2 rounded-md border border-border">
          {GRID_OPTIONS.map(opt => (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSetGridColumns(opt.value)}
                  className={`p-1.5 rounded transition-colors ${
                    gridColumns === opt.value
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-2'
                  }`}
                >
                  {opt.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{opt.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Edit mode toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editMode ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={onToggleEditMode}
            >
              {editMode ? <GripVertical className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {editMode ? 'Exit edit mode' : 'Customize layout'}
          </TooltipContent>
        </Tooltip>

        {/* Widget visibility & reset */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings2 className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Widget settings</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Toggle Widgets</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {filteredWidgets.map(w => (
              <DropdownMenuItem
                key={w.id}
                onClick={(e) => { e.preventDefault(); onToggleVisibility(w.id); }}
                className="flex items-center gap-2 cursor-pointer"
              >
                {w.visible ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className={w.visible ? '' : 'text-muted-foreground'}>{WIDGET_LABELS[w.id] || w.id}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onResetLayout} className="flex items-center gap-2 cursor-pointer text-destructive">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Default
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
};

export default DashboardGridToolbar;
