/**
 * OPTOMYZE METRICS DASHBOARD
 * 
 * The main dashboard displaying core business KPIs and lead generation analytics.
 * Features:
 * - 6 KPI cards with real-time data from API
 * - Interactive charts: Sales funnel, monthly trends, lead breakdown
 * - Revenue overview, pipeline value comparison, deals status
 * - Recharts integration for professional data visualization
 * - Responsive grid layout that adapts to screen size
 * - Real API data with loading states and error handling
 * 
 * This serves as the primary view when users first access the CRM.
 */

import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import KPICard from '@/components/KPICard';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Users, UserX, DollarSign, Target, Clock, Percent, Trophy, UserCheck, AlertCircle, Minus, Filter, BarChart3, PieChartIcon } from 'lucide-react';
import OptoIcon from '@/assets/opto-icon.png';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';

// ============= MOCK DATA (Replace with API calls later) =============

// Mock Monthly Revenue Data
const getMockMonthlyRevenue = () => [
  { month: 'Jan', currentYear: 45000, previousYear: 38000 },
  { month: 'Feb', currentYear: 52000, previousYear: 42000 },
  { month: 'Mar', currentYear: 48000, previousYear: 45000 },
  { month: 'Apr', currentYear: 61000, previousYear: 48000 },
  { month: 'May', currentYear: 55000, previousYear: 52000 },
  { month: 'Jun', currentYear: 67000, previousYear: 58000 },
  { month: 'Jul', currentYear: 72000, previousYear: 62000 },
  { month: 'Aug', currentYear: 69000, previousYear: 65000 },
  { month: 'Sep', currentYear: 78000, previousYear: 70000 },
  { month: 'Oct', currentYear: 82000, previousYear: 74000 },
  { month: 'Nov', currentYear: 88000, previousYear: 78000 },
  { month: 'Dec', currentYear: 95000, previousYear: 85000 },
];

// Mock Funnels Data
const getMockFunnels = () => [
  { id: '1', name: 'Sales Pipeline' },
  { id: '2', name: 'Marketing Funnel' },
  { id: '3', name: 'Support Pipeline' },
];

// Mock Leads by Stage Data (per funnel)
const getMockLeadsByStage = (funnelId: string) => {
  const data: Record<string, Array<{ stage: string; count: number; color: string }>> = {
    '1': [
      { stage: 'New', count: 145, color: '#8B5CF6' },
      { stage: 'Contacted', count: 98, color: '#A78BFA' },
      { stage: 'Qualified', count: 72, color: '#C4B5FD' },
      { stage: 'Proposal', count: 45, color: '#10B981' },
      { stage: 'Won', count: 28, color: '#34D399' },
      { stage: 'Lost', count: 18, color: '#EF4444' },
    ],
    '2': [
      { stage: 'New', count: 220, color: '#8B5CF6' },
      { stage: 'Contacted', count: 180, color: '#A78BFA' },
      { stage: 'Qualified', count: 120, color: '#C4B5FD' },
      { stage: 'Proposal', count: 65, color: '#10B981' },
      { stage: 'Won', count: 42, color: '#34D399' },
      { stage: 'Lost', count: 35, color: '#EF4444' },
    ],
    '3': [
      { stage: 'New', count: 85, color: '#8B5CF6' },
      { stage: 'Contacted', count: 62, color: '#A78BFA' },
      { stage: 'Qualified', count: 48, color: '#C4B5FD' },
      { stage: 'Proposal', count: 30, color: '#10B981' },
      { stage: 'Won', count: 18, color: '#34D399' },
      { stage: 'Lost', count: 12, color: '#EF4444' },
    ],
  };
  return data[funnelId] || data['1'];
};

// Mock Pipeline Value vs Closed Sales Data
const getMockPipelineComparison = () => [
  { funnel: 'Sales Pipeline', estimatedValue: 450000, closedValue: 280000 },
  { funnel: 'Marketing Funnel', estimatedValue: 320000, closedValue: 185000 },
  { funnel: 'Support Pipeline', estimatedValue: 180000, closedValue: 120000 },
];

// Mock Deals Status Distribution
const getMockDealsStatus = () => [
  { name: 'Pending', value: 42, color: '#F59E0B' },
  { name: 'Sent', value: 28, color: '#3B82F6' },
  { name: 'Closed (Won)', value: 65, color: '#10B981' },
  { name: 'Lost', value: 18, color: '#EF4444' },
];

// Product colors for consistent styling across charts
const PRODUCT_COLORS = [
  '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

// Mock Product Interest vs Sales Data
const getMockProductInterestVsSales = () => [
  { 
    id: 1, 
    name: 'Enterprise CRM Suite', 
    interestedLeads: 145, 
    soldDeals: 28, 
    revenue: 392000,
    avgDealValue: 14000,
    color: PRODUCT_COLORS[0] 
  },
  { 
    id: 2, 
    name: 'Marketing Automation', 
    interestedLeads: 120, 
    soldDeals: 35, 
    revenue: 245000,
    avgDealValue: 7000,
    color: PRODUCT_COLORS[1] 
  },
  { 
    id: 3, 
    name: 'Analytics Dashboard', 
    interestedLeads: 98, 
    soldDeals: 42, 
    revenue: 168000,
    avgDealValue: 4000,
    color: PRODUCT_COLORS[2] 
  },
  { 
    id: 4, 
    name: 'Support Helpdesk', 
    interestedLeads: 85, 
    soldDeals: 38, 
    revenue: 114000,
    avgDealValue: 3000,
    color: PRODUCT_COLORS[3] 
  },
  { 
    id: 5, 
    name: 'E-commerce Plugin', 
    interestedLeads: 72, 
    soldDeals: 15, 
    revenue: 90000,
    avgDealValue: 6000,
    color: PRODUCT_COLORS[4] 
  },
  { 
    id: 6, 
    name: 'API Integration Kit', 
    interestedLeads: 65, 
    soldDeals: 22, 
    revenue: 66000,
    avgDealValue: 3000,
    color: PRODUCT_COLORS[5] 
  },
];

// Get revenue by product (sorted descending)
const getMockRevenueByProduct = () => {
  return getMockProductInterestVsSales()
    .map(p => ({
      name: p.name,
      revenue: p.revenue,
      totalSales: p.soldDeals,
      avgDealValue: p.avgDealValue,
      color: p.color
    }))
    .sort((a, b) => b.revenue - a.revenue);
};

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

// ============= ERROR STATE COMPONENT =============

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

// ============= CHART TOOLTIP STYLES =============

const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))'
};

// ============= MONTHLY REVENUE CHART =============

const MonthlyRevenueChart = ({ showComparison }: { showComparison: boolean }) => {
  const { t } = useLanguage();
  const data = getMockMonthlyRevenue();
  
  const totalCurrentYear = data.reduce((sum, d) => sum + d.currentYear, 0);
  const totalPreviousYear = data.reduce((sum, d) => sum + d.previousYear, 0);
  const growthRate = ((totalCurrentYear - totalPreviousYear) / totalPreviousYear * 100).toFixed(1);

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          {t('metrics.monthly-revenue-overview')}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t('metrics.yoy-growth')}:</span>
          <span className={`font-semibold ${Number(growthRate) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {Number(growthRate) >= 0 ? '+' : ''}{growthRate}%
          </span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
          <YAxis 
            stroke="#9CA3AF" 
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={chartTooltipStyle}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          />
          <Legend />
          <Bar 
            dataKey="currentYear" 
            name={t('metrics.current-year')}
            fill="url(#revenueGradient)" 
            radius={[4, 4, 0, 0]}
          />
          {showComparison && (
            <Line 
              type="monotone" 
              dataKey="previousYear" 
              name={t('metrics.previous-year')}
              stroke="#8B5CF6" 
              strokeWidth={2}
              dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">
            ${(totalCurrentYear / 1000).toFixed(0)}k
          </p>
          <p className="text-sm text-muted-foreground">{t('metrics.total-revenue-ytd')}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-400">
            ${(Math.max(...data.map(d => d.currentYear)) / 1000).toFixed(0)}k
          </p>
          <p className="text-sm text-muted-foreground">{t('metrics.best-month')}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            ${(totalCurrentYear / 12 / 1000).toFixed(0)}k
          </p>
          <p className="text-sm text-muted-foreground">{t('metrics.monthly-avg')}</p>
        </div>
      </div>
    </motion.div>
  );
};

// ============= LEADS BY STAGE CHART =============

const LeadsByStageChart = () => {
  const { t } = useLanguage();
  const funnels = getMockFunnels();
  const [selectedFunnel, setSelectedFunnel] = useState(funnels[0].id);
  
  const stageData = useMemo(() => getMockLeadsByStage(selectedFunnel), [selectedFunnel]);
  const totalLeads = stageData.reduce((sum, d) => sum + d.count, 0);

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          {t('metrics.leads-by-stage')}
        </h3>
        <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
          <SelectTrigger className="w-[180px] glass-card">
            <SelectValue placeholder={t('metrics.select-funnel')} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {funnels.map(funnel => (
              <SelectItem key={funnel.id} value={funnel.id}>
                {funnel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={stageData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
          <YAxis 
            type="category" 
            dataKey="stage" 
            stroke="#9CA3AF" 
            fontSize={12} 
            width={80}
          />
          <Tooltip 
            contentStyle={chartTooltipStyle}
            formatter={(value: number) => [value, t('metrics.leads')]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {stageData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stage Summary */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {stageData.map((stage) => (
          <div 
            key={stage.stage} 
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-sm"
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
            <span>{stage.stage}:</span>
            <span className="font-semibold">{stage.count}</span>
            <span className="text-muted-foreground">
              ({((stage.count / totalLeads) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ============= PIPELINE VALUE COMPARISON CHART =============

const PipelineValueChart = () => {
  const { t } = useLanguage();
  const data = getMockPipelineComparison();
  
  const dataWithGap = data.map(item => ({
    ...item,
    gap: item.estimatedValue - item.closedValue,
    conversionRate: ((item.closedValue / item.estimatedValue) * 100).toFixed(1)
  }));

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          {t('metrics.pipeline-vs-closed')}
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dataWithGap} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis 
            type="number" 
            stroke="#9CA3AF" 
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <YAxis 
            type="category" 
            dataKey="funnel" 
            stroke="#9CA3AF" 
            fontSize={12} 
            width={120}
          />
          <Tooltip 
            contentStyle={chartTooltipStyle}
            formatter={(value: number, name: string) => [
              `$${value.toLocaleString()}`, 
              name === 'estimatedValue' ? t('metrics.estimated') : 
              name === 'closedValue' ? t('metrics.closed') : t('metrics.gap')
            ]}
          />
          <Legend />
          <Bar 
            dataKey="estimatedValue" 
            name={t('metrics.estimated-value')}
            fill="#8B5CF6" 
            radius={[0, 4, 4, 0]}
          />
          <Bar 
            dataKey="closedValue" 
            name={t('metrics.closed-value')}
            fill="#10B981" 
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Conversion Gap Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {dataWithGap.map((item) => (
          <div key={item.funnel} className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-muted-foreground mb-1">{item.funnel}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-green-400">{item.conversionRate}%</span>
              <span className="text-sm text-red-400">
                -{((item.gap / item.estimatedValue) * 100).toFixed(0)}% {t('metrics.gap')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ============= PRODUCT INTEREST VS SALES CHART =============

const ProductInterestVsSalesChart = () => {
  const { t } = useLanguage();
  const data = getMockProductInterestVsSales();

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const product = data.find(p => p.name === label);
      const conversionRate = product ? ((product.soldDeals / product.interestedLeads) * 100).toFixed(1) : '0';
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('metrics.interested-leads')}:</span>
              <span className="font-medium text-purple-400">{payload[0]?.value}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('metrics.sold-deals')}:</span>
              <span className="font-medium text-green-400">{payload[1]?.value}</span>
            </p>
            <p className="flex justify-between gap-4 pt-1 border-t border-border">
              <span className="text-muted-foreground">{t('metrics.conversion-rate')}:</span>
              <span className="font-medium text-primary">{conversionRate}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          {t('metrics.product-interest-vs-sales')}
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="#9CA3AF" 
            fontSize={11} 
            width={140}
            tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 18)}...` : value}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="interestedLeads" 
            name={t('metrics.interested-leads')}
            fill="#8B5CF6" 
            radius={[0, 4, 4, 0]}
          />
          <Bar 
            dataKey="soldDeals" 
            name={t('metrics.sold-deals')}
            fill="#10B981" 
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Conversion Insights */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        {data.slice(0, 3).map((product) => {
          const conversionRate = ((product.soldDeals / product.interestedLeads) * 100).toFixed(1);
          return (
            <div key={product.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-muted-foreground truncate mb-1">{product.name}</p>
              <p className="text-lg font-bold text-primary">{conversionRate}%</p>
              <p className="text-xs text-muted-foreground">{t('metrics.conversion')}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// ============= REVENUE BY PRODUCT CHART =============

const RevenueByProductChart = () => {
  const { t } = useLanguage();
  const data = getMockRevenueByProduct();
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const product = data.find(p => p.name === label);
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('metrics.total-revenue')}:</span>
              <span className="font-medium text-green-400">${product?.revenue.toLocaleString()}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('metrics.total-sales')}:</span>
              <span className="font-medium">{product?.totalSales}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('metrics.avg-deal-value')}:</span>
              <span className="font-medium text-primary">${product?.avgDealValue.toLocaleString()}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.9 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          {t('metrics.revenue-by-product')}
        </h3>
        <span className="text-sm text-muted-foreground">
          {t('metrics.total')}: <span className="font-semibold text-green-400">${(totalRevenue / 1000).toFixed(0)}k</span>
        </span>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical">
          <defs>
            <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#10B981" stopOpacity={1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis 
            type="number" 
            stroke="#9CA3AF" 
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="#9CA3AF" 
            fontSize={11} 
            width={140}
            tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 18)}...` : value}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="revenue" 
            name={t('metrics.revenue')}
            fill="url(#revenueBarGradient)" 
            radius={[0, 4, 4, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Top Products Summary */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {data.slice(0, 3).map((product, index) => (
          <div 
            key={product.name} 
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-sm"
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: product.color }} />
            <span className="text-muted-foreground">#{index + 1}</span>
            <span className="font-semibold">${(product.revenue / 1000).toFixed(0)}k</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ============= DEALS STATUS DISTRIBUTION CHART =============

const DealsStatusChart = () => {
  const { t } = useLanguage();
  const data = getMockDealsStatus();
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-primary" />
          {t('metrics.deals-status')}
        </h3>
        <span className="text-sm text-muted-foreground">
          {t('metrics.total')}: <span className="font-semibold text-foreground">{total}</span> {t('metrics.deals')}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={110}
              innerRadius={60}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={chartTooltipStyle}
              formatter={(value: number) => [value, t('metrics.deals')]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend with counts */}
        <div className="flex flex-col gap-3 min-w-[180px]">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{item.value}</span>
                <span className="text-muted-foreground text-sm">
                  ({((item.value / total) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ============= LEAD BREAKDOWN FUNNEL =============

const LeadBreakdownFunnel = ({ data, isLoading }: { data: any; isLoading: boolean }) => {
  const { t } = useLanguage();
  
  if (isLoading) {
    return <SkeletonChart />;
  }

  if (!data?.data?.lead_statistics) {
    return null;
  }

  const stats = data.data.lead_statistics;
  
  const funnelData = [
    {
      name: t('metrics.total-leads-summary'),
      value: stats.total_leads,
      color: '#8B5CF6'
    },
    {
      name: t('metrics.in-pipeline'),
      value: (stats.breakdown?.entry || 0) + (stats.breakdown?.normal || 0),
      color: '#8B5CF6'
    },
    {
      name: t('metrics.in-service'),
      value: stats.in_service,
      color: '#8B5CF6'
    },
    {
      name: t('metrics.converted'),
      value: stats.converted_leads,
      color: '#10B981'
    }
  ];

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 1.0 }}
    >
      <h3 className="text-xl font-semibold mb-6 text-center">{t('metrics.lead-pipeline-breakdown')}</h3>
      
      <div className="space-y-4">
        {funnelData.map((item) => {
          const percentage = funnelData[0].value > 0 ? (item.value / funnelData[0].value) * 100 : 0;
          
          return (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{item.value}</span>
                  <span className="text-sm text-muted-foreground">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
              
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Conversion Rate Display */}
      <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-primary">{t('metrics.overall-conversion-rate')}</span>
          <span className="text-2xl font-bold text-primary">
            {data.data.conversion_rate?.toFixed(2) || '0.00'}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ============= MAIN COMPONENT =============

const OptomyzeMetrics = () => {
  const { t } = useLanguage();
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [showYearComparison, setShowYearComparison] = useState(true);

  const fetchMetricsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/metrics/leads-breakdown');
      setMetricsData(response.data);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetricsData();
  }, []);

  // Helper function to get trend data
  const getTrendData = (performanceData: any) => {
    if (!performanceData) return { value: '0%', isPositive: false };
    
    const change = performanceData.percentage_change || 0;
    const isPositive = performanceData.performance_indicator === 'improvement';
    
    return {
      value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
      isPositive
    };
  };

  // Mock revenue data for KPI cards (replace with API data later)
  const getRevenueKPIs = () => {
    const monthlyRevenue = getMockMonthlyRevenue();
    const totalAnnualRevenue = monthlyRevenue.reduce((sum, d) => sum + d.currentYear, 0);
    const currentMonth = new Date().getMonth();
    const totalMonthlyRevenue = monthlyRevenue[currentMonth]?.currentYear || 0;
    
    // Mock average deal value
    const avgDealValue = 8500;
    
    return { totalAnnualRevenue, totalMonthlyRevenue, avgDealValue };
  };

  // Prepare KPI data from API response
  const getKPIData = () => {
    if (!metricsData?.data) return [];

    const { lead_statistics, conversion_rate, performance_comparison } = metricsData.data;
    const { totalAnnualRevenue, totalMonthlyRevenue, avgDealValue } = getRevenueKPIs();

    return [
      {
        title: t('metrics.total-leads'),
        value: lead_statistics.total_leads,
        trend: getTrendData(performance_comparison?.total_leads),
        icon: <Users className="h-5 w-5 text-primary" />
      },
      {
        title: t('metrics.leads-in-service'),
        value: lead_statistics.in_service,
        trend: getTrendData(performance_comparison?.in_service),
        icon: <UserCheck className="h-5 w-5 text-primary" />
      },
      {
        title: t('metrics.lost-leads'),
        value: lead_statistics.total_leads_lost,
        trend: getTrendData(performance_comparison?.total_leads_lost),
        icon: <UserX className="h-5 w-5 text-primary" />
      },
      {
        title: t('metrics.converted-sales'),
        value: lead_statistics.converted_leads,
        trend: getTrendData(performance_comparison?.converted_leads),
        icon: <Trophy className="h-5 w-5 text-primary" />
      },
      {
        title: t('metrics.conversion-rate'),
        value: `${conversion_rate?.toFixed(2) || '0.00'}%`,
        trend: getTrendData(performance_comparison?.conversion_rate),
        icon: <Percent className="h-5 w-5 text-primary" />
      },
      {
        title: t('metrics.total-annual-revenue'),
        value: `$${(totalAnnualRevenue / 1000).toFixed(0)}k`,
        trend: { value: '+18.2%', isPositive: true },
        icon: <DollarSign className="h-5 w-5 text-primary" />
      },
      {
        title: t('metrics.total-monthly-revenue'),
        value: `$${(totalMonthlyRevenue / 1000).toFixed(0)}k`,
        trend: { value: '+12.5%', isPositive: true },
        icon: <TrendingUp className="h-5 w-5 text-primary" />
      },
      {
        title: t('metrics.avg-deal-value'),
        value: `$${avgDealValue.toLocaleString()}`,
        trend: { value: '+5.3%', isPositive: true },
        icon: <Target className="h-5 w-5 text-primary" />
      }
    ];
  };

  // Get monthly chart data
  const getMonthlyData = () => {
    if (!metricsData?.data?.monthly_lead_data) return [];
    return metricsData.data.monthly_lead_data.map((item: any) => ({
      name: item.month,
      leads: item.leads
    }));
  };

  if (error) {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img src={OptoIcon} alt="Optomyze" className="h-8 w-8" />
            <h1 className="text-3xl font-bold text-white bg-clip-text text-transparent">
              {t('dashboard.title.optomyze')}
            </h1>
          </div>
          <p className="text-muted-foreground">{t('dashboard.subtitle.optomyze')}</p>
        </div>
        <ErrorState onRetry={fetchMetricsData} error={error} />
      </motion.div>
    );
  }

  const kpiData = getKPIData();
  const monthlyData = getMonthlyData();

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <img src={OptoIcon} alt="Optomyze" className="h-8 w-8" />
          <h1 className="text-3xl font-bold text-white bg-clip-text text-transparent">
            {t('dashboard.title.optomyze')}
          </h1>
        </div>
        <p className="text-muted-foreground">{t('dashboard.subtitle.optomyze')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <SkeletonKPICard key={index} />
          ))
        ) : (
          kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} delay={index} />
          ))
        )}
      </div>

      {/* Monthly Revenue & Lead Flow Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MonthlyRevenueChart showComparison={showYearComparison} />
        
        {/* Monthly Lead Flow */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <motion.div
            className="chart-container"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h3 className="text-xl font-semibold mb-6 text-center">{t('metrics.monthly-lead-flow')}</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
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
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  fill="url(#leadsGradient)"
                  dot={false}
                  activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            
            {/* Summary Stats */}
            {monthlyData.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {Math.max(...monthlyData.map((d: any) => d.leads))}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('metrics.peak-month')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {Math.round(monthlyData.reduce((sum: number, d: any) => sum + d.leads, 0) / monthlyData.length)}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('metrics.monthly-avg')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {monthlyData.reduce((sum: number, d: any) => sum + d.leads, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('metrics.total-leads-summary')}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Deals Status & Lead Pipeline Breakdown Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DealsStatusChart />
        <LeadBreakdownFunnel data={metricsData} isLoading={loading} />
      </div>

      {/* Leads by Stage & Pipeline Value Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LeadsByStageChart />
        <PipelineValueChart />
      </div>

      {/* Product Performance Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ProductInterestVsSalesChart />
        <RevenueByProductChart />
      </div>
    </motion.div>
  );
};

export default OptomyzeMetrics;