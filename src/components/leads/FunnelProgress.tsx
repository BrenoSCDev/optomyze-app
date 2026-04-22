/**
 * FUNNEL PROGRESS COMPONENT
 * 
 * Displays the lead's current position in the sales funnel
 * with a visual progress indicator
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';

interface FunnelStage {
  id: number;
  funnel_id: number;
  name: string;
  order: number;
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

interface FunnelProgressProps {
  stage: Stage | null | undefined;
}

const FunnelProgress: React.FC<FunnelProgressProps> = ({ stage }) => {
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
          
          return (
            <div 
              key={s.id} 
              className="flex flex-col items-center flex-1"
              title={s.name}
            >
              <div className={`
                w-5 h-5 rounded-full flex items-center justify-center transition-all
                ${isCompleted 
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                  : isCurrent 
                    ? 'bg-primary/20 text-primary ring-2 ring-primary/30' 
                    : 'bg-muted text-muted-foreground'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Circle className={`w-2.5 h-2.5 ${isCurrent ? 'fill-primary' : ''}`} />
                )}
              </div>
              <span className={`
                text-[10px] mt-1 truncate max-w-[70px] text-center
                ${isCurrent ? 'text-primary font-medium' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/70'}
              `}>
                {s.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FunnelProgress;
