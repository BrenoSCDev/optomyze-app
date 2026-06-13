import { TrendingUp } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import SectionCard from './SectionCard';
import { META_CHART_COLORS } from './theme';
import type { DailyTrendPoint } from './types';

interface TrendAnalysisSectionProps {
  dailyTrend: DailyTrendPoint[];
  currencySymbol: string;
  delay?: number;
}

const tooltipStyle = { backgroundColor: '#1f2937', border: '1px solid #374151' };
const tooltipLabelStyle = { color: '#fff' };
const formatNumber = (value: number) => (typeof value === 'number' ? value.toFixed(2) : value);

const activeTabClass = 'rounded-lg data-[state=active]:bg-[#0081FB] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_-4px_rgba(0,129,251,0.5)]';

const TrendAnalysisSection = ({ dailyTrend, currencySymbol, delay = 0 }: TrendAnalysisSectionProps) => {
  const { t } = useLanguage();

  return (
    <SectionCard title={t('meta.trend.title')} icon={<TrendingUp className="h-5 w-5" />} delay={delay}>
      <Tabs defaultValue="spend">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4 bg-muted/50 rounded-xl">
          <TabsTrigger className={activeTabClass} value="spend">{t('meta.trend.tab.spend')}</TabsTrigger>
          <TabsTrigger className={activeTabClass} value="reach">{t('meta.trend.tab.reach')}</TabsTrigger>
          <TabsTrigger className={activeTabClass} value="clicks">{t('meta.trend.tab.clicks')}</TabsTrigger>
          <TabsTrigger className={activeTabClass} value="conversions">{t('meta.trend.tab.conversions')}</TabsTrigger>
          <TabsTrigger className={activeTabClass} value="ctr">{t('meta.trend.tab.ctr')}</TabsTrigger>
          <TabsTrigger className={activeTabClass} value="cpl">{t('meta.trend.tab.cpl')}</TabsTrigger>
        </TabsList>

        <TabsContent value="spend">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" stroke="#9CA3AF" />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} formatter={formatNumber} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spend"
                stroke={META_CHART_COLORS.blue}
                strokeWidth={2}
                dot={{ fill: META_CHART_COLORS.blue, r: 3 }}
                name={`${t('meta.trend.tab.spend')} (${currencySymbol})`}
              />
              <Bar yAxisId="right" dataKey="results" fill={META_CHART_COLORS.cyan} name={t('meta.conversions')} radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="reach">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} formatter={formatNumber} />
              <Legend />
              <Line type="monotone" dataKey="impressions" stroke={META_CHART_COLORS.amber} strokeWidth={2} name={t('meta.impressions')} />
              <Line type="monotone" dataKey="reach" stroke={META_CHART_COLORS.emerald} strokeWidth={2} name={t('meta.reach')} />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="clicks">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} formatter={formatNumber} />
              <Legend />
              <Line type="monotone" dataKey="clicks" stroke={META_CHART_COLORS.violet} strokeWidth={2} name={t('meta.clicks')} />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="conversions">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} formatter={formatNumber} />
              <Legend />
              <Line type="monotone" dataKey="results" stroke={META_CHART_COLORS.cyan} strokeWidth={2} name={t('meta.conversions')} />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="ctr">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} formatter={(value: number) => `${formatNumber(value)}%`} />
              <Legend />
              <Line type="monotone" dataKey="ctr" stroke={META_CHART_COLORS.violet} strokeWidth={2} name={t('meta.ctr')} />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="cpl">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} formatter={(value: number) => `${currencySymbol}${formatNumber(value)}`} />
              <Legend />
              <Line type="monotone" dataKey="cpl" stroke={META_CHART_COLORS.amber} strokeWidth={2} name={t('meta.cpa')} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </SectionCard>
  );
};

export default TrendAnalysisSection;
