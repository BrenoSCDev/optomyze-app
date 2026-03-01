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
  ListTodo,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  GripVertical,
  ArrowRightLeft,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { leadActivityApi, type ActivityTask } from '@/services/leadActivityApi';
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  return (
    <div
      ref={setNodeRef}
      className={`glass-card p-3 rounded-lg space-y-1.5 border-l-2 ${priorityBorderColor[task.priority] || 'border-l-border'} ${
        isDragging ? 'opacity-20 scale-95' : ''
      } cursor-grab active:cursor-grabbing transition-opacity`}
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

// ─── Task Card Overlay ───
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
  isDragActive: boolean;
}> = ({ status, title, icon, tasks, headerColor, isDragActive }) => {
  const { t } = useLanguage();
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[240px] flex flex-col rounded-lg transition-all duration-200 p-2 ${
        isOver ? 'bg-accent/5 ring-1 ring-accent/20' : ''
      }`}
    >
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${headerColor}`}>
        {icon}
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{tasks.length}</Badge>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-dark flex-1 min-h-[80px]">
        {isDragActive && isOver && (
          <motion.div
            className="border-2 border-dashed border-accent/40 bg-accent/5 rounded-lg p-3 min-h-[60px] flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-xs text-accent font-medium">{t('lead-activity.drop-here')}</p>
          </motion.div>
        )}

        {tasks.length === 0 && !isOver ? (
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

// ─── Main Tasks Dashboard ───
const TasksDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ActivityTask[]>([]);
  const [activeTask, setActiveTask] = useState<ActivityTask | null>(null);
  const validColumnsRef = useRef<Set<string>>(new Set(STATUSES));

  useEffect(() => {
    leadActivityApi.fetchTasks()
      .then((data) => {
        setTasks(data.tasks);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const taskPriorityKPIs = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, urgent: 0 };
    tasks.forEach((tk) => { if (counts[tk.priority] !== undefined) counts[tk.priority]++; });
    return counts;
  }, [tasks]);

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

    setTasks(prev => prev.map(tk =>
      tk.id === task.id ? { ...tk, status: targetStatus as TaskStatus } : tk
    ));

    try {
      await taskApi.updateTask(task.id, { status: targetStatus as TaskStatus });
    } catch {
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
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ListTodo className="w-6 h-6 text-accent" />
          {t('reports.tasks')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('tasks.dashboard.subtitle')}</p>
      </div>

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

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <ListTodo className="w-3.5 h-3.5" />
          {t('lead-activity.kanban-title')}
        </h3>
        <DndContext
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="glass-card p-5 overflow-x-auto scrollbar-dark">
            <div className="flex gap-4 min-w-[900px]">
              <DroppableKanbanColumn
                status="pending"
                title={t('tasks.status.pending')}
                icon={<Clock className="w-4 h-4 text-yellow-400" />}
                tasks={tasksByStatus.pending}
                headerColor="border-yellow-600/40"
                isDragActive={!!activeTask}
              />
              <DroppableKanbanColumn
                status="in_progress"
                title={t('tasks.status.in_progress')}
                icon={<ArrowRightLeft className="w-4 h-4 text-blue-400" />}
                tasks={tasksByStatus.in_progress}
                headerColor="border-blue-600/40"
                isDragActive={!!activeTask}
              />
              <DroppableKanbanColumn
                status="completed"
                title={t('tasks.status.completed')}
                icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                tasks={tasksByStatus.completed}
                headerColor="border-green-600/40"
                isDragActive={!!activeTask}
              />
              <DroppableKanbanColumn
                status="cancelled"
                title={t('tasks.status.cancelled')}
                icon={<XCircle className="w-4 h-4 text-muted-foreground" />}
                tasks={tasksByStatus.cancelled}
                headerColor="border-border"
                isDragActive={!!activeTask}
              />
            </div>
          </div>

          <DragOverlay dropAnimation={{
            duration: 250,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
            {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default TasksDashboard;
