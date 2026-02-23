/**
 * PLAN USAGE DASHBOARD
 * 
 * Displays current plan information and usage metrics.
 * Fetches data from /api/metrics/plan-usage endpoint.
 */

import { useEffect, useState } from 'react';
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
  Sparkles,
  Infinity,
  Building2,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/services/api';
import { IoFunnelOutline } from 'react-icons/io5';

interface PlanUsageResponse {
  subscription_plan: string;
  leads: MetricData;
  users: MetricData;
  products: MetricData;
  storage: MetricData;
  active_deals: MetricData;
  tasks: MetricData;
  integrations: MetricData;
  sales_funnels: MetricData;
  deal_funnels: MetricData;
  companies: MetricData;
  messages: MetricData;
}

interface MetricData {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  is_unlimited: boolean;
}

interface UsageMetric {
  id: string;
  label: string;
  current: number;
  limit: number;
  unit?: string;
  icon: React.ReactNode;
  isUnlimited: boolean;
  percentage: number;
}

// Plan badge colors
const planBadgeVariants: Record<string, string> = {
  basic: 'bg-muted text-muted-foreground',
  premium: 'bg-primary/20 text-primary border border-primary/30',
  enterprise: 'bg-accent/20 text-accent border border-accent/30',
};

// Usage helpers
const coercePercentage = (value: unknown): number => {
  let num: number | null = null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    num = value;
  } else if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) num = parsed;
  }

  if (num === null) {
    if (import.meta.env.DEV && value !== undefined && value !== null) {
      console.warn('[PlanUsage] Unexpected percentage value:', value);
    }
    return 0;
  }

  return Math.min(100, Math.max(0, num));
};

// Usage card component
const UsageCard = ({ metric }: { metric: UsageMetric }) => {
  const { t } = useLanguage();
  const percentage = metric.isUnlimited ? 0 : coercePercentage(metric.percentage);
  const isHighUsage = !metric.isUnlimited && percentage >= 80;
  const isCritical = !metric.isUnlimited && percentage >= 95;
  
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
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                / {metric.isUnlimited ? (
                  <Infinity className="h-4 w-4" />
                ) : (
                  formatValue(metric.limit, metric.unit)
                )}
              </span>
            </div>
            
            <Progress 
              value={percentage} 
              className={`h-2 bg-gray-800 ${
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
                {metric.isUnlimited ? t('planUsage.unlimited') : `${percentage.toFixed(1)}% ${t('planUsage.used')}`}
              </span>
              <span className="text-muted-foreground">
                {metric.isUnlimited ? '' : `${formatValue(metric.limit - metric.current, metric.unit)} ${t('planUsage.remaining')}`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-8">
    <div>
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-72" />
    </div>
    <Skeleton className="h-32 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  </div>
);

interface PlanUsageProps {
  demoMode?: boolean;
  demoData?: any;
}

const PlanUsage = ({ demoMode = false, demoData }: PlanUsageProps) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(!demoMode);
  const [planData, setPlanData] = useState<PlanUsageResponse | null>(demoMode ? demoData : null);

  useEffect(() => {
    if (demoMode) return;
    const fetchPlanUsage = async () => {
      try {
        const response = await api.get('/api/metrics/plan-usage');
        setPlanData(response.data);
      } catch (error) {
        console.error('Error fetching plan usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanUsage();
  }, [demoMode]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!planData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.error')}</p>
      </div>
    );
  }

  const usageMetrics: UsageMetric[] = [
    {
      id: 'leads',
      label: t('planUsage.metrics.leads'),
      current: planData.leads.used,
      limit: planData.leads.limit,
      icon: <Users className="h-5 w-5" />,
      isUnlimited: planData.leads.is_unlimited,
      percentage: planData.leads.percentage,
    },
    {
      id: 'users',
      label: t('planUsage.metrics.users'),
      current: planData.users.used,
      limit: planData.users.limit,
      icon: <Database className="h-5 w-5" />,
      isUnlimited: planData.users.is_unlimited,
      percentage: planData.users.percentage,
    },
    {
      id: 'storage',
      label: t('planUsage.metrics.storage'),
      current: planData.storage.used,
      limit: planData.storage.limit,
      unit: 'GB',
      icon: <HardDrive className="h-5 w-5" />,
      isUnlimited: planData.storage.is_unlimited,
      percentage: planData.storage.percentage,
    },
    {
      id: 'deals',
      label: t('planUsage.metrics.deals'),
      current: planData.active_deals.used,
      limit: planData.active_deals.limit,
      icon: <Briefcase className="h-5 w-5" />,
      isUnlimited: planData.active_deals.is_unlimited,
      percentage: planData.active_deals.percentage,
    },
    {
      id: 'tasks',
      label: t('planUsage.metrics.tasks'),
      current: planData.tasks.used,
      limit: planData.tasks.limit,
      icon: <CheckSquare className="h-5 w-5" />,
      isUnlimited: planData.tasks.is_unlimited,
      percentage: planData.tasks.percentage,
    },
    {
      id: 'integrations',
      label: t('planUsage.metrics.integrations'),
      current: planData.integrations.used,
      limit: planData.integrations.limit,
      icon: <Plug className="h-5 w-5" />,
      isUnlimited: planData.integrations.is_unlimited,
      percentage: planData.integrations.percentage,
    },
    {
      id: 'products',
      label: t('planUsage.metrics.products'),
      current: planData.products.used,
      limit: planData.products.limit,
      icon: <Package className="h-5 w-5" />,
      isUnlimited: planData.products.is_unlimited,
      percentage: planData.products.percentage,
    },
    {
      id: 'sales_funnels',
      label: t('planUsage.metrics.salesFunnels'),
      current: planData.sales_funnels.used,
      limit: planData.sales_funnels.limit,
      icon: <IoFunnelOutline className="h-5 w-5" />,
      isUnlimited: planData.sales_funnels.is_unlimited,
      percentage: planData.sales_funnels.percentage,
    },
    {
      id: 'deal_funnels',
      label: t('planUsage.metrics.dealFunnels'),
      current: planData.deal_funnels.used,
      limit: planData.deal_funnels.limit,
      icon: <IoFunnelOutline className="h-5 w-5" />,
      isUnlimited: planData.deal_funnels.is_unlimited,
      percentage: planData.deal_funnels.percentage,
    },
    {
      id: 'companies',
      label: t('planUsage.metrics.companies'),
      current: planData.companies.used,
      limit: planData.companies.limit,
      icon: <Building2 className="h-5 w-5" />,
      isUnlimited: planData.companies.is_unlimited,
      percentage: planData.companies.percentage,
    },
    {
      id: 'messages',
      label: t('planUsage.metrics.messages'),
      current: planData.messages.used,
      limit: planData.messages.limit,
      icon: <MessageSquare className="h-5 w-5" />,
      isUnlimited: planData.messages.is_unlimited,
      percentage: planData.messages.percentage,
    },
    ...((planData as any).teams ? [{
      id: 'teams',
      label: 'Teams',
      current: (planData as any).teams.used,
      limit: (planData as any).teams.limit,
      icon: <Users className="h-5 w-5" />,
      isUnlimited: (planData as any).teams.is_unlimited,
      percentage: (planData as any).teams.percentage,
    }] : []),
    ...((planData as any).api_requests ? [{
      id: 'api_requests',
      label: 'API Requests',
      current: (planData as any).api_requests.used,
      limit: (planData as any).api_requests.limit,
      icon: <Plug className="h-5 w-5" />,
      isUnlimited: (planData as any).api_requests.is_unlimited,
      percentage: (planData as any).api_requests.percentage,
    }] : []),
    ...((planData as any).api_tokens ? [{
      id: 'api_tokens',
      label: 'API Tokens',
      current: (planData as any).api_tokens.used,
      limit: (planData as any).api_tokens.limit,
      icon: <Database className="h-5 w-5" />,
      isUnlimited: (planData as any).api_tokens.is_unlimited,
      percentage: (planData as any).api_tokens.percentage,
    }] : []),
  ];

  const planName = planData.subscription_plan.charAt(0).toUpperCase() + planData.subscription_plan.slice(1);
  const badgeClass = planBadgeVariants[planData.subscription_plan] || planBadgeVariants.basic;

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
                      {planName} {t('planUsage.plan')}
                    </h2>
                    <Badge className={badgeClass}>
                      {t('planUsage.activePlan')}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{t('planUsage.planDescription')}</p>
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
                  {usageMetrics.filter(m => !m.isUnlimited && m.percentage >= 80).length}
                </p>
                <p className="text-sm text-muted-foreground">{t('planUsage.nearLimit')}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/20">
                <p className="text-2xl font-bold text-foreground">
                  {usageMetrics.filter(m => !m.isUnlimited && m.percentage >= 95).length}
                </p>
                <p className="text-sm text-muted-foreground">{t('planUsage.critical')}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/20">
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(usageMetrics.filter(m => !m.isUnlimited).reduce((acc, m) => acc + m.percentage, 0) / usageMetrics.filter(m => !m.isUnlimited).length) || 0}%
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
