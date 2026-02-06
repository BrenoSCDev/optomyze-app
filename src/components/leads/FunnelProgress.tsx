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
  const currentStageIndex = stages.findIndex(s => s.id === stage.id);
  const totalStages = stages.length;
  
  // Calculate progress percentage (0 to 100)
  const progressPercentage = totalStages > 1 
    ? ((currentStageIndex) / (totalStages - 1)) * 100 
    : 100;

  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-medium text-white">{funnel.name}</h4>
          <p className="text-xs text-gray-400">
            {t('lead-details.current-stage')}: <span className="text-primary font-medium">{stage.name}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400">
            {currentStageIndex + 1} / {totalStages}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <Progress value={progressPercentage} className="h-2" />
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
                w-6 h-6 rounded-full flex items-center justify-center transition-all
                ${isCompleted 
                  ? 'bg-green-500/20 text-green-400' 
                  : isCurrent 
                    ? 'bg-primary/20 text-primary ring-2 ring-primary/30' 
                    : 'bg-white/5 text-gray-500'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Circle className={`w-3 h-3 ${isCurrent ? 'fill-primary' : ''}`} />
                )}
              </div>
              <span className={`
                text-[10px] mt-1 truncate max-w-[60px] text-center
                ${isCurrent ? 'text-primary font-medium' : isCompleted ? 'text-gray-400' : 'text-gray-500'}
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
