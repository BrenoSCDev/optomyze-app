/**
 * OPTOMYZE METRICS DASHBOARD
 * 
 * The main dashboard displaying core business KPIs and lead generation analytics.
 * Features:
 * - 8 KPI cards with animated counters (leads, conversions, ROI, etc.)
 * - Interactive charts: Sales funnel, monthly trends, lead sources
 * - Recharts integration for professional data visualization
 * - Responsive grid layout that adapts to screen size
 * - Mock data with realistic business metrics
 * 
 * This serves as the primary view when users first access the CRM.
 */

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import KPICard from '@/components/KPICard';
import { TrendingUp, Users, UserX, DollarSign, Target, Clock, Percent, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const OptomyzeMetrics = () => {
  const { t } = useLanguage();
  
  // Mock data
  const kpiData = [
    { title: t('metrics.total-leads'), value: '2,847', trend: { value: '↑ 12.5%', isPositive: true }, icon: <Users className="h-5 w-5 text-primary" /> },
    { title: t('metrics.conversion-rate'), value: '38.2%', trend: { value: '↑ 3.2%', isPositive: true }, icon: <Percent className="h-5 w-5 text-primary" /> },
    { title: t('metrics.avg-conversion-time'), value: '7.2 days', trend: { value: '↓ 1.1 days', isPositive: true }, icon: <Clock className="h-5 w-5 text-primary" /> },
  ];
  
  const secondaryKpis = [
    { title: t('metrics.leads-in-service'), value: '134', trend: { value: '↑ 8.2%', isPositive: true }, icon: <Target className="h-5 w-5 text-primary" /> },
    { title: t('metrics.converted-sales'), value: '1,089', trend: { value: '↑ 18.7%', isPositive: true }, icon: <DollarSign className="h-5 w-5 text-primary" /> },
    { title: t('metrics.lost-leads'), value: '592', trend: { value: '↓ 5.1%', isPositive: true }, icon: <UserX className="h-5 w-5 text-primary" /> },
    // { title: t('metrics.avg-sale-value'), value: '$3,450', trend: { value: '↑ 5.8%', isPositive: true }, icon: <DollarSign className="h-5 w-5 text-primary" /> },
    // { title: t('metrics.monthly-roi'), value: '287%', trend: { value: '↑ 15.3%', isPositive: true }, icon: <TrendingUp className="h-5 w-5 text-primary" /> },
  ];

  const monthlyData = [
    { month: 'Jan', leads: 180 },
    { month: 'Feb', leads: 220 },
    { month: 'Mar', leads: 195 },
    { month: 'Apr', leads: 267 },
    { month: 'May', leads: 234 },
    { month: 'Jun', leads: 289 },
    { month: 'Jul', leads: 312 },
    { month: 'Aug', leads: 298 },
    { month: 'Sep', leads: 345 },
    { month: 'Oct', leads: 367 },
    { month: 'Nov', leads: 389 },
    { month: 'Dec', leads: 401 },
  ];

  const leadSourcesData = [
    { name: 'Meta Ads', value: 35, color: '#8B5CF6' },
    { name: 'Google Ads', value: 28, color: '#06B6D4' },
    { name: 'Organic', value: 22, color: '#10B981' },
    { name: 'Direct', value: 10, color: '#F59E0B' },
    { name: 'Others', value: 5, color: '#EF4444' },
  ];

  const funnelData = [
    { name: t('metrics.funnel.leads'), value: 2847, fill: '#8B5CF6' },
    { name: t('metrics.funnel.qualified'), value: 1654, fill: '#A78BFA' },
    { name: t('metrics.funnel.opportunities'), value: 1245, fill: '#C4B5FD' },
    { name: t('metrics.funnel.sales'), value: 1089, fill: '#DDD6FE' },
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
          {t('dashboard.title.optomyze')}
        </h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle.optomyze')}</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} delay={index} />
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {secondaryKpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} delay={index + 4} />
        ))}
      </div>
      
      {/* Monthly Lead Flow */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <h3 className="text-xl font-semibold mb-6 text-center">{t('metrics.monthly-lead-flow')}</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Line
              type="monotone"
              dataKey="leads"
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2, fill: '#fff' }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Funnel */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">{t('metrics.sales-funnel')}</h3>
          <div className="space-y-4">
            {funnelData.map((stage, index) => (
              <motion.div
                key={stage.name}
                className="relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
              >
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: stage.fill + '30' }}>
                  <span className="font-medium">{stage.name}</span>
                  <span className="text-lg font-bold" style={{ color: stage.fill }}>
                    {stage.value.toLocaleString()}
                  </span>
                </div>
                {index < funnelData.length - 1 && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-0.5 h-4 bg-primary/30" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
        

        {/* Lead Sources */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">{t('metrics.lead-sources')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadSourcesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {leadSourcesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OptomyzeMetrics;