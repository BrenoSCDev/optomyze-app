/**
 * OPTOMYZE METRICS DASHBOARD
 *
 * Divided into two tabs:
 *  1. Periodic Performance – KPI cards + all charts (except monthly), with date range filter
 *  2. Monthly Charts       – Monthly Revenue Overview + Monthly Lead Flow
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, Cell, ComposedChart, PieChart, Pie, Line,
} from 'recharts';
import KPICard from '@/components/KPICard';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp, Users, UserX, DollarSign, Target, Percent, Trophy, UserCheck,
  AlertCircle, Filter, BarChart3, Calendar, TrendingDown, GripVertical, RefreshCw,
} from 'lucide-react';
import OptoIcon from '@/assets/opto-icon.png';
import OptoIconLight from '@/assets/opto-icon-light.png';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/services/api';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import DashboardGridToolbar from '@/components/dashboards/DashboardGridToolbar';
import DashboardWidget from '@/components/dashboards/DashboardWidget';

// ============= CONSTANTS =============

const PRODUCT_COLORS = [
  '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const MONTH_NAMES: Record<string, string> = {
  january: 'Jan', february: 'Feb', march: 'Mar', april: 'Apr',
  may: 'May', june: 'Jun', july: 'Jul', august: 'Aug',
  september: 'Sep', october: 'Oct', november: 'Nov', december: 'Dec'
};

// ============= DATE RANGE OPTIONS =============

type DateRange = 'today' | 'yesterday' | '7_days' | '30_days' | '60_days' | '90_days' | '120_days' | 'full';

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'today',     label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7_days',    label: 'Last 7 Days' },
  { value: '30_days',   label: 'Last 30 Days' },
  { value: '60_days',   label: 'Last 60 Days' },
  { value: '90_days',   label: 'Last 90 Days' },
  { value: '120_days',  label: 'Last 120 Days' },
  { value: 'full',      label: 'Full Period' },
];

// ============= SKELETON COMPONENTS =============

const SkeletonKPICard = () => (
  <div className="kpi-card floating animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-muted rounded-lg" />
      <div className="w-20 h-4 bg-muted rounded" />
    </div>
    <div className="w-16 h-8 bg-muted rounded mb-3" />
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-muted rounded" />
      <div className="w-12 h-4 bg-muted rounded" />
    </div>
  </div>
);

const SkeletonChart = () => (
  <div className="chart-container animate-pulse">
    <div className="w-40 h-6 bg-muted rounded mb-6 mx-auto" />
    <div className="w-full h-80 bg-muted rounded" />
  </div>
);

// ============= ERROR STATE =============

const ErrorState = ({ onRetry, error }: { onRetry: () => void; error: any }) => {
  const { t } = useLanguage();
  return (
    <div className="kpi-card text-center">
      <div className="text-destructive mb-4">
        <AlertCircle className="w-12 h-12 mx-auto mb-2" />
        <h3 className="text-lg font-semibold">{t('metrics.failed-to-load')}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {error?.message || t('metrics.unable-to-fetch')}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        {t('metrics.try-again')}
      </button>
    </div>
  );
};

// ============= CHART TOOLTIP STYLE =============

const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
};

const chartTooltipLabelStyle = { color: 'hsl(var(--foreground))', fontWeight: 600 };
const chartTooltipItemStyle  = { color: 'hsl(var(--foreground))' };

// ============= MONTHLY REVENUE CHART =============

interface MonthlyRevenueChartProps {
  monthlyData: Record<string, { closed: { count: number; total: number }; lost: { count: number; total: number } }> | null;
  isLoading: boolean;
  currencySymbol?: string;
}

const MonthlyRevenueChart = ({ monthlyData, isLoading, currencySymbol = '$' }: MonthlyRevenueChartProps) => {
  const { t } = useLanguage();
  if (isLoading) return <SkeletonChart />;

  const chartData = monthlyData
    ? Object.entries(MONTH_NAMES).map(([key, month]) => ({
        month,
        closedRevenue: monthlyData[key]?.closed?.total || 0,
        lostRevenue: monthlyData[key]?.lost?.total || 0,
        closedCount: monthlyData[key]?.closed?.count || 0,
        lostCount: monthlyData[key]?.lost?.count || 0,
      }))
    : [];

  const totalClosed = chartData.reduce((sum, d) => sum + d.closedRevenue, 0);
  const totalLost   = chartData.reduce((sum, d) => sum + d.lostRevenue, 0);
  const recoveryRate = totalLost > 0 ? ((totalClosed / (totalClosed + totalLost)) * 100).toFixed(1) : '100';

  return (
    <motion.div className="chart-container" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          {t('metrics.monthly-revenue-overview')}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t('metrics.win-rate')}:</span>
          <span className={`font-semibold ${Number(recoveryRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {recoveryRate}%
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="closedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="lostGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
          <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value: number, name: string) => [
              `${currencySymbol}${value.toLocaleString()}`,
              name === 'closedRevenue' ? t('metrics.closed-deals') : t('metrics.lost-deals'),
            ]}
          />
          <Legend formatter={(v) => v === 'closedRevenue' ? t('metrics.closed-deals') : t('metrics.lost-deals')} />
          <Bar dataKey="closedRevenue" name="closedRevenue" fill="url(#closedGradient)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="lostRevenue"   name="lostRevenue"   fill="url(#lostGradient)"   radius={[4, 4, 0, 0]} />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">
            {currencySymbol}{totalClosed >= 1000 ? `${(totalClosed / 1000).toFixed(0)}k` : totalClosed.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">{t('metrics.total-closed')}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-400">
            {currencySymbol}{totalLost >= 1000 ? `${(totalLost / 1000).toFixed(0)}k` : totalLost.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">{t('metrics.total-lost')}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {currencySymbol}{(totalClosed + totalLost) >= 1000
              ? `${((totalClosed + totalLost) / 1000).toFixed(0)}k`
              : (totalClosed + totalLost).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">{t('metrics.total-opportunity')}</p>
        </div>
      </div>
    </motion.div>
  );
};

// ============= MONTHLY LEAD FLOW CHART (Leads x Deals) =============

const MonthlyLeadFlowChart = ({ monthlyData, isLoading }: { monthlyData: any[]; isLoading: boolean }) => {
  const { t } = useLanguage();
  if (isLoading) return <SkeletonChart />;

  const hasDeals = monthlyData.some((d: any) => d.deals != null);

  return (
    <motion.div className="chart-container" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
      <h3 className="text-xl font-semibold mb-6 text-center">
        {hasDeals ? 'Leads x Deals per Month' : t('metrics.monthly-lead-flow')}
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={monthlyData}>
          <defs>
            <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="dealsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
          <YAxis stroke="#9CA3AF" fontSize={12} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Legend />
          <Area
            type="monotone"
            dataKey="leads"
            name="Leads"
            stroke="#8B5CF6"
            strokeWidth={3}
            fill="url(#leadsGradient)"
            dot={false}
            activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2 }}
          />
          {hasDeals && (
            <Area
              type="monotone"
              dataKey="deals"
              name="Deals"
              stroke="#10B981"
              strokeWidth={3}
              fill="url(#dealsGradient)"
              dot={false}
              activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {monthlyData.length > 0 && (
        <div className={`mt-6 grid gap-4 pt-4 border-t border-border ${hasDeals ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#8B5CF6]">
              {Math.max(...monthlyData.map((d: any) => d.leads))}
            </p>
            <p className="text-sm text-muted-foreground">{t('metrics.peak-month')} (Leads)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">
              {Math.round(monthlyData.reduce((s: number, d: any) => s + d.leads, 0) / monthlyData.length)}
            </p>
            <p className="text-sm text-muted-foreground">{t('metrics.monthly-avg')} (Leads)</p>
          </div>
          {hasDeals && (
            <>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {Math.max(...monthlyData.map((d: any) => d.deals || 0))}
                </p>
                <p className="text-sm text-muted-foreground">{t('metrics.peak-month')} (Deals)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {Math.round(monthlyData.reduce((s: number, d: any) => s + (d.deals || 0), 0) / monthlyData.length)}
                </p>
                <p className="text-sm text-muted-foreground">{t('metrics.monthly-avg')} (Deals)</p>
              </div>
            </>
          )}
          {!hasDeals && (
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {monthlyData.reduce((s: number, d: any) => s + d.leads, 0)}
              </p>
              <p className="text-sm text-muted-foreground">{t('metrics.total-leads-summary')}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// ============= LEADS BY STAGE CHART =============

interface FunnelData {
  funnel_id: number;
  funnel_name: string;
  total_leads: number;
  stages: Array<{ stage_id: number; stage_name: string; stage_type: string; leads: number; percentage: number }>;
}

const LeadsByStageChart = ({ funnelsData, isLoading }: { funnelsData: FunnelData[] | null; isLoading: boolean }) => {
  const { t } = useLanguage();
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('');

  useEffect(() => {
    if (funnelsData && funnelsData.length > 0 && !selectedFunnelId) {
      setSelectedFunnelId(String(funnelsData[0].funnel_id));
    }
  }, [funnelsData, selectedFunnelId]);

  if (isLoading) return <SkeletonChart />;

  if (!funnelsData || funnelsData.length === 0) {
    return (
      <motion.div className="chart-container" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-primary" /> {t('metrics.leads-by-stage')}
        </h3>
        <p className="text-muted-foreground text-center py-8">{t('metrics.no-funnels')}</p>
      </motion.div>
    );
  }

  const selectedFunnel = funnelsData.find(f => String(f.funnel_id) === selectedFunnelId) || funnelsData[0];
  const stageData = selectedFunnel.stages.map((stage, index) => ({
    stage: stage.stage_name,
    count: stage.leads,
    percentage: stage.percentage,
    color: PRODUCT_COLORS[index % PRODUCT_COLORS.length],
  }));
  const totalLeads = selectedFunnel.total_leads;

  return (
    <motion.div className="chart-container" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" /> {t('metrics.leads-by-stage')}
        </h3>
        <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
          <SelectTrigger className="w-[180px] glass-card">
            <SelectValue placeholder={t('metrics.select-funnel')} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {funnelsData.map(f => (
              <SelectItem key={f.funnel_id} value={String(f.funnel_id)}>{f.funnel_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={stageData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
          <YAxis type="category" dataKey="stage" stroke="#9CA3AF" fontSize={12} width={80} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelStyle={chartTooltipLabelStyle}
            itemStyle={chartTooltipItemStyle}
            formatter={(value: number) => [value, t('metrics.leads')]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {stageData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {stageData.map((stage) => (
          <div key={stage.stage} className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
            <span>{stage.stage}:</span>
            <span className="font-semibold">{stage.count}</span>
            <span className="text-muted-foreground">({totalLeads > 0 ? stage.percentage.toFixed(0) : 0}%)</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ============= PIPELINE VALUE COMPARISON CHART =============

interface PipelineData {
  funnel_id: number; funnel_name: string; estimated_value: number;
  closed_value: number; conversion_percentage: number; gap_percentage: number;
}

const PipelineValueChart = ({ pipelineData, isLoading, currencySymbol = '$' }: { pipelineData: PipelineData[] | null; isLoading: boolean; currencySymbol?: string }) => {
  const { t } = useLanguage();
  if (isLoading) return <SkeletonChart />;

  if (!pipelineData || pipelineData.length === 0) {
    return (
      <motion.div className="chart-container" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-primary" /> {t('metrics.pipeline-vs-closed')}
        </h3>
        <p className="text-muted-foreground text-center py-8">{t('metrics.no-data')}</p>
      </motion.div>
    );
  }

  const chartData = pipelineData.map(item => ({
    funnel: item.funnel_name,
    estimatedValue: item.estimated_value,
    closedValue: item.closed_value,
    gap: item.estimated_value - item.closed_value,
    conversionRate: item.conversion_percentage.toFixed(1),
    gapPercentage: item.gap_percentage,
  }));

  return (
    <motion.div className="chart-container" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> {t('metrics.pipeline-vs-closed')}
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis type="number" stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="funnel" stroke="#9CA3AF" fontSize={12} width={120} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value: number, name: string) => [
              `${currencySymbol}${value.toLocaleString()}`,
              name === 'estimatedValue' ? t('metrics.estimated') : name === 'closedValue' ? t('metrics.closed') : t('metrics.gap'),
            ]}
          />
          <Legend />
          <Bar dataKey="estimatedValue" name={t('metrics.estimated-value')} fill="#8B5CF6" radius={[0, 4, 4, 0]} />
          <Bar dataKey="closedValue"    name={t('metrics.closed-value')}    fill="#10B981" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {chartData.slice(0, 3).map((item) => (
          <div key={item.funnel} className="p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-1 truncate">{item.funnel}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-green-400">{item.conversionRate}%</span>
              <span className="text-sm text-red-400">-{item.gapPercentage.toFixed(0)}% {t('metrics.gap')}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ============= DEALS STAGES DISTRIBUTION CHART =============

interface DealFunnelStage {
  stage_id: number;
  stage_name: string;
  stage_type: string;
  sales: number;
  percentage: number;
}

interface DealFunnelData {
  funnel_id: number;
  funnel_name: string;
  total_sales: number;
  stages: DealFunnelStage[];
}

interface DealsByFunnelStage {
  available: boolean;
  funnels: DealFunnelData[];
  total_funnels: number;
}

const STAGE_TYPE_COLORS: Record<string, string> = {
  entry:       '#8B5CF6',
  negotiation: '#3B82F6',
  approval:    '#F59E0B',
  contract:    '#06B6D4',
  won:         '#10B981',
  lost:        '#EF4444',
  normal:      '#6366F1',
  on_hold:     '#9CA3AF',
};

const DealsStagesDistributionChart = ({
  dealsFunnelData,
  isLoading,
}: {
  dealsFunnelData: DealsByFunnelStage | null;
  isLoading: boolean;
}) => {
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('');

  useEffect(() => {
    if (dealsFunnelData?.funnels?.length && !selectedFunnelId) {
      setSelectedFunnelId(String(dealsFunnelData.funnels[0].funnel_id));
    }
  }, [dealsFunnelData, selectedFunnelId]);

  if (isLoading) return <SkeletonChart />;

  // Hidden when not available
  if (!dealsFunnelData?.available) return null;

  const funnels = dealsFunnelData.funnels || [];

  if (funnels.length === 0) {
    return (
      <motion.div className="chart-container" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-primary" /> Deals Stages Distribution
        </h3>
        <p className="text-muted-foreground text-center py-8">No deal funnels available.</p>
      </motion.div>
    );
  }

  const selectedFunnel = funnels.find(f => String(f.funnel_id) === selectedFunnelId) || funnels[0];
  const totalSales = selectedFunnel.total_sales;

  const stageData = selectedFunnel.stages.map((stage) => ({
    stage: stage.stage_name,
    count: stage.sales,
    percentage: stage.percentage,
    color: STAGE_TYPE_COLORS[stage.stage_type] || PRODUCT_COLORS[0],
    stage_type: stage.stage_type,
  }));

  const showFunnelSelector = funnels.length > 1;

  // Filter out zero-count stages only for rendering the donut (still show in legend)
  const donutData = stageData.filter(s => s.count > 0);

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Deals Stages Distribution
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Total Deals: <span className="font-semibold text-foreground">{totalSales}</span>
          </p>
        </div>

        {showFunnelSelector && (
          <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
            <SelectTrigger className="w-[180px] glass-card">
              <SelectValue placeholder="Select funnel" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {funnels.map(f => (
                <SelectItem key={f.funnel_id} value={String(f.funnel_id)}>
                  {f.funnel_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {totalSales === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          No deals registered in this funnel for the selected period.
        </div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Donut Chart */}
            <div className="relative flex-shrink-0">
              <ResponsiveContainer width={240} height={240}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="count"
                    nameKey="stage"
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={108}
                    paddingAngle={3}
                    stroke="transparent"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipLabelStyle}
                    itemStyle={chartTooltipItemStyle}
                    formatter={(value: number, name: string, props: any) => [
                      `${value} (${props.payload.percentage.toFixed(0)}%)`,
                      'Deals',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centre label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-foreground">{totalSales}</span>
                <span className="text-xs text-muted-foreground mt-0.5">Total</span>
              </div>
            </div>

            {/* Legend / breakdown list */}
            <div className="flex flex-col gap-2.5 flex-1 w-full">
              {stageData.map((stage) => (
                <div key={stage.stage} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm flex-1 truncate">{stage.stage}</span>
                  <span className="font-semibold text-sm">{stage.count}</span>
                  <span className="text-muted-foreground text-sm w-12 text-right">
                    {stage.percentage.toFixed(0)}%
                  </span>
                  {/* Mini progress bar */}
                  <div className="w-20 bg-muted rounded-full h-1.5 flex-shrink-0">
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${stage.percentage}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

// ============= LEAD BREAKDOWN FUNNEL (Visual Funnel) =============

const FUNNEL_COLORS = ['#7C3AED', '#6366F1', '#4F8FF5', '#3B82F6'];

const LeadBreakdownFunnel = ({ data, isLoading }: { data: any; isLoading: boolean }) => {
  const { t } = useLanguage();
  if (isLoading) return <SkeletonChart />;
  if (!data?.data?.lead_statistics) return null;

  const stats = data.data.lead_statistics;
  const funnelSteps = [
    { name: t('metrics.total-leads-summary'), value: stats.total_leads, color: FUNNEL_COLORS[0] },
    { name: t('metrics.in-pipeline'), value: (stats.breakdown?.entry || 0) + (stats.breakdown?.normal || 0), color: FUNNEL_COLORS[1] },
    { name: t('metrics.in-service'), value: stats.in_service, color: FUNNEL_COLORS[2] },
    { name: t('metrics.converted'), value: stats.converted_leads, color: FUNNEL_COLORS[3] },
  ];

  const totalSteps = funnelSteps.length;

  return (
    <motion.div className="chart-container" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h3 className="text-xl font-semibold mb-6 text-center">{t('metrics.lead-pipeline-breakdown')}</h3>

      <div className="flex flex-col items-center gap-0 py-4">
        {funnelSteps.map((step, index) => {
          // Always narrow from 100% down to ~25% regardless of values
          const topWidth = 100 - (index / totalSteps) * 75;
          const bottomWidth = 100 - ((index + 1) / totalSteps) * 75;
          const maxValue = funnelSteps[0].value || 1;

          return (
            <motion.div
              key={step.name}
              className="relative group"
              style={{ width: '100%', maxWidth: 420 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <svg
                viewBox="0 0 400 64"
                className="w-full"
                preserveAspectRatio="none"
                style={{ display: 'block', marginBottom: -1 }}
              >
                <polygon
                  points={`${200 - topWidth * 2},0 ${200 + topWidth * 2},0 ${200 + bottomWidth * 2},64 ${200 - bottomWidth * 2},64`}
                  fill={step.color}
                  opacity={0.7}
                  className="transition-opacity duration-200 group-hover:opacity-90"
                />
                <text x="200" y="30" textAnchor="middle" fill="rgba(255,255,255,0.95)" fontSize="12" fontWeight="600">
                  {step.name}
                </text>
                <text x="200" y="48" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11">
                  {step.value} ({(step.value / maxValue * 100).toFixed(0)}%)
                </text>
              </svg>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('metrics.overall-conversion-rate')}</span>
          <span className="text-2xl font-bold text-foreground">{data.data.conversion_rate?.toFixed(2) || '0.00'}%</span>
        </div>
      </div>
    </motion.div>
  );
};

// ============= PRODUCTS SALES x REVENUE CHART =============

interface ProductPerformanceItem {
  product_id: number | null;
  product_name: string;
  sales_count: number;
  quantity_sold: number;
  revenue: number;
}

const ProductsSalesRevenueChart = ({ data, isLoading, currencySymbol = '$' }: { data: ProductPerformanceItem[] | null; isLoading: boolean; currencySymbol?: string }) => {
  if (isLoading) return <SkeletonChart />;

  if (!data || data.length === 0) {
    return (
      <motion.div className="chart-container" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-primary" /> Product Performance
        </h3>
        <p className="text-muted-foreground text-center py-8">No products sold in this period</p>
      </motion.div>
    );
  }

  return (
    <motion.div className="chart-container" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-primary" /> Product Performance
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="product_name" stroke="#9CA3AF" fontSize={12} />
          <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
          <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0]?.payload as ProductPerformanceItem;
              return (
                <div style={chartTooltipStyle} className="p-3 shadow-lg">
                  <p className="font-semibold mb-1">{label}</p>
                  <p className="text-sm">Units Sold: <span className="font-medium">{item.quantity_sold}</span></p>
                  <p className="text-sm">Revenue: <span className="font-medium">{currencySymbol}{item.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                  <p className="text-sm text-muted-foreground">Appeared in {item.sales_count} deals</p>
                </div>
              );
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="quantity_sold" name="Units Sold" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// ============= AGENTS SALES x REVENUE CHART =============

interface AgentPerformanceItem {
  user_id: number;
  user_name: string;
  sales_count: number;
  revenue: number;
}

const AgentsSalesRevenueChart = ({ data, isLoading, currencySymbol = '$' }: { data: AgentPerformanceItem[] | null; isLoading: boolean; currencySymbol?: string }) => {
  if (isLoading) return <SkeletonChart />;

  if (!data || data.length === 0) {
    return (
      <motion.div className="chart-container" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-primary" /> Agent Performance
        </h3>
        <p className="text-muted-foreground text-center py-8">No closed deals in this period</p>
      </motion.div>
    );
  }

  return (
    <motion.div className="chart-container" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-primary" /> Agent Performance
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="user_name" stroke="#9CA3AF" fontSize={12} />
          <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
          <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`} />
          <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} itemStyle={chartTooltipItemStyle}
            formatter={(value: number, name: string) => [
              name === 'revenue' ? `${currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value,
              name === 'revenue' ? 'Revenue' : 'Closed Deals',
            ]}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="sales_count" name="Closed Deals" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// ============= DATE RANGE SELECTOR =============

const DateRangeSelector = ({ value, onChange }: { value: DateRange; onChange: (v: DateRange) => void }) => (
  <div className="flex items-center gap-2">
    <Calendar className="w-4 h-4 text-muted-foreground" />
    <Select value={value} onValueChange={(v) => onChange(v as DateRange)}>
      <SelectTrigger className="w-[160px] h-9 glass-card text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-card border-border">
        {DATE_RANGE_OPTIONS.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

// ============= TAB BUTTON =============

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
      active
        ? 'text-foreground bg-muted shadow-sm'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    }`}
  >
    {children}
    {active && (
      <motion.div
        layoutId="tab-indicator"
        className="absolute inset-0 rounded-md border border-primary/30 bg-primary/5"
        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      />
    )}
  </button>
);

// ============= MAIN COMPONENT =============

interface OptomyzeMetricsProps {
  demoMode?: boolean;
  demoPeriodicData?: any;
  demoMonthlyData?: any;
}

const OptomyzeMetrics = ({ demoMode = false, demoPeriodicData, demoMonthlyData }: OptomyzeMetricsProps) => {
  const { t } = useLanguage();
  const { mode } = useTheme();
  const themedIcon = mode === 'dark' ? OptoIcon : OptoIconLight;
  const { user } = useAuth();

  // Separate data caches per tab
  const [periodicData,      setPeriodicData]      = useState<any>(demoMode ? demoPeriodicData : null);
  const [monthlyChartsData, setMonthlyChartsData] = useState<any>(demoMode ? demoMonthlyData : null);

  // Per-tab loading / error states
  const [periodicLoading, setPeriodicLoading] = useState(false);
  const [monthlyLoading,  setMonthlyLoading]  = useState(false);
  const [periodicError,   setPeriodicError]   = useState<any>(null);
  const [monthlyError,    setMonthlyError]    = useState<any>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'periodic' | 'monthly'>('periodic');

  // Date range state (shared across tabs, reset cache on change)
  const [dateRange, setDateRange] = useState<DateRange>('30_days');

  // Year selector for monthly charts
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const isErpModule = user?.company?.product_module === 'ERP';

  // ── Customizable layout ─────────────────────────────────────────────────────
  const {
    gridColumns, widgets, setGridColumns, reorderWidgets,
    toggleWidgetVisibility, setWidgetSpan, resetLayout,
  } = useDashboardLayout();
  const [editMode, setEditMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const currentIds = widgets.filter(w => w.visible).map(w => w.id);
    const oldIndex = currentIds.indexOf(String(active.id));
    const newIndex = currentIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = [...currentIds];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, String(active.id));
    // Re-add hidden widgets at their original positions
    const allIds = widgets.map(w => w.id);
    const hiddenIds = allIds.filter(id => !newOrder.includes(id));
    reorderWidgets([...newOrder, ...hiddenIds]);
  }, [widgets, reorderWidgets]);

  // ── Fetch Periodic Performance ──────────────────────────────────────────────
  const fetchPeriodicData = async (force = false) => {
    if (demoMode) return; // skip in demo mode
    if (periodicData && !force) return; // use cache
    try {
      setPeriodicLoading(true);
      setPeriodicError(null);
      const response = await api.get('/api/metrics/leads-breakdown', { params: { period: dateRange } });
      setPeriodicData(response.data);
    } catch (err: any) {
      setPeriodicError(err);
      console.error('Error fetching periodic metrics:', err);
    } finally {
      setPeriodicLoading(false);
    }
  };

  // ── Fetch Monthly Charts ────────────────────────────────────────────────────
  const fetchMonthlyData = async (force = false) => {
    if (demoMode) return; // skip in demo mode
    if (monthlyChartsData && !force) return; // use cache
    try {
      setMonthlyLoading(true);
      setMonthlyError(null);
      const response = await api.get('/api/metrics/monthly-charts', { params: { year: selectedYear } });
      setMonthlyChartsData(response.data);
    } catch (err: any) {
      setMonthlyError(err);
      console.error('Error fetching monthly metrics:', err);
    } finally {
      setMonthlyLoading(false);
    }
  };

  // ── Initial load based on active tab ───────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'periodic') {
      fetchPeriodicData();
    } else {
      fetchMonthlyData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Bust cache when date range changes ─────────────────────────────────────
  useEffect(() => {
    if (demoMode) return;
    setPeriodicData(null);
    setMonthlyChartsData(null);
    if (activeTab === 'periodic') {
      fetchPeriodicData(true);
    } else {
      fetchMonthlyData(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // ── Bust monthly cache when year changes ──────────────────────────────────
  useEffect(() => {
    if (demoMode) return;
    setMonthlyChartsData(null);
    if (activeTab === 'monthly') {
      fetchMonthlyData(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // Loading / error state for the active tab
  const loading          = activeTab === 'periodic' ? periodicLoading : monthlyLoading;
  const error            = activeTab === 'periodic' ? periodicError   : monthlyError;
  const fetchMetricsData = () => activeTab === 'periodic' ? fetchPeriodicData(true) : fetchMonthlyData(true);

  const getTrendData = (performanceData: any) => {
    if (!performanceData) return { value: '0%', isPositive: false };
    const change = performanceData.percentage_change || 0;
    return {
      value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
      isPositive: performanceData.performance_indicator === 'improvement',
    };
  };

  const getRevenueMetrics = () => {
    const rm = periodicData?.data?.revenue_metrics?.metrics;
    if (!rm) return { totalAnnualRevenue: 0, totalMonthlyRevenue: 0, avgDealValue: 0 };
    return {
      totalAnnualRevenue:  rm.total_annual_revenue  || 0,
      totalMonthlyRevenue: rm.total_monthly_revenue || 0,
      avgDealValue:        rm.average_deal_value    || 0,
    };
  };

  const getKPIData = () => {
    const d = periodicData?.data;
    const lead_statistics       = d?.lead_statistics;
    const conversion_rate       = d?.conversion_rate;
    const performance_comparison = d?.performance_comparison;
    const { totalAnnualRevenue } = getRevenueMetrics();

    // ── Row 1: Lead KPIs ──────────────────────────────────────────────────────
    const row1 = [
      {
        title: t('metrics.total-leads'),
        value: lead_statistics?.total_leads ?? 0,
        trend: getTrendData(performance_comparison?.total_leads),
        icon: <Users className="h-5 w-5 text-primary" />,
      },
      {
        title: 'Qualified Leads',
        value: lead_statistics?.qualified_leads ?? '—',
        trend: { value: '+0%', isPositive: true },
        icon: <UserCheck className="h-5 w-5 text-primary" />,
      },
      {
        title: t('metrics.lost-leads'),
        value: lead_statistics?.total_leads_lost ?? 0,
        trend: getTrendData(performance_comparison?.total_leads_lost),
        icon: <UserX className="h-5 w-5 text-primary" />,
      },
      {
        title: 'Converted Deals',
        value: lead_statistics?.converted_leads ?? 0,
        trend: getTrendData(performance_comparison?.converted_leads),
        icon: <Trophy className="h-5 w-5 text-primary" />,
      },
      {
        title: t('metrics.conversion-rate'),
        value: `${conversion_rate?.toFixed(2) ?? '0.00'}%`,
        trend: getTrendData(performance_comparison?.conversion_rate),
        icon: <Percent className="h-5 w-5 text-primary" />,
      },
    ];

    // ── Row 2: Deal KPIs ──────────────────────────────────────────────────────
    const dealStats = d?.deal_statistics;
    const row2 = [
      {
        title: 'Total Deals',
        value: dealStats?.total_deals ?? '—',
        trend: { value: '+0%', isPositive: true },
        icon: <BarChart3 className="h-5 w-5 text-primary" />,
      },
      {
        title: 'Closed Deals',
        value: dealStats?.closed_deals ?? '—',
        trend: { value: '+0%', isPositive: true },
        icon: <TrendingUp className="h-5 w-5 text-primary" />,
      },
      {
        title: 'Lost Deals',
        value: dealStats?.lost_deals ?? '—',
        trend: { value: '+0%', isPositive: false },
        icon: <TrendingDown className="h-5 w-5 text-primary" />,
      },
      {
        title: 'Deal Conversion Rate',
        value: dealStats?.deal_conversion_rate != null ? `${Number(dealStats.deal_conversion_rate).toFixed(1)}%` : '0%',
        trend: { value: '+0%', isPositive: true },
        icon: <Target className="h-5 w-5 text-primary" />,
      },
      {
        title: 'Revenue',
        value: dealStats?.revenue != null
          ? `$${Number(dealStats.revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '—',
        trend: { value: '+0%', isPositive: true },
        icon: <DollarSign className="h-5 w-5 text-primary" />,
      },
    ];

    return { row1, row2 };
  };

  const getMonthlyData = () => {
    // Monthly lead flow comes from the monthly-charts endpoint (new: monthly_overview)
    const source = monthlyChartsData ?? periodicData;
    const overview = source?.data?.monthly_overview || source?.data?.monthly_lead_data;
    if (!overview) return [];
    return overview.map((item: any) => ({
      name: item.month,
      leads: item.leads,
      ...(item.deals != null ? { deals: item.deals } : {}),
    }));
  };

  const monthlyYear = monthlyChartsData?.data?.year || selectedYear;

  // Monthly charts endpoint data
  const getMonthlyDealsData  = () => monthlyChartsData?.data?.revenue_metrics?.metrics?.monthly_deals_analysis?.monthly_data || null;
  // Periodic endpoint data
  const getFunnelsData       = () => periodicData?.data?.leads_by_funnel_stage?.funnels || null;
  const getPipelineData      = () => periodicData?.data?.estimated_vs_closed_value?.funnels || null;
  const getDealsByFunnelStage = (): DealsByFunnelStage | null => periodicData?.data?.deals_by_funnel_stage || null;

  const selectedRangeLabel = DATE_RANGE_OPTIONS.find(o => o.value === dateRange)?.label || 'Last 30 Days';

  if (error) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <img src={themedIcon} alt="Optomyze" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" />
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">{t('dashboard.title.optomyze')}</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">{t('dashboard.subtitle.optomyze')}</p>
        </div>
        <ErrorState onRetry={fetchMetricsData} error={error} />
      </motion.div>
    );
  }

  const kpiData     = getKPIData();
  const monthlyData = getMonthlyData();

  // ── Visible widgets for customizable grid ─────────────────────────────────
  const visibleWidgets = useMemo(() => {
    const erpHidden = isErpModule ? ['deals-stages', 'estimated-vs-closed'] : [];
    return widgets.filter(w => w.visible && !erpHidden.includes(w.id));
  }, [widgets, isErpModule]);

  const renderWidget = useCallback((widgetId: string) => {
    switch (widgetId) {
      case 'kpi-row-1':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {periodicLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonKPICard key={i} />)
              : kpiData.row1.map((kpi, i) => <KPICard key={i} {...kpi} delay={i} />)
            }
          </div>
        );
      case 'kpi-row-2':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {periodicLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonKPICard key={`d${i}`} />)
              : kpiData.row2.map((kpi, i) => <KPICard key={i} {...kpi} delay={i + 5} />)
            }
          </div>
        );
      case 'leads-by-funnel':
        return <LeadsByStageChart funnelsData={getFunnelsData()} isLoading={loading} />;
      case 'deals-stages':
        return <DealsStagesDistributionChart dealsFunnelData={getDealsByFunnelStage()} isLoading={loading} />;
      case 'lead-breakdown':
        return <LeadBreakdownFunnel data={periodicData} isLoading={periodicLoading} />;
      case 'estimated-vs-closed':
        return <PipelineValueChart pipelineData={getPipelineData()} isLoading={loading} />;
      case 'products-sales':
        return <ProductsSalesRevenueChart data={periodicData?.data?.product_sales_performance ?? null} isLoading={periodicLoading} />;
      case 'agents-sales':
        return <AgentsSalesRevenueChart data={periodicData?.data?.agent_sales_performance ?? null} isLoading={periodicLoading} />;
      default:
        return null;
    }
  }, [periodicData, periodicLoading, loading, kpiData]);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <img src={themedIcon} alt="Optomyze" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" />
            <h1 className="text-xl sm:text-3xl font-bold text-foreground leading-tight">{t('dashboard.title.optomyze')}</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">{t('dashboard.subtitle.optomyze')}</p>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex items-center gap-0.5 p-0.5 bg-muted/50 rounded-lg border border-border w-fit">
        <TabButton active={activeTab === 'periodic'} onClick={() => setActiveTab('periodic')}>
          <span className="relative z-10 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Periodic Performance
          </span>
        </TabButton>
        <TabButton active={activeTab === 'monthly'} onClick={() => setActiveTab('monthly')}>
          <span className="relative z-10 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            Monthly Charts
          </span>
        </TabButton>
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">

        {/* ── TAB 1: Periodic Performance ── */}
        {activeTab === 'periodic' && (
          <motion.div
            key="periodic"
            className="space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Date Range Filter + Grid Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm text-muted-foreground">Showing data for:</span>
                <span className="text-xs sm:text-sm font-medium text-foreground">{selectedRangeLabel}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  title="Refresh data"
                  onClick={fetchMetricsData}
                  disabled={loading}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <DashboardGridToolbar
                  gridColumns={gridColumns}
                  widgets={widgets}
                  editMode={editMode}
                  onSetGridColumns={setGridColumns}
                  onToggleEditMode={() => setEditMode(prev => !prev)}
                  onToggleVisibility={toggleWidgetVisibility}
                  onResetLayout={resetLayout}
                  isErpModule={isErpModule}
                />
                <DateRangeSelector value={dateRange} onChange={setDateRange} />
              </div>
            </div>

            {editMode && (
              <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
                <GripVertical className="w-4 h-4 text-primary" />
                <span>Drag widgets to reorder. Hover over a widget for expand/download options. Click the grid icon again to exit.</span>
              </div>
            )}

            {/* Customizable DnD Grid */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visibleWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
                <div className={`grid gap-4 sm:gap-6 ${
                  gridColumns === 1 ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'
                }`}>
                  {visibleWidgets.map(widget => (
                    <DashboardWidget
                      key={widget.id}
                      id={widget.id}
                      colSpan={widget.colSpan}
                      maxSpan={gridColumns}
                      editMode={editMode}
                      onSetSpan={setWidgetSpan}
                    >
                      {renderWidget(widget.id)}
                    </DashboardWidget>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </motion.div>
        )}

        {/* ── TAB 2: Monthly Charts ── */}
        {activeTab === 'monthly' && (
          <motion.div
            key="monthly"
            className="space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Aggregated monthly trends — {monthlyYear}</span>
              </div>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-[120px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monthly Revenue Chart — hidden for ERP users */}
            {!isErpModule && (
              <MonthlyRevenueChart monthlyData={getMonthlyDealsData()} isLoading={loading} />
            )}

            {/* Monthly Lead Flow */}
            <MonthlyLeadFlowChart monthlyData={monthlyData} isLoading={loading} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OptomyzeMetrics;
