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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import KPICard from '@/components/KPICard';
import { DollarSign, Eye, MousePointer, Target, TrendingUp, Users, Smartphone, Monitor } from 'lucide-react';

const MetaAds = () => {
  const kpiData = [
    { title: 'Total Spend', value: '$12,456', trend: { value: 'This month', isPositive: true }, icon: <DollarSign className="h-5 w-5 text-primary" /> },
    { title: 'Impressions', value: '2.3M', trend: { value: '↑ 15.2%', isPositive: true }, icon: <Eye className="h-5 w-5 text-primary" /> },
    { title: 'Clicks', value: '45,678', trend: { value: '↑ 12.8%', isPositive: true }, icon: <MousePointer className="h-5 w-5 text-primary" /> },
    { title: 'CTR', value: '1.98%', trend: { value: '↓ 0.1%', isPositive: false }, icon: <Target className="h-5 w-5 text-primary" /> },
  ];

  const secondaryKpis = [
    { title: 'CPC', value: '$0.27', trend: { value: '↓ $0.03', isPositive: true }, icon: <DollarSign className="h-5 w-5 text-primary" /> },
    { title: 'Conversions', value: '892', trend: { value: '↑ 22.1%', isPositive: true }, icon: <Target className="h-5 w-5 text-primary" /> },
    { title: 'CPA', value: '$13.97', trend: { value: '↓ $2.15', isPositive: true }, icon: <DollarSign className="h-5 w-5 text-primary" /> },
    { title: 'ROAS', value: '4.2x', trend: { value: '↑ 0.8x', isPositive: true }, icon: <TrendingUp className="h-5 w-5 text-primary" /> },
  ];

  const campaignData = [
    { name: 'Lead Gen Pro', spend: 3200, conversions: 245 },
    { name: 'Brand Awareness', spend: 2800, conversions: 156 },
    { name: 'Retargeting', spend: 2400, conversions: 189 },
    { name: 'Lookalike', spend: 2100, conversions: 167 },
    { name: 'Interest Targeting', spend: 1956, conversions: 135 },
  ];

  const dailySpendData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    spend: Math.floor(Math.random() * 600) + 300,
  }));

  const ageGroupData = [
    { name: '18-24', value: 25, color: '#8B5CF6' },
    { name: '25-34', value: 35, color: '#06B6D4' },
    { name: '35-44', value: 22, color: '#10B981' },
    { name: '45-54', value: 12, color: '#F59E0B' },
    { name: '55+', value: 6, color: '#EF4444' },
  ];

  const deviceData = [
    { device: 'Mobile', percentage: 68 },
    { device: 'Desktop', percentage: 25 },
    { device: 'Tablet', percentage: 7 },
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
          Meta Ads Dashboard
        </h1>
        <p className="text-muted-foreground">Track your Facebook and Instagram advertising performance</p>
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
        {/* Campaign Performance */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">Campaign Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" />
              <Bar dataKey="spend" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conversions" fill="#06B6D4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Audience Demographics */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">Audience Demographics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ageGroupData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {ageGroupData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Spend Trend */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">Daily Spend Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySpendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Line
                type="monotone"
                dataKey="spend"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 3 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Device Performance */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">Device Performance</h3>
          <div className="space-y-4">
            {deviceData.map((item, index) => (
              <div key={item.device} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.device === 'Mobile' && <Smartphone className="h-5 w-5 text-primary" />}
                  {item.device === 'Desktop' && <Monitor className="h-5 w-5 text-primary" />}
                  {item.device === 'Tablet' && <Monitor className="h-5 w-5 text-primary" />}
                  <span className="font-medium">{item.device}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.2 + 1.4 }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MetaAds;