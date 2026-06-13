/**
 * META ADS DASHBOARD
 *
 * Marketing intelligence center for Facebook and Instagram advertising
 * performance: date-range filtering, previous-period comparisons, campaign
 * intelligence, multi-metric trend analysis, ad set breakdown, and
 * auto-generated insights.
 */

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import axios from 'axios';
import { Activity, BarChart3, CheckCircle2, DollarSign, Eye, ListChecks, MousePointer, Receipt, Target } from 'lucide-react';
import { FaMeta } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import KPICard from '@/components/KPICard';
import { IntegrationWarning } from '@/components/ui/IntegrationWarning';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { MetaAdsResponse } from '@/services/metaAdsApi';
import {
  AdsetTable,
  CampaignIntelligencePanel,
  InsightsPanel,
  MetaAdsFilterBar,
  META_CHART_COLORS,
  META_HEADER_GRADIENT,
  SectionCard,
  TrendAnalysisSection,
  aggregateMetrics,
  buildAdsetSummaries,
  buildCampaignIntelligence,
  buildCampaignSummaries,
  buildDailyTrend,
  buildKpiDeltas,
  buildPrimaryKpis,
  buildSecondaryKpis,
  generateInsights,
  topActions,
  useMetaAdsData,
} from './meta-ads';

interface MetaAdsProps {
  demoMode?: boolean;
  demoData?: MetaAdsResponse;
}

const tooltipStyle = { backgroundColor: '#1f2937', border: '1px solid #374151' };
const tooltipLabelStyle = { color: '#fff' };
const formatTooltipValue = (value: number) => (typeof value === 'number' ? value.toFixed(2) : value);

const MetaAds = ({ demoMode = false, demoData }: MetaAdsProps) => {
  const { t } = useLanguage();
  const { symbol: cs } = useCurrency();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data, isLoading, error, dateRange, setDateRange, customDateFrom, customDateTo, setCustomDates } = useMetaAdsData(demoMode, demoData);

  const notConfigured = !demoMode && axios.isAxiosError(error) && error.response?.status === 404;

  useEffect(() => {
    if (!demoMode && error && !notConfigured) {
      toast({
        title: 'Error',
        description: 'Failed to fetch Meta Ads data',
        variant: 'destructive',
      });
    }
  }, [error, demoMode, notConfigured, toast]);

  const currentRows = useMemo(() => data?.data.current ?? [], [data]);
  const previousRows = useMemo(() => data?.data.previous ?? [], [data]);
  const adsetRows = useMemo(() => data?.adsets ?? [], [data]);

  const currentMetrics = useMemo(() => aggregateMetrics(currentRows), [currentRows]);
  const previousMetrics = useMemo(() => aggregateMetrics(previousRows), [previousRows]);
  const campaignSummaries = useMemo(() => buildCampaignSummaries(currentRows), [currentRows]);
  const topCampaignsBySpend = useMemo(
    () => [...campaignSummaries].sort((a, b) => b.spend - a.spend).slice(0, 10),
    [campaignSummaries]
  );
  const dailyTrend = useMemo(() => buildDailyTrend(currentRows), [currentRows]);
  const adsetSummaries = useMemo(() => buildAdsetSummaries(adsetRows), [adsetRows]);
  const campaignIntelligence = useMemo(() => buildCampaignIntelligence(campaignSummaries), [campaignSummaries]);
  const topActionsList = useMemo(() => topActions(currentRows), [currentRows]);
  const totalActions = useMemo(() => topActionsList.reduce((sum, a) => sum + a.value, 0), [topActionsList]);

  const kpiDeltas = useMemo(() => buildKpiDeltas(currentMetrics, previousMetrics), [currentMetrics, previousMetrics]);
  const primaryKpis = useMemo(() => buildPrimaryKpis(t, cs, currentMetrics, kpiDeltas), [t, cs, currentMetrics, kpiDeltas]);
  const secondaryKpis = useMemo(() => buildSecondaryKpis(t, cs, currentMetrics, kpiDeltas), [t, cs, currentMetrics, kpiDeltas]);

  const insights = useMemo(
    () =>
      generateInsights({
        campaignSummaries,
        intelligence: campaignIntelligence,
        deltas: { spend: kpiDeltas.spend, ctr: kpiDeltas.ctr },
        currencySymbol: cs,
      }),
    [campaignSummaries, campaignIntelligence, kpiDeltas, cs]
  );

  const primaryIcons = [
    <DollarSign className="h-5 w-5" />,
    <Eye className="h-5 w-5" />,
    <MousePointer className="h-5 w-5" />,
    <Target className="h-5 w-5" />,
  ];
  const secondaryIcons = [
    <DollarSign className="h-5 w-5" />,
    <CheckCircle2 className="h-5 w-5" />,
    <Receipt className="h-5 w-5" />,
    <BarChart3 className="h-5 w-5" />,
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Meta Ads data...</p>
        </div>
      </div>
    );
  }

  if (notConfigured) {
    return (
      <IntegrationWarning
        title="Meta Ads Not Configured"
        description="Please configure your Meta Ads integration in the CRM App Store to view your advertising performance data."
        buttonText="Configure Meta Ads"
        onButtonClick={() => navigate('/?section=integrations')}
        iconColor="text-yellow-500"
      />
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className={cn('mb-8 rounded-2xl border border-border/60 p-6', META_HEADER_GRADIENT)}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-background shadow-sm text-[#0081FB] shrink-0">
              <FaMeta size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {t('dashboard.title.meta')}
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">{t('dashboard.subtitle.meta')}</p>
            </div>
          </div>
          <MetaAdsFilterBar
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            customDateFrom={customDateFrom}
            customDateTo={customDateTo}
            onCustomDateChange={setCustomDates}
          />
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {primaryKpis.map((kpi, index) => (
          <KPICard key={kpi.title} {...kpi} icon={primaryIcons[index]} accent="blue" delay={index} />
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {secondaryKpis.map((kpi, index) => (
          <KPICard key={kpi.title} {...kpi} icon={secondaryIcons[index]} accent="blue" compact delay={index + 4} />
        ))}
      </div>

      {/* Campaign Intelligence */}
      <CampaignIntelligencePanel intelligence={campaignIntelligence} currencySymbol={cs} delay={0.8} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Spend Comparison */}
        <SectionCard title={t('meta.campaign-performance')} icon={<BarChart3 className="h-5 w-5" />} direction="left" delay={1.0}>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={topCampaignsBySpend} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={11} width={100} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                formatter={formatTooltipValue}
              />
              <Legend />
              <Bar dataKey="spend" fill={META_CHART_COLORS.blue} name={`${t('meta.total-spend')} (${cs})`} radius={[0, 4, 4, 0]} />
              <Bar dataKey="results" fill={META_CHART_COLORS.cyan} name={t('meta.conversions')} radius={[0, 4, 4, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Campaign Performance Metrics */}
        <SectionCard title={t('meta.campaign-metrics-comparison')} icon={<Activity className="h-5 w-5" />} direction="right" delay={1.2}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topCampaignsBySpend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                formatter={formatTooltipValue}
              />
              <Legend />
              <Bar dataKey="clicks" fill={META_CHART_COLORS.violet} name={t('meta.clicks')} radius={[4, 4, 0, 0]} />
              <Bar dataKey="impressions" fill={META_CHART_COLORS.amber} name={t('meta.impressions')} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Trend Analysis */}
      <TrendAnalysisSection dailyTrend={dailyTrend} currencySymbol={cs} delay={1.4} />

      {/* Top Action Types */}
      <SectionCard title={t('meta.top-action-types')} icon={<ListChecks className="h-5 w-5" />} delay={1.6}>
        <div className="space-y-4">
          {topActionsList.map((action, index) => (
            <div key={action.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize truncate max-w-[200px]">{action.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{action.value.toLocaleString()}</span>
                  <span className="font-semibold text-[#0081FB]">{action.percentage}%</span>
                </div>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#0081FB] to-[#00C4FF]"
                  initial={{ width: 0 }}
                  animate={{ width: `${action.percentage}%` }}
                  transition={{ duration: 1, delay: index * 0.1 + 1.6 }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground text-center">
            {t('meta.total-actions')}: {totalActions.toLocaleString()}
          </div>
        </div>
      </SectionCard>

      {/* Ad Set Analysis */}
      <AdsetTable adsets={adsetSummaries} currencySymbol={cs} delay={1.8} />

      {/* Insights */}
      <InsightsPanel insights={insights} delay={2.0} />
    </motion.div>
  );
};

export default MetaAds;
