/**
 * DEAL STAGE JOURNEY
 *
 * The deal's position in its pipeline, with every stage clickable to move it.
 * Deliberately the same shape and visual language as FunnelProgress on the
 * lead side, so the two detail views read as one product.
 *
 * Simpler than the lead version in one respect: stage entry requirements are a
 * lead concept and the deal move endpoint does not enforce them, so there is no
 * requirement checking or "blocked" state here.
 */

import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

export interface DealStage {
  id: number;
  name: string;
  order: number;
  color?: string | null;
  type?: string | null;
  description?: string | null;
}

interface DealStageJourneyProps {
  /** Every stage of the deal's funnel, in any order. */
  stages: DealStage[];
  currentStageId: number | null | undefined;
  funnelName?: string | null;
  /** Omit to render read-only. */
  onStageClick?: (stage: DealStage) => void;
  /** The stage currently being moved to, if any. */
  movingStageId?: number | null;
}

const DealStageJourney: React.FC<DealStageJourneyProps> = ({
  stages,
  currentStageId,
  funnelName,
  onStageClick,
  movingStageId,
}) => {
  const { t } = useLanguage();

  if (!stages || stages.length === 0) {
    return null;
  }

  const ordered = [...stages].sort((a, b) => a.order - b.order);
  const rawIndex = ordered.findIndex(s => s.id === currentStageId);
  // A deal whose stage was deleted, or which has none, reads as "not started"
  // rather than silently claiming to be in the first stage.
  const currentIndex = rawIndex >= 0 ? rawIndex : -1;
  const total = ordered.length;
  const isMoving = !!movingStageId;

  const progress = currentIndex >= 0 ? ((currentIndex + 1) / total) * 100 : 0;
  const current = currentIndex >= 0 ? ordered[currentIndex] : null;

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4 mb-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          {funnelName && <h4 className="truncate text-sm font-medium text-foreground">{funnelName}</h4>}
          <p className="text-xs text-muted-foreground">
            {t('deal-preview.current-stage')}:{' '}
            <span className="font-medium text-deal">{current?.name ?? '—'}</span>
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {currentIndex >= 0 ? currentIndex + 1 : 0} / {total}
        </span>
      </div>

      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-deal transition-[width] duration-base ease-standard"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        {ordered.map((stage, index) => {
          const isCompleted = currentIndex >= 0 && index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = !!onStageClick && !isCurrent && !isMoving;

          return (
            <Tooltip key={stage.id} delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => isClickable && onStageClick?.(stage)}
                  disabled={!isClickable}
                  aria-current={isCurrent}
                  className={`flex flex-1 flex-col items-center border-0 bg-transparent p-0 ${
                    isClickable ? 'cursor-pointer' : isMoving ? 'cursor-wait' : 'cursor-default'
                  } ${isMoving && movingStageId !== stage.id ? 'opacity-50' : ''}`}
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-fast ease-standard
                      ${isCompleted
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : isCurrent
                          ? 'bg-deal/20 text-deal ring-2 ring-deal/30'
                          : 'bg-muted text-muted-foreground'}
                      ${isClickable ? 'hover:ring-2 hover:ring-deal/40' : ''}`}
                  >
                    {movingStageId === stage.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className={`h-2.5 w-2.5 ${isCurrent ? 'fill-current' : ''}`} />
                    )}
                  </div>
                  <span
                    className={`mt-1 max-w-[70px] truncate text-center text-[10px]
                      ${isCurrent
                        ? 'font-medium text-deal'
                        : isCompleted
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/70'}`}
                  >
                    {stage.name}
                  </span>
                </button>
              </TooltipTrigger>

              <TooltipContent side="top" className="max-w-[220px]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{stage.name}</p>
                    {isCurrent && (
                      <Badge variant="secondary" className="h-4 shrink-0 px-1.5 py-0 text-[10px]">
                        {t('deal-preview.current-stage')}
                      </Badge>
                    )}
                  </div>
                  {stage.description && (
                    <p className="text-xs text-muted-foreground">{stage.description}</p>
                  )}
                  {isClickable && (
                    <p className="text-xs text-muted-foreground">{t('deal-preview.move-here')}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default DealStageJourney;
