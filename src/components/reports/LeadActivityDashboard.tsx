import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
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
  GripVertical,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { leadActivityApi, type ActivityTask, type ActivityTransaction } from '@/services/leadActivityApi';
import { taskApi } from '@/services/taskApi';
import { toast } from 'sonner';

const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
type TaskStatus = typeof STATUSES[number];

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

// ─── Priority left-border color ───
const priorityBorderColor: Record<string, string> = {
  low: 'border-l-green-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500',
};

// ─── Draggable Task Card ───
const DraggableTaskCard: React.FC<{ task: ActivityTask }> = ({ task }) => {
  const { t } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-card p-3 rounded-lg space-y-1.5 border-l-2 ${priorityBorderColor[task.priority] || 'border-l-border'} ${
        isDragging ? 'opacity-30' : ''
      } cursor-grab active:cursor-grabbing`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
        <p className="text-sm font-medium text-foreground leading-tight flex-1">{task.title}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground ml-5">
        {task.due_date && (
          <span className={`flex items-center gap-1 ${
            new Date(task.due_date) < new Date() && task.status !== 'completed' && task.status !== 'cancelled'
              ? 'text-red-400 font-medium' : ''
          }`}>
            <Calendar className="w-3 h-3" />
            {formatDate(task.due_date)}
          </span>
        )}
        {task.assignee && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {task.assignee.name}
          </span>
        )}
      </div>

      <div className="pt-1 border-t border-border/40 text-[11px] text-muted-foreground truncate ml-5">
        {task.lead.first_name} {task.lead.last_name}
      </div>
    </div>
  );
};

// ─── Task Card (for overlay, no drag hooks) ───
const TaskCardOverlay: React.FC<{ task: ActivityTask }> = ({ task }) => {
  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  return (
    <div className={`glass-card p-3 rounded-lg space-y-1.5 border-l-2 ${priorityBorderColor[task.priority] || 'border-l-border'} w-[240px] shadow-lg shadow-black/40 rotate-2`}>
      <p className="text-sm font-medium text-foreground leading-tight">{task.title}</p>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {task.due_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(task.due_date)}
          </span>
        )}
        {task.assignee && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {task.assignee.name}
          </span>
        )}
      </div>
      <div className="pt-1 border-t border-border/40 text-[11px] text-muted-foreground truncate">
        {task.lead.first_name} {task.lead.last_name}
      </div>
    </div>
  );
};

// ─── Droppable Kanban Column ───
const DroppableKanbanColumn: React.FC<{
  status: TaskStatus;
  title: string;
  icon: React.ReactNode;
  tasks: ActivityTask[];
  headerColor: string;
}> = ({ status, title, icon, tasks, headerColor }) => {
  const { t } = useLanguage();
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[240px] flex flex-col rounded-lg transition-colors duration-200 ${
        isOver ? 'bg-accent/5 ring-1 ring-accent/20' : ''
      }`}
    >
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${headerColor}`}>
        {icon}
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{tasks.length}</Badge>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-dark flex-1 min-h-[80px]">
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">{t('lead-activity.no-tasks')}</p>
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
};

// ─── Transaction Log Item ───
const TransactionItem: React.FC<{ tx: ActivityTransaction; index: number }> = ({ tx, index }) => {
  const getIcon = (type: string) => {
    const map: Record<string, { icon: React.ReactNode; color: string }> = {
      creation: { icon: <PlusCircle className="w-3.5 h-3.5" />, color: 'bg-emerald-600' },
      task: { icon: <ListTodo className="w-3.5 h-3.5" />, color: 'bg-indigo-600' },
      product_update: { icon: <PackageCheck className="w-3.5 h-3.5" />, color: 'bg-cyan-600' },
      stage_change: { icon: <ArrowRightLeft className="w-3.5 h-3.5" />, color: 'bg-amber-600' },
      deal: { icon: <Handshake className="w-3.5 h-3.5" />, color: 'bg-purple-600' },
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

// ─── Main 360° Dashboard ───
const LeadActivityDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ActivityTask[]>([]);
  const [transactions, setTransactions] = useState<ActivityTransaction[]>([]);
  const [activeTask, setActiveTask] = useState<ActivityTask | null>(null);
  const validColumnsRef = useRef<Set<string>>(new Set(STATUSES));

  useEffect(() => {
    leadActivityApi.fetchActivity()
      .then((data) => {
        setTasks(data.tasks);
        setTransactions(data.transactions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const taskPriorityKPIs = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, urgent: 0 };
    tasks.forEach((tk) => { if (counts[tk.priority] !== undefined) counts[tk.priority]++; });
    return counts;
  }, [tasks]);

  const txTypeKPIs = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((tx) => { counts[tx.type] = (counts[tx.type] || 0) + 1; });
    return counts;
  }, [transactions]);

  const tasksByStatus = useMemo(() => {
    const groups: Record<string, ActivityTask[]> = { pending: [], in_progress: [], completed: [], cancelled: [] };
    tasks.forEach((tk) => { (groups[tk.status] || (groups[tk.status] = [])).push(tk); });
    return groups;
  }, [tasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = event.active.data.current?.task as ActivityTask | undefined;
    if (task) setActiveTask(task);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const targetStatus = over.id as string;
    if (!validColumnsRef.current.has(targetStatus)) return;

    const task = active.data.current?.task as ActivityTask | undefined;
    if (!task || task.status === targetStatus) return;

    const previousStatus = task.status;

    // Optimistic update
    setTasks(prev => prev.map(tk =>
      tk.id === task.id ? { ...tk, status: targetStatus as TaskStatus } : tk
    ));

    try {
      await taskApi.updateTask(task.id, { status: targetStatus as TaskStatus });
    } catch {
      // Revert on failure
      setTasks(prev => prev.map(tk =>
        tk.id === task.id ? { ...tk, status: previousStatus } : tk
      ));
      toast.error(t('tasks.modal.update-error') || 'Failed to update task');
    }
  }, [t]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
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
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-6 h-6 text-accent" />
          {t('lead-activity.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('lead-activity.subtitle')}</p>
      </div>

      {/* ─── KPI Row 1: Task Priorities ─── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <ListTodo className="w-3.5 h-3.5" />
          {t('lead-activity.tab.tasks')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label={t('tasks.priority.low')} count={taskPriorityKPIs.low} icon={<CheckCircle2 className="w-4 h-4 text-green-400" />} color="bg-green-600/20" delay={0} />
          <KPICard label={t('tasks.priority.medium')} count={taskPriorityKPIs.medium} icon={<Clock className="w-4 h-4 text-yellow-400" />} color="bg-yellow-600/20" delay={1} />
          <KPICard label={t('tasks.priority.high')} count={taskPriorityKPIs.high} icon={<AlertCircle className="w-4 h-4 text-orange-400" />} color="bg-orange-600/20" delay={2} />
          <KPICard label={t('tasks.priority.urgent')} count={taskPriorityKPIs.urgent} icon={<XCircle className="w-4 h-4 text-red-400" />} color="bg-red-600/20" delay={3} />
        </div>
      </div>

      {/* ─── KPI Row 2: Transaction Types ─── */}
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

      {/* ─── Kanban Board with Drag & Drop ─── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <ListTodo className="w-3.5 h-3.5" />
          {t('lead-activity.kanban-title')}
        </h3>
        <div className="glass-card p-5 overflow-x-auto scrollbar-dark">
          <DndContext
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 min-w-[900px]">
              <DroppableKanbanColumn
                status="pending"
                title={t('tasks.status.pending')}
                icon={<Clock className="w-4 h-4 text-yellow-400" />}
                tasks={tasksByStatus.pending}
                headerColor="border-yellow-600/40"
              />
              <DroppableKanbanColumn
                status="in_progress"
                title={t('tasks.status.in_progress')}
                icon={<ArrowRightLeft className="w-4 h-4 text-blue-400" />}
                tasks={tasksByStatus.in_progress}
                headerColor="border-blue-600/40"
              />
              <DroppableKanbanColumn
                status="completed"
                title={t('tasks.status.completed')}
                icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                tasks={tasksByStatus.completed}
                headerColor="border-green-600/40"
              />
              <DroppableKanbanColumn
                status="cancelled"
                title={t('tasks.status.cancelled')}
                icon={<XCircle className="w-4 h-4 text-muted-foreground" />}
                tasks={tasksByStatus.cancelled}
                headerColor="border-border"
              />
            </div>

            <DragOverlay>
              {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* ─── Activity Feed ─── */}
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
