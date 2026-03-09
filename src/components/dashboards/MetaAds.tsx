/**
 * META ADS DASHBOARD
 * 
 * Dedicated dashboard for Facebook and Instagram advertising performance.
 * Features:
 * - 8 advertising-specific KPIs (spend, impressions, CTR, ROAS, etc.)
 * - Campaign performance bar charts
 * - Daily spend trend analysis
 * - Audience demographics breakdown
 * - Device performance distribution
 * - Professional color scheme optimized for advertising data
 * 
 * Uses realistic advertising metrics and industry-standard terminology.
 */

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import KPICard from '@/components/KPICard';
import { DollarSign, Eye, MousePointer, Target, TrendingUp, Users, Smartphone, Monitor } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { FaMeta } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import { IntegrationWarning } from '@/components/ui/IntegrationWarning';

interface MetaAdsCampaignData {
  campaign_id: string;
  campaign_name: string;
  impressions: string;
  reach: string;
  frequency: string;
  clicks: string;
  spend: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  date_start: string;
  date_stop: string;
}

interface MetaAdsResponse {
  message: string;
  data: {
    data: MetaAdsCampaignData[];
  };
}

interface MetaAdsProps {
  demoMode?: boolean;
  demoData?: MetaAdsCampaignData[];
}

const MetaAds = ({ demoMode = false, demoData }: MetaAdsProps) => {
  const { t } = useLanguage();
  const { symbol: cs } = useCurrency();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!demoMode);
  const [metaData, setMetaData] = useState<MetaAdsCampaignData[]>(demoMode && demoData ? demoData : []);
  const [notConfigured, setNotConfigured] = useState(false);
  
  useEffect(() => {
    if (demoMode) return;
    fetchMetaData();
  }, [demoMode]);

  const fetchMetaData = async () => {
    try {
      setLoading(true);
      const response = await api.get<MetaAdsResponse>('/api/integrations/meta-ads/fetch-meta-data');
      setMetaData(response.data.data.data);
      setNotConfigured(false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setNotConfigured(true);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch Meta Ads data',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Aggregate metrics across all campaigns
  const aggregatedMetrics = metaData.reduce(
    (acc, item) => {
      acc.totalSpend += parseFloat(item.spend || '0');
      acc.totalImpressions += parseInt(item.impressions || '0');
      acc.totalClicks += parseInt(item.clicks || '0');
      acc.totalReach += parseInt(item.reach || '0');
      
      // Count conversions from actions
      const conversions = item.actions?.find(a => a.action_type === 'onsite_conversion.total_messaging_connection')?.value || '0';
      acc.totalConversions += parseInt(conversions);
      
      return acc;
    },
    { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalReach: 0, totalConversions: 0 }
  );

  // Calculate derived metrics
  const avgCTR = aggregatedMetrics.totalImpressions > 0 
    ? (aggregatedMetrics.totalClicks / aggregatedMetrics.totalImpressions * 100).toFixed(2)
    : '0.00';
  
  const avgCPC = aggregatedMetrics.totalClicks > 0
    ? (aggregatedMetrics.totalSpend / aggregatedMetrics.totalClicks).toFixed(2)
    : '0.00';

  const avgCPM = aggregatedMetrics.totalImpressions > 0
    ? (aggregatedMetrics.totalSpend / aggregatedMetrics.totalImpressions * 1000).toFixed(2)
    : '0.00';

  const avgCPA = aggregatedMetrics.totalConversions > 0
    ? (aggregatedMetrics.totalSpend / aggregatedMetrics.totalConversions).toFixed(2)
    : '0.00';

  // Group data by campaign for comparison
  const campaignComparison = Object.values(
    metaData.reduce((acc, item) => {
      const campaignId = item.campaign_id;
      if (!acc[campaignId]) {
        acc[campaignId] = {
          name: item.campaign_name,
          spend: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          reach: 0,
        };
      }
      acc[campaignId].spend += parseFloat(item.spend || '0');
      acc[campaignId].impressions += parseInt(item.impressions || '0');
      acc[campaignId].clicks += parseInt(item.clicks || '0');
      acc[campaignId].reach += parseInt(item.reach || '0');
      
      const conversions = item.actions?.find(a => a.action_type === 'onsite_conversion.total_messaging_connection')?.value || '0';
      acc[campaignId].conversions += parseInt(conversions);
      
      return acc;
    }, {} as Record<string, any>)
  ).map((c: any) => ({ ...c, spend: parseFloat(c.spend.toFixed(2)) })).sort((a: any, b: any) => b.spend - a.spend).slice(0, 10);

  // Group data by date for trend analysis
  const dailyTrend = Object.values(
    metaData.reduce((acc, item) => {
      const date = item.date_start;
      if (!acc[date]) {
        acc[date] = {
          date,
          spend: 0,
          clicks: 0,
          impressions: 0,
          conversions: 0,
        };
      }
      acc[date].spend = parseFloat((acc[date].spend + parseFloat(item.spend || '0')).toFixed(2));
      acc[date].clicks += parseInt(item.clicks || '0');
      acc[date].impressions += parseInt(item.impressions || '0');
      
      const conversions = item.actions?.find(a => a.action_type === 'onsite_conversion.total_messaging_connection')?.value || '0';
      acc[date].conversions += parseInt(conversions);
      
      return acc;
    }, {} as Record<string, any>)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate action type distribution
  const actionTypeDistribution = metaData.reduce((acc, item) => {
    item.actions?.forEach(action => {
      if (!acc[action.action_type]) {
        acc[action.action_type] = 0;
      }
      acc[action.action_type] += parseInt(action.value);
    });
    return acc;
  }, {} as Record<string, number>);

  const topActions = Object.entries(actionTypeDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({
      name: name.replace('onsite_conversion.', '').replace(/_/g, ' '),
      value,
      percentage: Math.round((value / Object.values(actionTypeDistribution).reduce((a, b) => a + b, 0)) * 100),
    }));

  const kpiData = [
    { 
      title: t('meta.total-spend'), 
      value: `${cs}${aggregatedMetrics.totalSpend.toFixed(2)}`, 
      trend: { value: `${metaData.length} ${t('common.days')}`, isPositive: true }, 
      icon: <DollarSign className="h-5 w-5 text-primary" /> 
    },
    { 
      title: t('meta.impressions'), 
      value: aggregatedMetrics.totalImpressions.toLocaleString(), 
      trend: { value: `${campaignComparison.length} campaigns`, isPositive: true }, 
      icon: <Eye className="h-5 w-5 text-primary" /> 
    },
    { 
      title: t('meta.clicks'), 
      value: aggregatedMetrics.totalClicks, 
      trend: { value: `CTR: ${avgCTR}%`, isPositive: parseFloat(avgCTR) > 1 }, 
      icon: <MousePointer className="h-5 w-5 text-primary" /> 
    },
    { 
      title: t('meta.ctr'), 
      value: `${avgCTR}%`, 
      trend: { value: `${aggregatedMetrics.totalReach.toLocaleString()} reach`, isPositive: true }, 
      icon: <Target className="h-5 w-5 text-primary" /> 
    },
  ];

  const secondaryKpis = [
    { 
      title: t('meta.cpc'), 
      value: `${cs}${avgCPC}`, 
      trend: { value: 'Avg per click', isPositive: parseFloat(avgCPC) < 2 }, 
      icon: <DollarSign className="h-5 w-5 text-primary" /> 
    },
    { 
      title: t('meta.conversions'), 
      value: aggregatedMetrics.totalConversions.toLocaleString(), 
      trend: { value: `${topActions.length} action types`, isPositive: true }, 
      icon: <Target className="h-5 w-5 text-primary" /> 
    },
    { 
      title: t('meta.cpa'), 
      value: `${cs}${avgCPA}`, 
      trend: { value: 'Cost per action', isPositive: parseFloat(avgCPA) < 50 }, 
      icon: <DollarSign className="h-5 w-5 text-primary" /> 
    },
    { 
      title: 'CPM', 
      value: `${cs}${avgCPM}`, 
      trend: { value: 'Per 1k impressions', isPositive: parseFloat(avgCPM) < 50 }, 
      icon: <TrendingUp className="h-5 w-5 text-primary" /> 
    },
  ];

  if (loading) {
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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FaMeta size={32}/>
            <h1 className="text-3xl font-bold text-foreground">
              {t('dashboard.title.meta')}
            </h1>
          </div>
          <div className="text-md text-muted-foreground flex items-center gap-2">
            <IoCalendarOutline />
            {t('meta.last-30-days')}
          </div>
        </div>
        <p className="text-muted-foreground">{t('dashboard.subtitle.meta')}</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} delay={index} />
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {secondaryKpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} delay={index + 4} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Spend Comparison */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">{t('meta.campaign-performance')}</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={campaignComparison} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={11} width={100} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => typeof value === 'number' ? value.toFixed(2) : value}
              />
              <Legend />
              <Bar dataKey="spend" fill="#8B5CF6" name={`Spend (${cs})`} radius={[0, 4, 4, 0]} />
              <Bar dataKey="conversions" fill="#06B6D4" name="Conversions" radius={[0, 4, 4, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Campaign Performance Metrics */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">Campaign Metrics Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={campaignComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => typeof value === 'number' ? value.toFixed(2) : value}
              />
              <Legend />
              <Bar dataKey="clicks" fill="#10B981" name="Clicks" radius={[4, 4, 0, 0]} />
              <Bar dataKey="impressions" fill="#F59E0B" name="Impressions (scaled)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Spend & Conversion Trend */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">{t('meta.daily-spend-trend')}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" stroke="#9CA3AF" />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => typeof value === 'number' ? value.toFixed(2) : value}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spend"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 3 }}
                name="Spend ($)"
              />
              <Bar yAxisId="right" dataKey="conversions" fill="#06B6D4" name="Conversions" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Action Types */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">Top Action Types</h3>
          <div className="space-y-4">
            {topActions.map((action, index) => (
              <div key={action.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize truncate max-w-[200px]">{action.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{action.value.toLocaleString()}</span>
                    <span className="font-semibold text-primary">{action.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${action.percentage}%` }}
                    transition={{ duration: 1, delay: index * 0.1 + 1.4 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground text-center">
              Total Actions: {Object.values(actionTypeDistribution).reduce((a, b) => a + b, 0).toLocaleString()}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Daily Performance Table */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.6 }}
      >
        <h3 className="text-xl font-semibold mb-6 text-center">Daily Performance Breakdown</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => typeof value === 'number' ? value.toFixed(2) : value}
              />
            <Legend />
            <Line type="monotone" dataKey="clicks" stroke="#10B981" strokeWidth={2} name="Clicks" />
            <Line type="monotone" dataKey="impressions" stroke="#F59E0B" strokeWidth={2} name="Impressions" />
            <Line type="monotone" dataKey="conversions" stroke="#06B6D4" strokeWidth={2} name="Conversions" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
};

export default MetaAds;