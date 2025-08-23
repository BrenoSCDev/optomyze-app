import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';
import KPICard from '@/components/KPICard';
import { DollarSign, Eye, MousePointer, Target, TrendingUp, Star, MapPin, Clock } from 'lucide-react';

const GoogleAds = () => {
  const kpiData = [
    { title: 'Total Spend', value: '$9,834', trend: { value: 'This month', isPositive: true }, icon: <DollarSign className="h-5 w-5 text-primary" /> },
    { title: 'Impressions', value: '1.8M', trend: { value: '↑ 8.7%', isPositive: true }, icon: <Eye className="h-5 w-5 text-primary" /> },
    { title: 'Clicks', value: '32,145', trend: { value: '↑ 9.2%', isPositive: true }, icon: <MousePointer className="h-5 w-5 text-primary" /> },
    { title: 'CTR', value: '1.79%', trend: { value: '↑ 0.05%', isPositive: true }, icon: <Target className="h-5 w-5 text-primary" /> },
  ];

  const secondaryKpis = [
    { title: 'Avg CPC', value: '$0.31', trend: { value: '↑ $0.02', isPositive: false }, icon: <DollarSign className="h-5 w-5 text-primary" /> },
    { title: 'Conversions', value: '654', trend: { value: '↑ 16.3%', isPositive: true }, icon: <Target className="h-5 w-5 text-primary" /> },
    { title: 'CPA', value: '$15.04', trend: { value: '↓ $1.87', isPositive: true }, icon: <DollarSign className="h-5 w-5 text-primary" /> },
    { title: 'Quality Score Avg', value: '7.8/10', trend: { value: '↑ 0.3', isPositive: true }, icon: <Star className="h-5 w-5 text-primary" /> },
  ];

  const keywordData = [
    { keyword: 'crm software', impressions: 45678, clicks: 1234, cpc: 0.45, conversions: 67 },
    { keyword: 'lead management', impressions: 34567, clicks: 987, cpc: 0.38, conversions: 54 },
    { keyword: 'sales automation', impressions: 28934, clicks: 834, cpc: 0.52, conversions: 43 },
    { keyword: 'customer tracking', impressions: 23456, clicks: 756, cpc: 0.41, conversions: 38 },
    { keyword: 'business analytics', impressions: 19876, clicks: 645, cpc: 0.47, conversions: 32 },
    { keyword: 'marketing tools', impressions: 18234, clicks: 589, cpc: 0.39, conversions: 29 },
    { keyword: 'data insights', impressions: 16789, clicks: 523, cpc: 0.44, conversions: 26 },
    { keyword: 'conversion optimization', impressions: 15432, clicks: 478, cpc: 0.51, conversions: 24 },
    { keyword: 'roi tracking', impressions: 14567, clicks: 445, cpc: 0.42, conversions: 22 },
    { keyword: 'performance metrics', impressions: 13234, clicks: 412, cpc: 0.46, conversions: 20 },
  ];

  const campaignROIData = [
    { campaign: 'Search - Core Terms', spend: 2800, revenue: 8400, roi: 300 },
    { campaign: 'Display - Retargeting', spend: 2200, revenue: 6160, roi: 280 },
    { campaign: 'Search - Long Tail', spend: 1900, revenue: 4940, roi: 260 },
    { campaign: 'Shopping Ads', spend: 1600, revenue: 4000, roi: 250 },
    { campaign: 'YouTube Ads', spend: 1334, revenue: 3200, roi: 240 },
    { campaign: 'Discovery Ads', spend: 1000, revenue: 2200, roi: 220 },
  ];

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    conversionRate: Math.random() * 5 + 1,
  }));

  const geoData = [
    { location: 'California', sessions: 12345, conversions: 234, rate: 1.9 },
    { location: 'New York', sessions: 10987, conversions: 198, rate: 1.8 },
    { location: 'Texas', sessions: 9876, conversions: 167, rate: 1.7 },
    { location: 'Florida', sessions: 8765, conversions: 145, rate: 1.65 },
    { location: 'Illinois', sessions: 7654, conversions: 128, rate: 1.67 },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white bg-clip-text text-transparent mb-2">
          Google Ads Dashboard
        </h1>
        <p className="text-muted-foreground">Monitor your Google Ads campaigns and keyword performance</p>
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
        {/* Campaign ROI */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">Campaign ROI</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={campaignROIData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="campaign" stroke="#9CA3AF" fontSize={10} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9CA3AF" />
              <Bar dataKey="spend" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill="#06B6D4" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Hourly Performance */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">Conversion Rate by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Line
                type="monotone"
                dataKey="conversionRate"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 3 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Keyword Performance Table */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <h3 className="text-xl font-semibold mb-6 text-center">Top Performing Keywords</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 font-medium">Keyword</th>
                <th className="text-right p-3 font-medium">Impressions</th>
                <th className="text-right p-3 font-medium">Clicks</th>
                <th className="text-right p-3 font-medium">CPC</th>
                <th className="text-right p-3 font-medium">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {keywordData.map((row, index) => (
                <motion.tr
                  key={row.keyword}
                  className="border-b border-white/5 hover:bg-white/5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
                >
                  <td className="p-3 font-medium">{row.keyword}</td>
                  <td className="p-3 text-right">{row.impressions.toLocaleString()}</td>
                  <td className="p-3 text-right">{row.clicks.toLocaleString()}</td>
                  <td className="p-3 text-right">${row.cpc.toFixed(2)}</td>
                  <td className="p-3 text-right text-primary font-medium">{row.conversions}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Geographic Performance */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
      >
        <h3 className="text-xl font-semibold mb-6 text-center">Geographic Performance</h3>
        <div className="space-y-4">
          {geoData.map((item, index) => (
            <motion.div
              key={item.location}
              className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 1.4 + index * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">{item.location}</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-muted-foreground">Sessions</div>
                  <div className="font-medium">{item.sessions.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Conversions</div>
                  <div className="font-medium text-primary">{item.conversions}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Rate</div>
                  <div className="font-medium">{item.rate}%</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GoogleAds;