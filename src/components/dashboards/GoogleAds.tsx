/**
 * GOOGLE ADS DASHBOARD
 * 
 * Fully functional Google Ads campaign analytics dashboard.
 * Features:
 * - Real-time data from Google Ads API
 * - Aggregate campaign metrics and KPIs
 * - Individual campaign performance tracking
 * - Campaign comparison and analysis
 * - Interactive visualizations and charts
 * 
 * Designed to help marketers optimize their Google advertising campaigns.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import KPICard from '@/components/KPICard';
import { DollarSign, Eye, MousePointer, Target, TrendingUp, AlertCircle, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CampaignMetrics {
  clicks: string;
  impressions: string;
  ctr: number;
  averageCpc: number;
  conversions: number;
  conversionsValue: number;
  costMicros: string;
  searchImpressionShare?: number;
  viewThroughConversions: string;
}

interface Campaign {
  resourceName: string;
  status: string;
  advertisingChannelType: string;
  name: string;
  id: string;
}

interface CampaignBudget {
  resourceName: string;
  amountMicros: string;
}

interface CampaignData {
  campaign: Campaign;
  metrics: CampaignMetrics;
  campaignBudget: CampaignBudget;
}

interface GoogleAdsResponse {
  message: string;
  data: {
    results: CampaignData[];
  };
}

const COLORS = ['#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EF4444', '#EC4899'];

const GoogleAds = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignsData, setCampaignsData] = useState<CampaignData[]>([]);

  useEffect(() => {
    fetchGoogleAdsData();
  }, []);

  const fetchGoogleAdsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<GoogleAdsResponse>('/api/integrations/google-ads/fetch-google-data');
      
      if (response.data?.data?.results) {
        // Filter out removed campaigns for cleaner display
        const activeCampaigns = response.data.data.results.filter(
          (campaign) => campaign.campaign.status !== 'REMOVED'
        );
        setCampaignsData(activeCampaigns);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('not_configured');
      } else {
        setError('fetch_error');
        toast({
          title: t('common.error'),
          description: 'Failed to fetch Google Ads data. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregate metrics
  const calculateAggregateMetrics = () => {
    if (campaignsData.length === 0) {
      return {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalConversionsValue: 0,
        avgCtr: 0,
        avgCpc: 0,
        cpa: 0,
      };
    }

    const totals = campaignsData.reduce(
      (acc, campaign) => {
        const spend = parseFloat(campaign.metrics.costMicros) / 1000000;
        const impressions = parseInt(campaign.metrics.impressions);
        const clicks = parseInt(campaign.metrics.clicks);
        const conversions = campaign.metrics.conversions;
        const conversionsValue = campaign.metrics.conversionsValue;

        return {
          totalSpend: acc.totalSpend + spend,
          totalImpressions: acc.totalImpressions + impressions,
          totalClicks: acc.totalClicks + clicks,
          totalConversions: acc.totalConversions + conversions,
          totalConversionsValue: acc.totalConversionsValue + conversionsValue,
        };
      },
      {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalConversionsValue: 0,
      }
    );

    const avgCtr = totals.totalImpressions > 0 ? (totals.totalClicks / totals.totalImpressions) * 100 : 0;
    const avgCpc = totals.totalClicks > 0 ? totals.totalSpend / totals.totalClicks : 0;
    const cpa = totals.totalConversions > 0 ? totals.totalSpend / totals.totalConversions : 0;

    return {
      ...totals,
      avgCtr,
      avgCpc,
      cpa,
    };
  };

  const aggregateMetrics = calculateAggregateMetrics();

  // Prepare data for campaign comparison chart
  const prepareCampaignComparisonData = () => {
    return campaignsData
      .filter((campaign) => campaign.campaign.status === 'ENABLED')
      .slice(0, 6)
      .map((campaign) => ({
        name: campaign.campaign.name.length > 30 
          ? campaign.campaign.name.substring(0, 30) + '...' 
          : campaign.campaign.name,
        spend: parseFloat(campaign.metrics.costMicros) / 1000000,
        conversions: campaign.metrics.conversions,
        clicks: parseInt(campaign.metrics.clicks),
      }));
  };

  // Prepare data for status pie chart
  const prepareStatusData = () => {
    const statusCounts = campaignsData.reduce((acc, campaign) => {
      const status = campaign.campaign.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  };

  // Loading state
  if (loading) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-[400px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading Google Ads data...</p>
        </div>
      </motion.div>
    );
  }

  // Error state - not configured
  if (error === 'not_configured') {
    return (
      <motion.div
        className="flex items-center justify-center min-h-[400px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="max-w-md p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Google Ads Not Configured</h3>
            <p className="text-muted-foreground">
              Please configure your Google Ads integration in the CRM App Store to view your campaign data.
            </p>
          </div>
          <Button
            onClick={() => navigate('/?tab=integrations')}
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            Go to CRM App Store
          </Button>
        </Card>
      </motion.div>
    );
  }

  // Error state - fetch error
  if (error === 'fetch_error') {
    return (
      <motion.div
        className="flex items-center justify-center min-h-[400px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="max-w-md p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Failed to Load Data</h3>
            <p className="text-muted-foreground">
              There was an error loading your Google Ads data. Please try again.
            </p>
          </div>
          <Button onClick={fetchGoogleAdsData} className="w-full">
            Try Again
          </Button>
        </Card>
      </motion.div>
    );
  }

  const kpiData = [
    {
      title: t('google-ads.total-spend'),
      value: `$${aggregateMetrics.totalSpend.toFixed(2)}`,
      trend: { value: t('meta.last-30-days'), isPositive: true },
      icon: <DollarSign className="h-5 w-5 text-primary" />,
    },
    {
      title: t('google-ads.impressions'),
      value: aggregateMetrics.totalImpressions.toLocaleString(),
      trend: { value: `${campaignsData.length} campaigns`, isPositive: true },
      icon: <Eye className="h-5 w-5 text-primary" />,
    },
    {
      title: t('google-ads.clicks'),
      value: aggregateMetrics.totalClicks.toLocaleString(),
      trend: { value: `${aggregateMetrics.avgCtr.toFixed(2)}% CTR`, isPositive: true },
      icon: <MousePointer className="h-5 w-5 text-primary" />,
    },
    {
      title: t('google-ads.ctr'),
      value: `${aggregateMetrics.avgCtr.toFixed(2)}%`,
      trend: { value: 'Average', isPositive: true },
      icon: <Target className="h-5 w-5 text-primary" />,
    },
  ];

  const secondaryKpis = [
    {
      title: t('google-ads.avg-cpc'),
      value: `$${aggregateMetrics.avgCpc.toFixed(2)}`,
      trend: { value: 'Average', isPositive: true },
      icon: <DollarSign className="h-5 w-5 text-primary" />,
    },
    {
      title: t('google-ads.conversions'),
      value: aggregateMetrics.totalConversions.toFixed(0),
      trend: { value: `$${aggregateMetrics.totalConversionsValue.toFixed(2)} value`, isPositive: true },
      icon: <Target className="h-5 w-5 text-primary" />,
    },
    {
      title: t('google-ads.cpa'),
      value: `$${aggregateMetrics.cpa.toFixed(2)}`,
      trend: { value: 'Cost per acquisition', isPositive: true },
      icon: <DollarSign className="h-5 w-5 text-primary" />,
    },
    {
      title: 'Active Campaigns',
      value: campaignsData.filter((c) => c.campaign.status === 'ENABLED').length.toString(),
      trend: { value: `${campaignsData.length} total`, isPositive: true },
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
    },
  ];

  const campaignComparisonData = prepareCampaignComparisonData();
  const statusData = prepareStatusData();

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('dashboard.title.google-ads')}</h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle.google-ads')}</p>
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
        {/* Campaign Performance Comparison */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">Top Campaigns Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="spend" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Spend ($)" />
              <Bar dataKey="conversions" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Campaign Status Distribution */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">Campaign Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Campaign Details Table */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <h3 className="text-xl font-semibold mb-6 text-center">All Campaigns</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 font-medium">Campaign</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Impressions</th>
                <th className="text-right p-3 font-medium">Clicks</th>
                <th className="text-right p-3 font-medium">CTR</th>
                <th className="text-right p-3 font-medium">Spend</th>
                <th className="text-right p-3 font-medium">Conversions</th>
                <th className="text-right p-3 font-medium">CPA</th>
              </tr>
            </thead>
            <tbody>
              {campaignsData.map((campaign, index) => {
                const spend = parseFloat(campaign.metrics.costMicros) / 1000000;
                const cpa = campaign.metrics.conversions > 0 ? spend / campaign.metrics.conversions : 0;
                
                return (
                  <motion.tr
                    key={campaign.campaign.id}
                    className="border-b border-white/5 hover:bg-white/5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.2 + index * 0.05 }}
                  >
                    <td className="p-3 font-medium max-w-xs truncate" title={campaign.campaign.name}>
                      {campaign.campaign.name}
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant={
                          campaign.campaign.status === 'ENABLED'
                            ? 'default'
                            : campaign.campaign.status === 'PAUSED'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {campaign.campaign.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">{parseInt(campaign.metrics.impressions).toLocaleString()}</td>
                    <td className="p-3 text-right">{parseInt(campaign.metrics.clicks).toLocaleString()}</td>
                    <td className="p-3 text-right">{(campaign.metrics.ctr * 100).toFixed(2)}%</td>
                    <td className="p-3 text-right">${spend.toFixed(2)}</td>
                    <td className="p-3 text-right text-primary font-medium">
                      {campaign.metrics.conversions.toFixed(0)}
                    </td>
                    <td className="p-3 text-right">${cpa.toFixed(2)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GoogleAds;