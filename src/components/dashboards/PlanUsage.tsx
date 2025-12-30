/**
 * PLAN USAGE DASHBOARD
 * 
 * Displays current plan information and usage metrics.
 * Uses mock data that can be easily replaced with real backend data later.
 */

import { motion } from 'framer-motion';
import { 
  Users, 
  Database, 
  HardDrive, 
  Briefcase, 
  CheckSquare, 
  Plug, 
  Package,
  AlertTriangle,
  Crown,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

// Mock data structure - ready for backend replacement
interface PlanData {
  name: 'Basic' | 'Premium' | 'Enterprise';
  description: string;
  billingCycle: 'monthly' | 'yearly';
  renewalDate: string;
}

interface UsageMetric {
  id: string;
  label: string;
  current: number;
  limit: number;
  unit?: string;
  icon: React.ReactNode;
}

// Mock plan data
const mockPlanData: PlanData = {
  name: 'Premium',
  description: 'Full access to all CRM features with enhanced limits',
  billingCycle: 'monthly',
  renewalDate: '2025-01-30',
};

// Mock usage metrics
const getMockUsageMetrics = (t: (key: string) => string): UsageMetric[] => [
  {
    id: 'leads',
    label: t('planUsage.metrics.leads'),
    current: 847,
    limit: 1000,
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: 'users',
    label: t('planUsage.metrics.users'),
    current: 8,
    limit: 10,
    icon: <Database className="h-5 w-5" />,
  },
  {
    id: 'storage',
    label: t('planUsage.metrics.storage'),
    current: 4.2,
    limit: 10,
    unit: 'GB',
    icon: <HardDrive className="h-5 w-5" />,
  },
  {
    id: 'deals',
    label: t('planUsage.metrics.deals'),
    current: 156,
    limit: 500,
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    id: 'tasks',
    label: t('planUsage.metrics.tasks'),
    current: 89,
    limit: 200,
    icon: <CheckSquare className="h-5 w-5" />,
  },
  {
    id: 'integrations',
    label: t('planUsage.metrics.integrations'),
    current: 4,
    limit: 5,
    icon: <Plug className="h-5 w-5" />,
  },
  {
    id: 'products',
    label: t('planUsage.metrics.products'),
    current: 45,
    limit: 100,
    icon: <Package className="h-5 w-5" />,
  },
];

// Plan badge colors
const planBadgeVariants = {
  Basic: 'bg-muted text-muted-foreground',
  Premium: 'bg-primary/20 text-primary border border-primary/30',
  Enterprise: 'bg-accent/20 text-accent border border-accent/30',
};

// Usage card component
const UsageCard = ({ metric }: { metric: UsageMetric }) => {
  const percentage = (metric.current / metric.limit) * 100;
  const isHighUsage = percentage >= 80;
  const isCritical = percentage >= 95;
  
  const formatValue = (value: number, unit?: string) => {
    if (unit) return `${value} ${unit}`;
    return value.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card border-white/10 hover:border-primary/30 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isCritical 
                  ? 'bg-destructive/20 text-destructive' 
                  : isHighUsage 
                    ? 'bg-yellow-500/20 text-yellow-500' 
                    : 'bg-primary/20 text-primary'
              }`}>
                {metric.icon}
              </div>
              <span className="font-medium text-foreground">{metric.label}</span>
            </div>
            {isHighUsage && (
              <AlertTriangle className={`h-4 w-4 ${isCritical ? 'text-destructive' : 'text-yellow-500'}`} />
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {formatValue(metric.current, metric.unit)}
              </span>
              <span className="text-sm text-muted-foreground">
                / {formatValue(metric.limit, metric.unit)}
              </span>
            </div>
            
            <Progress 
              value={percentage} 
              className={`h-2 ${
                isCritical 
                  ? '[&>div]:bg-destructive' 
                  : isHighUsage 
                    ? '[&>div]:bg-yellow-500' 
                    : ''
              }`}
            />
            
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${
                isCritical 
                  ? 'text-destructive' 
                  : isHighUsage 
                    ? 'text-yellow-500' 
                    : 'text-muted-foreground'
              }`}>
                {percentage.toFixed(1)}% used
              </span>
              <span className="text-muted-foreground">
                {formatValue(metric.limit - metric.current, metric.unit)} remaining
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const PlanUsage = () => {
  const { t } = useLanguage();
  const usageMetrics = getMockUsageMetrics(t);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t('planUsage.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('planUsage.description')}
        </p>
      </motion.div>

      {/* Plan Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="glass-card border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-foreground">
                      {mockPlanData.name} {t('planUsage.plan')}
                    </h2>
                    <Badge className={planBadgeVariants[mockPlanData.name]}>
                      {t('planUsage.activePlan')}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{mockPlanData.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('planUsage.renewsOn')}: {new Date(mockPlanData.renewalDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Sparkles className="h-4 w-4" />
                {t('planUsage.upgradePlan')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Usage Metrics Grid */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {t('planUsage.usageOverview')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {usageMetrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <UsageCard metric={metric} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Usage Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">{t('planUsage.usageSummary')}</CardTitle>
            <CardDescription>{t('planUsage.summaryDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/20">
                <p className="text-2xl font-bold text-foreground">
                  {usageMetrics.filter(m => (m.current / m.limit) >= 0.8).length}
                </p>
                <p className="text-sm text-muted-foreground">{t('planUsage.nearLimit')}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/20">
                <p className="text-2xl font-bold text-foreground">
                  {usageMetrics.filter(m => (m.current / m.limit) >= 0.95).length}
                </p>
                <p className="text-sm text-muted-foreground">{t('planUsage.critical')}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/20">
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(usageMetrics.reduce((acc, m) => acc + (m.current / m.limit) * 100, 0) / usageMetrics.length)}%
                </p>
                <p className="text-sm text-muted-foreground">{t('planUsage.avgUsage')}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/20">
                <p className="text-2xl font-bold text-foreground">{usageMetrics.length}</p>
                <p className="text-sm text-muted-foreground">{t('planUsage.totalMetrics')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PlanUsage;
