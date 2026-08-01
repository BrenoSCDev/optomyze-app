import { AlertTriangle, Info, Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { renderInsightText } from './insights';
import SectionCard from './SectionCard';
import type { InsightEntry, InsightType } from './types';

interface InsightsPanelProps {
  insights: InsightEntry[];
  delay?: number;
}

const ICONS: Record<InsightType, React.ReactNode> = {
  positive: <TrendingUp className="h-4 w-4" />,
  negative: <TrendingDown className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  neutral: <Info className="h-4 w-4" />,
};

const ICON_BG_CLASSES: Record<InsightType, string> = {
  positive: 'bg-emerald-500/10',
  negative: 'bg-rose-500/10',
  warning: 'bg-amber-500/10',
  neutral: 'bg-[#00C4FF]/10',
};

const COLOR_CLASSES: Record<InsightType, string> = {
  positive: 'text-emerald-400',
  negative: 'text-rose-400',
  warning: 'text-amber-400',
  neutral: 'text-[#00C4FF]',
};

const InsightsPanel = ({ insights, delay = 0 }: InsightsPanelProps) => {
  const { t } = useLanguage();

  return (
    <SectionCard title={t('meta.insights.title')} icon={<Lightbulb className="h-5 w-5" />} delay={delay}>
      <ul className="space-y-3">
        {insights.map((insight) => (
          <li
            key={insight.id}
            className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 p-3 transition-colors duration-base ease-standard hover:border-border hover:shadow-md"
          >
            <span className={cn('flex items-center justify-center w-8 h-8 rounded-lg shrink-0', ICON_BG_CLASSES[insight.type], COLOR_CLASSES[insight.type])}>
              {ICONS[insight.type]}
            </span>
            <span className="text-sm text-foreground/90 pt-1.5">{renderInsightText(t, insight)}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
};

export default InsightsPanel;
