/**
 * DASHBOARD WIDGET WRAPPER
 * 
 * Wraps each dashboard widget with:
 * - Drag handle (in edit mode)
 * - Expand/collapse controls
 * - Download as PNG
 * - Responsive grid span
 */

import { useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Maximize2, Minimize2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import html2canvas from 'html2canvas';
import { WIDGET_LABELS } from '@/hooks/useDashboardLayout';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardWidgetProps {
  id: string;
  colSpan: number;
  maxSpan: number;
  editMode: boolean;
  onSetSpan: (id: string, span: number) => void;
  children: React.ReactNode;
}

const DashboardWidget = ({ id, colSpan, maxSpan, editMode, onSetSpan, children }: DashboardWidgetProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id, disabled: !editMode });

  const effectiveSpan = isMobile ? 1 : Math.min(colSpan, maxSpan);

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? undefined,
    gridColumn: `span ${effectiveSpan} / span ${effectiveSpan}`,
    zIndex: isDragging ? 100 : undefined,
    position: 'relative',
  };

  const handleDownload = useCallback(async () => {
    if (!contentRef.current) return;
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#0f0f23',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${WIDGET_LABELS[id] || id}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to download widget:', err);
    }
  }, [id]);

  const isFullWidth = colSpan >= maxSpan;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group/widget transition-shadow duration-150 ${
        isDragging ? 'opacity-40' : ''
      } ${editMode ? 'ring-1 ring-primary/20 ring-dashed rounded-xl cursor-grab active:cursor-grabbing' : ''} ${
        !id.startsWith('kpi-') ? 'min-h-[420px]' : ''
      }`}
      {...attributes}
      {...(editMode ? listeners : {})}
    >
      {/* Edit mode drag label */}
      {editMode && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1 bg-card/90 backdrop-blur-sm border border-border rounded-full shadow-lg pointer-events-none">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium select-none">
            {WIDGET_LABELS[id] || id}
          </span>
        </div>
      )}

      {/* Hover controls (non-edit mode) */}
      {!editMode && (
        <TooltipProvider>
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1 opacity-0 group-hover/widget:opacity-100 transition-opacity duration-200">
            {maxSpan > 1 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card"
                    onClick={() => onSetSpan(id, isFullWidth ? 1 : maxSpan)}
                  >
                    {isFullWidth ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isFullWidth ? 'Collapse' : 'Expand full width'}
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card"
                  onClick={handleDownload}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Download as PNG</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )}

      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default DashboardWidget;
