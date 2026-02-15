import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ListTodo,
  PlusCircle,
  PackageCheck,
  ArrowRightLeft,
  Handshake,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { leadActivityApi, type ActivityTask, type ActivityTransaction } from '@/services/leadActivityApi';

// ─── KPI Card ───
const KPICard: React.FC<{
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}> = ({ label, count, icon, color, delay = 0 }) => (
  <motion.div
    className="glass-card p-5 flex items-center gap-4"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.08 }}
  >
    <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{count}</p>
    </div>
  </motion.div>
);

// ─── Task Kanban Column ───
const KanbanColumn: React.FC<{
  title: string;
  icon: React.ReactNode;
  tasks: ActivityTask[];
  color: string;
}> = ({ title, icon, tasks, color }) => {
  const { t } = useLanguage();

  const getPriorityColor = (p: string) => {
    const map: Record<string, string> = {
      low: 'bg-muted text-muted-foreground border-border',
      medium: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
      high: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
      urgent: 'bg-red-600/20 text-red-400 border-red-600/30',
    };
    return map[p] || map.medium;
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  return (
    <div className="flex-1 min-w-[260px]">
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${color}`}>
        {icon}
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <Badge variant="secondary" className="ml-auto text-xs">{tasks.length}</Badge>
      </div>
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">{t('lead-activity.no-tasks')}</p>
        ) : (
          tasks.map((task) => (
            <motion.div
              key={task.id}
              className="glass-card p-3 rounded-lg space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-sm font-medium text-foreground leading-tight">{task.title}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge className={`text-[10px] border ${getPriorityColor(task.priority)}`}>
                  {t(`tasks.priority.${task.priority}`)}
                </Badge>
              </div>
              {task.due_date && (
                <div className={`flex items-center gap-1 text-[11px] ${
                  new Date(task.due_date) < new Date() && task.status !== 'completed' && task.status !== 'cancelled'
                    ? 'text-red-400' : 'text-muted-foreground'
                }`}>
                  <Calendar className="w-3 h-3" />
                  {formatDate(task.due_date)}
                </div>
              )}
              {task.assignee && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <User className="w-3 h-3" />
                  {task.assignee.name}
                </div>
              )}
              <div className="pt-1.5 border-t border-border/50 flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="truncate">{task.lead.first_name} {task.lead.last_name}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Transaction Log ───
const TransactionItem: React.FC<{ tx: ActivityTransaction; index: number }> = ({ tx, index }) => {
  const getIcon = (type: string) => {
    const map: Record<string, { icon: React.ReactNode; color: string }> = {
      creation: { icon: <PlusCircle className="w-4 h-4" />, color: 'bg-emerald-600' },
      task: { icon: <ListTodo className="w-4 h-4" />, color: 'bg-indigo-600' },
      product_update: { icon: <PackageCheck className="w-4 h-4" />, color: 'bg-cyan-600' },
      stage_change: { icon: <ArrowRightLeft className="w-4 h-4" />, color: 'bg-amber-600' },
      deal: { icon: <Handshake className="w-4 h-4" />, color: 'bg-purple-600' },
    };
    return map[type] || { icon: <Activity className="w-4 h-4" />, color: 'bg-muted' };
  };

  const { icon, color } = getIcon(tx.type);

  const formatTimestamp = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      timeZone: 'UTC',
    });
  };

  return (
    <motion.div
      className="flex gap-3 py-3"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center shrink-0 text-white`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{tx.description}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-muted-foreground">
          <span>{formatTimestamp(tx.created_at)}</span>
          {tx.user && <span>{tx.user.name}</span>}
          <span className="text-accent">{tx.lead.first_name} {tx.lead.last_name}</span>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Dashboard ───
const LeadActivityDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ActivityTask[]>([]);
  const [transactions, setTransactions] = useState<ActivityTransaction[]>([]);

  useEffect(() => {
    leadActivityApi.fetchActivity()
      .then((data) => {
        setTasks(data.tasks);
        setTransactions(data.transactions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Task KPIs — by priority
  const taskPriorityKPIs = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, urgent: 0 };
    tasks.forEach((t) => { if (counts[t.priority] !== undefined) counts[t.priority]++; });
    return counts;
  }, [tasks]);

  // Transaction KPIs — by type
  const txTypeKPIs = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((tx) => { counts[tx.type] = (counts[tx.type] || 0) + 1; });
    return counts;
  }, [transactions]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const groups: Record<string, ActivityTask[]> = { pending: [], in_progress: [], completed: [], cancelled: [] };
    tasks.forEach((t) => { (groups[t.status] || (groups[t.status] = [])).push(t); });
    return groups;
  }, [tasks]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  const txKpiConfig: { type: string; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'creation', label: t('lead-activity.kpi.creation'), icon: <PlusCircle className="w-5 h-5 text-emerald-400" />, color: 'bg-emerald-600/20' },
    { type: 'task', label: t('lead-activity.kpi.task'), icon: <ListTodo className="w-5 h-5 text-indigo-400" />, color: 'bg-indigo-600/20' },
    { type: 'product_update', label: t('lead-activity.kpi.product-update'), icon: <PackageCheck className="w-5 h-5 text-cyan-400" />, color: 'bg-cyan-600/20' },
    { type: 'stage_change', label: t('lead-activity.kpi.stage-change'), icon: <ArrowRightLeft className="w-5 h-5 text-amber-400" />, color: 'bg-amber-600/20' },
    { type: 'deal', label: t('lead-activity.kpi.deal'), icon: <Handshake className="w-5 h-5 text-purple-400" />, color: 'bg-purple-600/20' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-6 h-6 text-accent" />
          {t('lead-activity.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('lead-activity.subtitle')}</p>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="tasks" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
            <ListTodo className="w-4 h-4 mr-1.5" />
            {t('lead-activity.tab.tasks')}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
            <Activity className="w-4 h-4 mr-1.5" />
            {t('lead-activity.tab.transactions')}
          </TabsTrigger>
        </TabsList>

        {/* ─── Tasks Tab ─── */}
        <TabsContent value="tasks" className="space-y-6 mt-6">
          {/* Task Priority KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label={t('tasks.priority.low')} count={taskPriorityKPIs.low} icon={<CheckCircle2 className="w-5 h-5 text-muted-foreground" />} color="bg-muted" delay={0} />
            <KPICard label={t('tasks.priority.medium')} count={taskPriorityKPIs.medium} icon={<Clock className="w-5 h-5 text-blue-400" />} color="bg-blue-600/20" delay={1} />
            <KPICard label={t('tasks.priority.high')} count={taskPriorityKPIs.high} icon={<AlertCircle className="w-5 h-5 text-orange-400" />} color="bg-orange-600/20" delay={2} />
            <KPICard label={t('tasks.priority.urgent')} count={taskPriorityKPIs.urgent} icon={<XCircle className="w-5 h-5 text-red-400" />} color="bg-red-600/20" delay={3} />
          </div>

          {/* Kanban Board */}
          <div className="glass-card p-6 overflow-x-auto">
            <div className="flex gap-4 min-w-[900px]">
              <KanbanColumn
                title={t('tasks.status.pending')}
                icon={<Clock className="w-4 h-4 text-yellow-400" />}
                tasks={tasksByStatus.pending}
                color="border-yellow-600/40"
              />
              <KanbanColumn
                title={t('tasks.status.in_progress')}
                icon={<ArrowRightLeft className="w-4 h-4 text-blue-400" />}
                tasks={tasksByStatus.in_progress}
                color="border-blue-600/40"
              />
              <KanbanColumn
                title={t('tasks.status.completed')}
                icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                tasks={tasksByStatus.completed}
                color="border-green-600/40"
              />
              <KanbanColumn
                title={t('tasks.status.cancelled')}
                icon={<XCircle className="w-4 h-4 text-muted-foreground" />}
                tasks={tasksByStatus.cancelled}
                color="border-border"
              />
            </div>
          </div>
        </TabsContent>

        {/* ─── Transactions Tab ─── */}
        <TabsContent value="transactions" className="space-y-6 mt-6">
          {/* Transaction Type KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {txKpiConfig.map((cfg, i) => (
              <KPICard
                key={cfg.type}
                label={cfg.label}
                count={txTypeKPIs[cfg.type] || 0}
                icon={cfg.icon}
                color={cfg.color}
                delay={i}
              />
            ))}
          </div>

          {/* Activity Log */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              {t('lead-activity.activity-log')}
            </h3>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('lead-activity.no-transactions')}</p>
            ) : (
              <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto custom-scrollbar">
                {transactions.map((tx, i) => (
                  <TransactionItem key={tx.id} tx={tx} index={i} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadActivityDashboard;
