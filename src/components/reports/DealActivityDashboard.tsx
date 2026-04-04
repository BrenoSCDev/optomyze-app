import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  PlusCircle,
  ArrowRightLeft,
  RefreshCw,
  XCircle,
  Trophy,
  Handshake,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealActivityApi, type DealActivityTransaction } from '@/services/dealActivityApi';
import { onDealTransaction } from '@/contexts/NotificationContext';

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
const TransactionItem: React.FC<{ tx: DealActivityTransaction; index: number }> = ({ tx, index }) => {
  const getIcon = (type: string, action: string) => {
    if (action === 'won') return { icon: <Trophy className="w-3.5 h-3.5" />, color: 'bg-emerald-600' };
    if (action === 'lost') return { icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-600' };
    const map: Record<string, { icon: React.ReactNode; color: string }> = {
      creation: { icon: <PlusCircle className="w-3.5 h-3.5" />, color: 'bg-emerald-600' },
      stage_change: { icon: <ArrowRightLeft className="w-3.5 h-3.5" />, color: 'bg-amber-600' },
      updated: { icon: <RefreshCw className="w-3.5 h-3.5" />, color: 'bg-cyan-600' },
      closed: { icon: <Trophy className="w-3.5 h-3.5" />, color: 'bg-purple-600' },
      lost: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-600' },
    };
    return map[type] || { icon: <Activity className="w-3.5 h-3.5" />, color: 'bg-muted' };
  };

  const { icon, color } = getIcon(tx.type, tx.action);

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
          {tx.sale && <span className="text-accent">• {tx.sale.name}</span>}
          {tx.sale?.lead && (
            <span className="text-muted-foreground">• {tx.sale.lead.first_name} {tx.sale.lead.last_name}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Deal Activity Dashboard ───
const DealActivityDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<DealActivityTransaction[]>([]);

  useEffect(() => {
    dealActivityApi.fetchTransactions()
      .then((data) => {
        setTransactions(data.transactions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Real-time: prepend incoming deal transactions
  useEffect(() => {
    return onDealTransaction((payload) => {
      const mapped: DealActivityTransaction = {
        id: payload.id,
        sale_id: payload.deal.id,
        company_id: 0,
        user_id: payload.user?.id ?? 0,
        type: payload.txType,
        action: payload.action,
        description: payload.description,
        source: payload.source,
        created_at: payload.created_at,
        updated_at: payload.created_at,
        sale: {
          id: payload.deal.id,
          lead_id: payload.deal.lead?.id ?? 0,
          user_id: payload.user?.id ?? 0,
          name: payload.deal.name,
          total: String(payload.deal.total ?? '0'),
          created_at: payload.created_at,
          charges_total: 0,
          final_total: payload.deal.total ?? 0,
          lead: payload.deal.lead ? {
            id: payload.deal.lead.id,
            first_name: payload.deal.lead.first_name,
            last_name: payload.deal.lead.last_name,
            email: '',
            phone: '',
          } : null as any,
          charges: [],
        },
        user: payload.user ? { id: payload.user.id, name: payload.user.name, email: '' } : null,
      };
      setTransactions(prev => {
        if (prev.some(t => t.id === mapped.id)) return prev;
        return [mapped, ...prev];
      });
    });
  }, []);

  const txTypeKPIs = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((tx) => {
      counts[tx.type] = (counts[tx.type] || 0) + 1;
      // Also count won/lost actions separately
      if (tx.action === 'won') counts['closed'] = (counts['closed'] || 0) + 1;
      if (tx.action === 'lost') counts['lost'] = (counts['lost'] || 0) + 1;
    });
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
    { type: 'creation', label: t('deal-activity.kpi.creation'), icon: <PlusCircle className="w-4 h-4 text-emerald-400" />, color: 'bg-emerald-600/20' },
    { type: 'stage_change', label: t('deal-activity.kpi.stage-change'), icon: <ArrowRightLeft className="w-4 h-4 text-amber-400" />, color: 'bg-amber-600/20' },
    { type: 'updated', label: t('deal-activity.kpi.updated'), icon: <RefreshCw className="w-4 h-4 text-cyan-400" />, color: 'bg-cyan-600/20' },
    { type: 'closed', label: t('deal-activity.kpi.closed'), icon: <Trophy className="w-4 h-4 text-purple-400" />, color: 'bg-purple-600/20' },
    { type: 'lost', label: t('deal-activity.kpi.lost'), icon: <XCircle className="w-4 h-4 text-red-400" />, color: 'bg-red-600/20' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          {t('deal-activity.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('deal-activity.subtitle')}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          {t('deal-activity.tab.transactions')}
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
          {t('deal-activity.activity-log')}
        </h3>
        <div className="glass-card p-5">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('deal-activity.no-transactions')}</p>
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

export default DealActivityDashboard;
