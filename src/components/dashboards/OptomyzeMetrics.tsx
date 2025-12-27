/**
 * OPTOMYZE METRICS DASHBOARD
 * 
 * The main dashboard displaying core business KPIs and lead generation analytics.
 * Features:
 * - 6 KPI cards with real-time data from API
 * - Interactive charts: Sales funnel, monthly trends, lead breakdown
 * - Recharts integration for professional data visualization
 * - Responsive grid layout that adapts to screen size
 * - Real API data with loading states and error handling
 * 
 * This serves as the primary view when users first access the CRM.
 */

import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import KPICard from '@/components/KPICard';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, UserX, DollarSign, Target, Clock, Percent, Trophy, UserCheck, AlertCircle, Minus } from 'lucide-react';
import OptoIcon from '@/assets/opto-icon.png';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import api from '@/services/api';

// Skeleton Components
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

// Error State Component
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

// Lead Breakdown Funnel Component
const LeadBreakdownFunnel = ({ data, isLoading }: { data: any; isLoading: boolean }) => {
  if (isLoading) {
    return <SkeletonChart />;
  }

  if (!data?.data?.lead_statistics) {
    return null;
  }

  const stats = data.data.lead_statistics;
  const { t } = useLanguage();
  
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
        {funnelData.map((item, index) => {
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

const OptomyzeMetrics = () => {
  const { t } = useLanguage();
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

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

  // Prepare KPI data from API response
  const getKPIData = () => {
    if (!metricsData?.data) return [];

    const { lead_statistics, conversion_rate, average_conversion_time, performance_comparison } = metricsData.data;

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
        title: t('metrics.avg-conversion-time-hours'),
        value: average_conversion_time?.total_hours || 'N/A',
        trend: getTrendData(performance_comparison?.average_conversion_time),
        icon: <Clock className="h-5 w-5 text-primary" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <SkeletonKPICard key={index} />
          ))
        ) : (
          kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} delay={index} />
          ))
        )}
      </div>
      
      {/* Monthly Lead Flow */}
      {loading ? (
        <SkeletonChart />
      ) : (
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">{t('metrics.monthly-lead-flow')}</h3>
          <ResponsiveContainer width="100%" height={400}>
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
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
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

      {/* Lead Breakdown Funnel */}
      <LeadBreakdownFunnel data={metricsData} isLoading={loading} />
    </motion.div>
  );
};

export default OptomyzeMetrics;