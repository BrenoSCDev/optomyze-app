import { Ban, DollarSign, Sparkles, Target, TrendingDown, Trophy, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrencyValue } from './calculations';
import SectionCard from './SectionCard';
import type { CampaignIntelligence, CampaignSummary } from './types';

interface CampaignIntelligencePanelProps {
  intelligence: CampaignIntelligence;
  currencySymbol: string;
  delay?: number;
}

interface MiniCard {
  key: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  campaign: CampaignSummary | null;
  value: string;
  caption?: string;
}

const CampaignIntelligencePanel = ({ intelligence, currencySymbol, delay = 0 }: CampaignIntelligencePanelProps) => {
  const { t } = useLanguage();

  if (!intelligence.highestSpend) {
    return (
      <SectionCard title={t('meta.intelligence.title')} icon={<Sparkles className="h-5 w-5" />} delay={delay}>
        <p className="text-center text-muted-foreground py-8">{t('meta.intelligence.no-data')}</p>
      </SectionCard>
    );
  }

  const cards: MiniCard[] = [
    {
      key: 'best',
      icon: <Trophy className="h-4 w-4" />,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      label: t('meta.intelligence.best-performing'),
      campaign: intelligence.best,
      value: intelligence.best ? `${intelligence.best.results} ${t('meta.intelligence.results')}` : '-',
      caption: intelligence.best && intelligence.best.cpl !== null
        ? `${formatCurrencyValue(intelligence.best.cpl, currencySymbol)} ${t('meta.intelligence.per-result')}`
        : undefined,
    },
    {
      key: 'worst',
      icon: <AlertTriangle className="h-4 w-4" />,
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-400',
      label: t('meta.intelligence.worst-performing'),
      campaign: intelligence.worst,
      value: intelligence.worst ? `${intelligence.worst.results} ${t('meta.intelligence.results')}` : '-',
      caption: intelligence.worst ? formatCurrencyValue(intelligence.worst.spend, currencySymbol) : undefined,
    },
    {
      key: 'ctr',
      icon: <Target className="h-4 w-4" />,
      iconBg: 'bg-[#00C4FF]/10',
      iconColor: 'text-[#00C4FF]',
      label: t('meta.intelligence.highest-ctr'),
      campaign: intelligence.highestCtr,
      value: intelligence.highestCtr ? `${intelligence.highestCtr.ctr.toFixed(2)}%` : '-',
    },
    {
      key: 'spend',
      icon: <DollarSign className="h-4 w-4" />,
      iconBg: 'bg-[#0081FB]/10',
      iconColor: 'text-[#0081FB]',
      label: t('meta.intelligence.highest-spend'),
      campaign: intelligence.highestSpend,
      value: formatCurrencyValue(intelligence.highestSpend.spend, currencySymbol),
    },
    {
      key: 'cpl',
      icon: <TrendingDown className="h-4 w-4" />,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
      label: t('meta.intelligence.lowest-cpl'),
      campaign: intelligence.lowestCpl,
      value: intelligence.lowestCpl && intelligence.lowestCpl.cpl !== null
        ? formatCurrencyValue(intelligence.lowestCpl.cpl, currencySymbol)
        : '-',
    },
  ];

  return (
    <SectionCard title={t('meta.intelligence.title')} icon={<Sparkles className="h-5 w-5" />} delay={delay}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className="group rounded-xl border border-border/60 bg-card/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-md"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg shrink-0', card.iconBg, card.iconColor)}>
                {card.icon}
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{card.label}</span>
            </div>
            <div className="text-base font-semibold truncate" title={card.campaign?.name}>
              {card.campaign?.name ?? '-'}
            </div>
            <div className="text-sm text-foreground/80 mt-0.5">{card.value}</div>
            {card.caption && <div className="text-xs text-muted-foreground mt-1">{card.caption}</div>}
          </div>
        ))}

        {intelligence.wastedSpend.length > 0 && (
          <div className="group rounded-xl border border-border/60 bg-card/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-orange-500/10 text-orange-400">
                <Ban className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('meta.intelligence.wasted-spend')}</span>
            </div>
            <div className="text-base font-semibold">
              {formatCurrencyValue(intelligence.wastedSpend.reduce((sum, c) => sum + c.spend, 0), currencySymbol)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 truncate">
              {intelligence.wastedSpend.map((c) => c.name).join(', ')}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default CampaignIntelligencePanel;
