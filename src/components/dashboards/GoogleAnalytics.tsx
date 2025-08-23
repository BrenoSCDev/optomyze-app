import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import KPICard from '@/components/KPICard';
import { Users, Eye, Clock, TrendingDown, Target, MousePointer, Globe, Smartphone } from 'lucide-react';

const GoogleAnalytics = () => {
  const kpiData = [
    { title: 'Sessions', value: '156,789', trend: { value: '↑ 11.4%', isPositive: true }, icon: <Users className="h-5 w-5 text-primary" /> },
    { title: 'Users', value: '134,567', trend: { value: '↑ 9.8%', isPositive: true }, icon: <Users className="h-5 w-5 text-primary" /> },
    { title: 'Page Views', value: '456,123', trend: { value: '↑ 13.2%', isPositive: true }, icon: <Eye className="h-5 w-5 text-primary" /> },
    { title: 'Avg Session Duration', value: '3m 42s', trend: { value: '↑ 15s', isPositive: true }, icon: <Clock className="h-5 w-5 text-primary" /> },
  ];

  const secondaryKpis = [
    { title: 'Bounce Rate', value: '32.1%', trend: { value: '↓ 2.3%', isPositive: true }, icon: <TrendingDown className="h-5 w-5 text-primary" /> },
    { title: 'Goal Completions', value: '1,245', trend: { value: '↑ 18.9%', isPositive: true }, icon: <Target className="h-5 w-5 text-primary" /> },
    { title: 'Conversion Rate', value: '2.89%', trend: { value: '↑ 0.34%', isPositive: true }, icon: <MousePointer className="h-5 w-5 text-primary" /> },
    { title: 'Pages per Session', value: '2.91', trend: { value: '↑ 0.12', isPositive: true }, icon: <Globe className="h-5 w-5 text-primary" /> },
  ];

  const trafficSourcesData = [
    { name: 'Organic Search', value: 42, color: '#8B5CF6' },
    { name: 'Paid Search', value: 28, color: '#06B6D4' },
    { name: 'Direct', value: 15, color: '#10B981' },
    { name: 'Social', value: 10, color: '#F59E0B' },
    { name: 'Referral', value: 5, color: '#EF4444' },
  ];

  const monthlySessionsData = [
    { month: 'Jan', sessions: 98000, users: 82000 },
    { month: 'Feb', sessions: 102000, users: 86000 },
    { month: 'Mar', sessions: 108000, users: 91000 },
    { month: 'Apr', sessions: 115000, users: 97000 },
    { month: 'May', sessions: 122000, users: 103000 },
    { month: 'Jun', sessions: 128000, users: 108000 },
    { month: 'Jul', sessions: 135000, users: 114000 },
    { month: 'Aug', sessions: 142000, users: 120000 },
    { month: 'Sep', sessions: 148000, users: 125000 },
    { month: 'Oct', sessions: 152000, users: 129000 },
    { month: 'Nov', sessions: 156000, users: 132000 },
    { month: 'Dec', sessions: 156789, users: 134567 },
  ];

  const topPagesData = [
    { page: '/homepage', sessions: 45678, bounceRate: 28.5 },
    { page: '/product-features', sessions: 34567, bounceRate: 31.2 },
    { page: '/pricing', sessions: 23456, bounceRate: 35.8 },
    { page: '/contact', sessions: 18765, bounceRate: 22.1 },
    { page: '/about', sessions: 15432, bounceRate: 41.3 },
    { page: '/blog', sessions: 12987, bounceRate: 38.7 },
    { page: '/demo', sessions: 11234, bounceRate: 19.4 },
    { page: '/resources', sessions: 9876, bounceRate: 44.2 },
  ];

  const userFlowData = [
    { stage: 'Landing Page', users: 134567, color: '#8B5CF6' },
    { stage: 'Product View', users: 95678, color: '#A78BFA' },
    { stage: 'Pricing Page', users: 67890, color: '#C4B5FD' },
    { stage: 'Contact Form', users: 34567, color: '#DDD6FE' },
    { stage: 'Conversion', users: 12345, color: '#F3F4F6' },
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
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Google Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">Comprehensive website performance and user behavior insights</p>
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
        {/* Traffic Sources */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={trafficSourcesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {trafficSourcesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* User Flow */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center">User Flow</h3>
          <div className="space-y-4">
            {userFlowData.map((stage, index) => (
              <motion.div
                key={stage.stage}
                className="relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.0 + index * 0.1 }}
              >
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: stage.color + '20' }}>
                  <span className="font-medium">{stage.stage}</span>
                  <span className="text-lg font-bold" style={{ color: stage.color }}>
                    {stage.users.toLocaleString()}
                  </span>
                </div>
                {index < userFlowData.length - 1 && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-0.5 h-4 bg-primary/30" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Monthly Sessions */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <h3 className="text-xl font-semibold mb-6 text-center">Monthly Sessions & Users</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={monthlySessionsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Area
              type="monotone"
              dataKey="sessions"
              stackId="1"
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.3}
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="users"
              stackId="2"
              stroke="#06B6D4"
              fill="#06B6D4"
              fillOpacity={0.3}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top Landing Pages */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
      >
        <h3 className="text-xl font-semibold mb-6 text-center">Top Landing Pages</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topPagesData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9CA3AF" />
            <YAxis dataKey="page" type="category" stroke="#9CA3AF" width={120} fontSize={12} />
            <Bar dataKey="sessions" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
};

export default GoogleAnalytics;