/**
 * GOOGLE ANALYTICS DASHBOARD
 * 
 * Website performance and user behavior analytics dashboard.
 * Features:
 * - 8 web analytics KPIs (sessions, users, bounce rate, etc.)
 * - Traffic source analysis with donut charts
 * - User flow visualization
 * - Monthly session trends
 * - Top landing pages performance
 * - Comprehensive website insight metrics
 * 
 * Provides website owners with essential traffic and conversion data.
 */

import { motion } from 'framer-motion';
import { BarChart, TrendingUp, Users, Target, MousePointer, Globe, Activity, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';

const GoogleAnalytics = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: <BarChart className="w-8 h-8" />,
      title: "Real-Time Analytics",
      description: "Track website visitors and user behavior in real-time"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Audience Insights",
      description: "Understand your audience demographics and interests"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Goal Tracking",
      description: "Monitor conversions and goal completions"
    },
    {
      icon: <MousePointer className="w-8 h-8" />,
      title: "User Behavior Flow",
      description: "Visualize user journeys through your website"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Traffic Sources",
      description: "Analyze where your visitors come from"
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: "Page Performance",
      description: "Track page views, bounce rates, and engagement"
    }
  ];

  return (
    <motion.div
      className="space-y-8 max-w-7xl mx-auto p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-block"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <BarChart className="w-10 h-10 text-primary" />
          </div>
        </motion.div>
        
        <motion.h1
          className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Coming Soon
        </motion.h1>
        
        <motion.p
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {t('dashboard.title.google-analytics')} - Powerful website analytics and insights
        </motion.p>
      </div>

      {/* Features Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
          >
            <Card className="p-6 h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Preview Dashboard Mockup */}
      <motion.div
        className="mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        <Card className="p-8 bg-card/30 backdrop-blur-sm border-border/50">
          <h2 className="text-2xl font-bold mb-6 text-center">Dashboard Preview</h2>
          
          {/* Mock KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Sessions', value: '156.7K', icon: <Users className="w-5 h-5" /> },
              { label: 'Pageviews', value: '456.1K', icon: <BarChart className="w-5 h-5" /> },
              { label: 'Avg. Duration', value: '3m 42s', icon: <Clock className="w-5 h-5" /> },
              { label: 'Conversion Rate', value: '2.89%', icon: <Target className="w-5 h-5" /> },
            ].map((kpi, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-background/50 border border-border/30"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  {kpi.icon}
                  <span className="text-xs">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-primary mt-1">↑ +12.5%</p>
              </div>
            ))}
          </div>

          {/* Mock Chart Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-48 rounded-lg bg-background/30 border border-border/30 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-primary/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Traffic Sources Chart</p>
              </div>
            </div>
            <div className="h-48 rounded-lg bg-background/30 border border-border/30 flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-12 h-12 text-primary/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">User Behavior Flow</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        className="text-center mt-12 pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
      >
        <p className="text-muted-foreground">
          Stay tuned for comprehensive website analytics and insights
        </p>
      </motion.div>
    </motion.div>
  );
};

export default GoogleAnalytics;