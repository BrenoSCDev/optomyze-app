import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { onLeadTransaction } from '@/contexts/NotificationContext';
import {
  Activity,
  PlusCircle,
  PackageCheck,
  ArrowRightLeft,
  Handshake,
  ListTodo,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { leadActivityApi, type ActivityTransaction } from '@/services/leadActivityApi';

// ─── KPI Card ───
const KPICard: React.FC<{
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}> = ({ label, count, icon, color, delay = 0 }) => (
  <motion.div
    className="glass-card p-4 flex items-center gap-3"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.06 }}
  >
    <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
      <p className="text-xl font-bold text-foreground leading-none">{count}</p>
    </div>
  </motion.div>
);

// ─── Transaction Log Item ───
const TransactionItem: React.FC<{ tx: ActivityTransaction; index: number }> = ({ tx, index }) => {
  const getIcon = (type: string) => {
    const map: Record<string, { icon: React.ReactNode; color: string }> = {
      creation: { icon: <PlusCircle className="w-3.5 h-3.5" />, color: 'bg-emerald-600' },
      task: { icon: <ListTodo className="w-3.5 h-3.5" />, color: 'bg-indigo-600' },
      product_update: { icon: <PackageCheck className="w-3.5 h-3.5" />, color: 'bg-cyan-600' },
      stage_change: { icon: <ArrowRightLeft className="w-3.5 h-3.5" />, color: 'bg-amber-600' },
      deal: { icon: <Handshake className="w-3.5 h-3.5" />, color: 'bg-purple-600' },
      whatsapp_chat: { icon: <FaWhatsapp className="w-3.5 h-3.5" />, color: 'bg-green-600' },
    };
    return map[type] || { icon: <Activity className="w-3.5 h-3.5" />, color: 'bg-muted' };
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
      className="flex gap-3 py-2.5"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.4) }}
    >
      <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center shrink-0 text-white`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-foreground leading-snug">{tx.description}</p>
        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
          <span>{formatTimestamp(tx.created_at)}</span>
          {tx.user && <span>• {tx.user.name}</span>}
          <span className="text-accent">• {tx.lead.first_name} {tx.lead.last_name}</span>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Transactions Dashboard ───
const LeadActivityDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<ActivityTransaction[]>([]);

  useEffect(() => {
    leadActivityApi.fetchTransactions()
      .then((data) => {
        setTransactions(data.transactions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Real-time: prepend incoming lead transactions
  useEffect(() => {
    return onLeadTransaction((tx) => {
      const mapped: ActivityTransaction = {
        id: tx.id,
        lead_id: tx.lead.id,
        user_id: tx.user?.id ?? null,
        type: tx.txType,
        source: tx.source,
        action: tx.action,
        description: tx.description,
        created_at: tx.created_at,
        lead: {
          id: tx.lead.id,
          first_name: tx.lead.first_name,
          last_name: tx.lead.last_name,
          email: '',
          company_id: 0,
        },
        user: tx.user ? { id: tx.user.id, name: tx.user.name, email: '' } : null,
      };
      setTransactions(prev => {
        if (prev.some(t => t.id === mapped.id)) return prev;
        return [mapped, ...prev];
      });
    });
  }, []);

  const txTypeKPIs = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((tx) => { counts[tx.type] = (counts[tx.type] || 0) + 1; });
    return counts;
  }, [transactions]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  const txKpiConfig = [
    { type: 'creation', label: t('lead-activity.kpi.creation'), icon: <PlusCircle className="w-4 h-4 text-emerald-400" />, color: 'bg-emerald-600/20' },
    { type: 'task', label: t('lead-activity.kpi.task'), icon: <ListTodo className="w-4 h-4 text-indigo-400" />, color: 'bg-indigo-600/20' },
    { type: 'product_update', label: t('lead-activity.kpi.product-update'), icon: <PackageCheck className="w-4 h-4 text-cyan-400" />, color: 'bg-cyan-600/20' },
    { type: 'stage_change', label: t('lead-activity.kpi.stage-change'), icon: <ArrowRightLeft className="w-4 h-4 text-amber-400" />, color: 'bg-amber-600/20' },
    { type: 'deal', label: t('lead-activity.kpi.deal'), icon: <Handshake className="w-4 h-4 text-purple-400" />, color: 'bg-purple-600/20' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-6 h-6 text-accent" />
          {t('lead-activity.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('lead-activity.subtitle')}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          {t('lead-activity.tab.transactions')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {txKpiConfig.map((cfg, i) => (
            <KPICard key={cfg.type} label={cfg.label} count={txTypeKPIs[cfg.type] || 0} icon={cfg.icon} color={cfg.color} delay={i} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          {t('lead-activity.activity-log')}
        </h3>
        <div className="glass-card p-5">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('lead-activity.no-transactions')}</p>
          ) : (
            <div className="divide-y divide-border/40 max-h-[500px] overflow-y-auto scrollbar-dark pr-1">
              {transactions.map((tx, i) => (
                <TransactionItem key={tx.id} tx={tx} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadActivityDashboard;
