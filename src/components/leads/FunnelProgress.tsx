/**
 * FUNNEL PROGRESS COMPONENT
 *
 * Displays the lead's current position in the sales funnel
 * with a visual, interactive progress indicator. Clicking a stage
 * triggers a real stage transition (subject to entry requirements).
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle2, Circle, Loader2, ArrowRight, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { StageEntryRequirement } from '@/services/funnelSettingsApi';

interface FunnelStage {
  id: number;
  funnel_id: number;
  name: string;
  order: number;
  description?: string | null;
  color?: string;
  type?: string;
  entry_requirement?: StageEntryRequirement | null;
}

interface Funnel {
  id: number;
  name: string;
  stages: FunnelStage[];
}

interface Stage {
  id: number;
  name: string;
  funnel_id: number;
  order: number;
  funnel?: Funnel;
}

interface LeadRequirementContext {
  email?: string | null;
  phone?: string | null;
  assigned_user?: { id: number } | null;
  products?: unknown[] | null;
  sales?: unknown[] | null;
  updated_at?: string | null;
}

interface FunnelProgressProps {
  stage: Stage | null | undefined;
  onStageClick?: (stage: FunnelStage) => void;
  movingStageId?: number | null;
  lead?: LeadRequirementContext | null;
}

const REQUIREMENT_LABEL_KEYS: Record<keyof StageEntryRequirement, string> = {
  require_assigned_owner: 'settings.funnels.require-owner',
  require_contact_email: 'settings.funnels.require-email',
  require_phone_number: 'settings.funnels.require-phone',
  require_at_least_one_product: 'settings.funnels.require-product',
  require_deal_value: 'settings.funnels.require-deal-value',
  require_recent_activity: 'settings.funnels.require-activity',
};

const RECENT_ACTIVITY_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const getUnmetRequirementKeys = (
  entryRequirement: StageEntryRequirement | null | undefined,
  lead: LeadRequirementContext | null | undefined
): string[] => {
  if (!entryRequirement || !lead) return [];

  const unmet: string[] = [];

  if (entryRequirement.require_assigned_owner && !lead.assigned_user) {
    unmet.push(REQUIREMENT_LABEL_KEYS.require_assigned_owner);
  }
  if (entryRequirement.require_contact_email && !lead.email) {
    unmet.push(REQUIREMENT_LABEL_KEYS.require_contact_email);
  }
  if (entryRequirement.require_phone_number && !lead.phone) {
    unmet.push(REQUIREMENT_LABEL_KEYS.require_phone_number);
  }
  if (entryRequirement.require_at_least_one_product && !(lead.products && lead.products.length > 0)) {
    unmet.push(REQUIREMENT_LABEL_KEYS.require_at_least_one_product);
  }
  if (entryRequirement.require_deal_value && !(lead.sales && lead.sales.length > 0)) {
    unmet.push(REQUIREMENT_LABEL_KEYS.require_deal_value);
  }
  if (entryRequirement.require_recent_activity && lead.updated_at) {
    const updatedAt = new Date(lead.updated_at).getTime();
    if (Number.isFinite(updatedAt) && Date.now() - updatedAt > RECENT_ACTIVITY_WINDOW_MS) {
      unmet.push(REQUIREMENT_LABEL_KEYS.require_recent_activity);
    }
  }

  return unmet;
};

const FunnelProgress: React.FC<FunnelProgressProps> = ({ stage, onStageClick, movingStageId, lead }) => {
  const { t } = useLanguage();

  if (!stage?.funnel?.stages || stage.funnel.stages.length === 0) {
    return null;
  }

  const funnel = stage.funnel;
  const stages = [...funnel.stages].sort((a, b) => a.order - b.order);
  const rawStageIndex = stages.findIndex(s => s.id === stage.id);
  const currentStageIndex = rawStageIndex >= 0 ? rawStageIndex : 0;
  const totalStages = stages.length;

  // Calculate progress percentage based on stage position
  // For N stages, each stage represents (100 / N)% of the bar
  // Current progress = (currentStageIndex + 1) / totalStages * 100
  const progressPercentage = ((currentStageIndex + 1) / totalStages) * 100;

  const isMoving = !!movingStageId;

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-medium text-foreground">{funnel.name}</h4>
          <p className="text-xs text-muted-foreground">
            {t('lead-details.current-stage')}: <span className="text-primary font-medium">{stage.name}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">
            {currentStageIndex + 1} / {totalStages}
          </span>
        </div>
      </div>

      {/* Progress Bar (full width) */}
      <div className="mb-3 bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Stage Indicators */}
      <div className="flex items-center justify-between">
        {stages.map((s, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isClickable = !!onStageClick && !isCurrent && !isMoving;
          const unmetRequirements = isCurrent ? [] : getUnmetRequirementKeys(s.entry_requirement, lead);

          return (
            <Tooltip key={s.id} delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => isClickable && onStageClick?.(s)}
                  disabled={!onStageClick || isCurrent || isMoving}
                  className={`flex flex-col items-center flex-1 bg-transparent border-0 p-0 ${
                    isClickable ? 'cursor-pointer' : isMoving ? 'cursor-wait' : 'cursor-default'
                  } ${isMoving && movingStageId !== s.id ? 'opacity-50' : ''}`}
                >
                  <div className={`
                    w-5 h-5 rounded-full flex items-center justify-center transition-all
                    ${isCompleted
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                      : isCurrent
                        ? 'bg-primary/20 text-primary ring-2 ring-primary/30'
                        : 'bg-muted text-muted-foreground'
                    }
                    ${isClickable ? 'hover:ring-2 hover:ring-primary/40 hover:scale-110' : ''}
                  `}>
                    {movingStageId === s.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Circle className={`w-2.5 h-2.5 ${isCurrent ? 'fill-primary' : ''}`} />
                    )}
                  </div>
                  <span className={`
                    text-[10px] mt-1 truncate max-w-[70px] text-center
                    ${isCurrent ? 'text-primary font-medium' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/70'}
                    ${isClickable ? 'group-hover:text-primary' : ''}
                  `}>
                    {s.name}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{s.name}</p>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                        {t('lead-details.current-stage')}
                      </Badge>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  )}
                  {!isCurrent && (
                    <div className="flex items-center gap-1 text-xs font-medium text-primary pt-1">
                      <ArrowRight className="w-3 h-3 shrink-0" />
                      <span>{t('lead-details.move-to-stage')} "{s.name}"</span>
                    </div>
                  )}
                  {unmetRequirements.length > 0 && (
                    <div className="pt-1.5 mt-1 border-t border-border space-y-1">
                      <p className="text-[10px] font-medium text-amber-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {t('lead-details.stage-requirements-warning')}
                      </p>
                      <ul className="text-[10px] text-muted-foreground space-y-0.5 list-disc pl-3.5">
                        {unmetRequirements.map((labelKey) => (
                          <li key={labelKey}>{t(labelKey)}</li>
                        ))}
                      </ul>
                    </div>
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

export default FunnelProgress;
