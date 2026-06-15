import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  GripVertical,
  ArrowRightLeft,
  Plus,
  Pencil,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { recordsApi, type ActivityTask } from '@/services/recordsApi';
import { taskApi, type Task } from '@/services/taskApi';
import { toast } from 'sonner';
import TaskCreationModal from '@/components/leads/TaskCreationModal';

const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
type TaskStatus = typeof STATUSES[number];

// ─── Priority left-border color ───
const priorityBorderColor: Record<string, string> = {
  low: 'border-l-green-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500',
};

const priorityDotColor: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

// ─── Draggable Task Card ───
const DraggableTaskCard: React.FC<{
  task: ActivityTask;
  onEdit: (task: ActivityTask) => void;
  onDelete: (task: ActivityTask) => void;
}> = ({ task, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== 'completed' &&
    task.status !== 'cancelled';

  return (
    <div
      ref={setNodeRef}
      className={`group glass-card rounded-lg border-l-2 ${priorityBorderColor[task.priority] || 'border-l-border'} ${
        isDragging ? 'opacity-20 scale-95' : ''
      } transition-opacity`}
    >
      <div className="p-3 space-y-2">
        {/* Top row: drag handle + title + actions */}
        <div className="flex items-start gap-1.5">
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing mt-0.5 shrink-0 touch-none"
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40" />
          </div>

          <p
            className="text-sm font-medium text-foreground leading-tight flex-1 min-w-0 cursor-pointer hover:text-accent transition-colors"
            onClick={() => onEdit(task)}
          >
            {task.title}
          </p>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              title="Edit"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
              onClick={(e) => { e.stopPropagation(); onDelete(task); }}
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground pl-5">
          {task.due_date && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 font-medium' : ''}`}>
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

        {/* Lead row */}
        {task.lead ? (
          <div className="pl-5 text-[11px] text-muted-foreground truncate border-t border-border/30 pt-1.5">
            {task.lead.first_name} {task.lead.last_name}
          </div>
        ) : (
          <div className="pl-5 text-[11px] text-muted-foreground/40 border-t border-border/30 pt-1.5 flex items-center gap-1">
            <LinkIcon className="w-2.5 h-2.5" />
            No lead
          </div>
        )}
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
      {task.lead && (
        <div className="pt-1 border-t border-border/40 text-[11px] text-muted-foreground truncate">
          {task.lead.first_name} {task.lead.last_name}
        </div>
      )}
    </div>
  );
};

// ─── Droppable Kanban Column ───
const DroppableKanbanColumn: React.FC<{
  status: TaskStatus;
  title: string;
  icon: React.ReactNode;
  tasks: ActivityTask[];
  accentClass: string;
  isDragActive: boolean;
  onEdit: (task: ActivityTask) => void;
  onDelete: (task: ActivityTask) => void;
}> = ({ status, title, icon, tasks, accentClass, isDragActive, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[240px] flex flex-col rounded-lg transition-all duration-200 ${
        isOver ? 'bg-accent/5 ring-1 ring-accent/20' : ''
      }`}
    >
      <div className={`flex items-center gap-2 mb-3 px-1 pb-2.5 border-b ${accentClass}`}>
        {icon}
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="ml-auto text-xs font-semibold text-muted-foreground tabular-nums">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto pr-1 scrollbar-dark flex-1 min-h-[80px] max-h-[calc(100vh-340px)]">
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
          <p className="text-xs text-muted-foreground/50 text-center py-8">{t('lead-activity.no-tasks')}</p>
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
};

// ─── Delete Confirmation Modal ───
const DeleteConfirmModal: React.FC<{
  task: ActivityTask;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ task, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
    <motion.div
      className="glass-card w-full max-w-sm p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-red-500/15 shrink-0">
          <Trash2 className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Delete task</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            "{task.title}" will be permanently removed.
          </p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}
          className="border-white/10 hover:bg-white/10">
          Cancel
        </Button>
        <Button size="sm" onClick={onConfirm} disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white">
          {loading ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </motion.div>
  </div>
);

// ─── Main Tasks Dashboard ───
const TasksDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ActivityTask[]>([]);
  const [activeTask, setActiveTask] = useState<ActivityTask | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ActivityTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<ActivityTask | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const validColumnsRef = useRef<Set<string>>(new Set(STATUSES));

  const loadTasks = useCallback(() => {
    recordsApi.fetchTasks()
      .then((data) => setTasks(data.tasks))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const stats = useMemo(() => {
    const status = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 };
    const priority = { low: 0, medium: 0, high: 0, urgent: 0 };
    let overdue = 0;
    const now = new Date();
    tasks.forEach((tk) => {
      if (status[tk.status] !== undefined) status[tk.status]++;
      if (priority[tk.priority] !== undefined) priority[tk.priority]++;
      if (tk.due_date && new Date(tk.due_date) < now && tk.status !== 'completed' && tk.status !== 'cancelled') {
        overdue++;
      }
    });
    return { status, priority, overdue, total: tasks.length };
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

  const handleEdit = useCallback((task: ActivityTask) => {
    setEditingTask(task);
  }, []);

  const handleDelete = useCallback((task: ActivityTask) => {
    setDeletingTask(task);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    setDeleteLoading(true);
    try {
      await taskApi.deleteTask(deletingTask.id);
      setTasks(prev => prev.filter(tk => tk.id !== deletingTask.id));
      toast.success('Task deleted');
      setDeletingTask(null);
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Convert ActivityTask → Task shape for the modal's editTask prop
  const editTaskForModal = useMemo((): Task | null => {
    if (!editingTask) return null;
    return {
      id: editingTask.id,
      lead_id: editingTask.lead_id,
      title: editingTask.title,
      description: editingTask.description,
      priority: editingTask.priority,
      status: editingTask.status,
      due_date: editingTask.due_date,
      completed_at: editingTask.completed_at,
      assigned_to: editingTask.assigned_to,
      created_by: editingTask.created_by,
      reminder: editingTask.reminder === 1,
      created_at: editingTask.created_at,
      updated_at: editingTask.updated_at,
      assignee: editingTask.assignee ? { id: editingTask.assignee.id, name: editingTask.assignee.name, email: editingTask.assignee.email, profile_pic: null } : null,
      creator: editingTask.creator ? { id: editingTask.creator.id, name: editingTask.creator.name, email: editingTask.creator.email, profile_pic: null } : null,
    };
  }, [editingTask]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-[420px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('reports.tasks')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats.total} {stats.total === 1 ? 'task' : 'tasks'}
            {stats.overdue > 0 && (
              <span className="text-red-400 ml-2">· {stats.overdue} overdue</span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/80 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          New Task
        </Button>
      </div>

      {/* Stats bar — priority only */}
      <div className="glass-card px-4 py-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {(['urgent', 'high', 'medium', 'low'] as const).map((p) => (
          <span key={p} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${priorityDotColor[p]}`} />
            <span className="tabular-nums font-medium text-foreground">{stats.priority[p]}</span>
            <span className="text-muted-foreground/70">{t(`tasks.priority.${p}`)}</span>
          </span>
        ))}
      </div>

      {/* Kanban */}
      <DndContext
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="glass-card p-4 overflow-x-auto scrollbar-dark">
          <div className="flex gap-4 min-w-[920px]">
            <DroppableKanbanColumn
              status="pending"
              title={t('tasks.status.pending')}
              icon={<Clock className="w-4 h-4 text-yellow-400" />}
              tasks={tasksByStatus.pending}
              accentClass="border-yellow-600/40"
              isDragActive={!!activeTask}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
            <DroppableKanbanColumn
              status="in_progress"
              title={t('tasks.status.in_progress')}
              icon={<ArrowRightLeft className="w-4 h-4 text-blue-400" />}
              tasks={tasksByStatus.in_progress}
              accentClass="border-blue-600/40"
              isDragActive={!!activeTask}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
            <DroppableKanbanColumn
              status="completed"
              title={t('tasks.status.completed')}
              icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
              tasks={tasksByStatus.completed}
              accentClass="border-green-600/40"
              isDragActive={!!activeTask}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
            <DroppableKanbanColumn
              status="cancelled"
              title={t('tasks.status.cancelled')}
              icon={<XCircle className="w-4 h-4 text-muted-foreground/60" />}
              tasks={tasksByStatus.cancelled}
              accentClass="border-border/60"
              isDragActive={!!activeTask}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Create modal */}
      <TaskCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={() => {
          loadTasks();
        }}
      />

      {/* Edit modal */}
      <TaskCreationModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        leadId={editingTask?.lead_id ?? undefined}
        editTask={editTaskForModal}
        onTaskCreated={() => {}}
        onTaskUpdated={() => {
          loadTasks();
          setEditingTask(null);
        }}
      />

      {/* Delete confirmation */}
      <AnimatePresence>
        {deletingTask && (
          <DeleteConfirmModal
            task={deletingTask}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeletingTask(null)}
            loading={deleteLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksDashboard;
