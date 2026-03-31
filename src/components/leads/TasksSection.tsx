import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  User,
  ListTodo,
  MoreVertical,
  Pencil,
  Trash2,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/services/taskApi';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TasksSectionProps {
  tasks: Task[];
  loading?: boolean;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

const TasksSection: React.FC<TasksSectionProps> = ({ 
  tasks, 
  loading, 
  onCreateTask,
  onEditTask,
  onDeleteTask
}) => {
  const { t } = useLanguage();
  
  if (loading) {
    return (
      <motion.div 
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <ListTodo className="w-5 h-5" />
          {t('tasks.title')}
          {tasks.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary border-primary/30">
              {tasks.length}
            </Badge>
          )}
        </h3>
        <Button onClick={onCreateTask} size="sm" className="bg-primary hover:bg-primary/80">
          <Plus className="w-4 h-4 mr-2" />
          {t('tasks.new-task')}
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyTasksState onCreateTask={onCreateTask} />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={() => onEditTask(task)}
                onDelete={() => onDeleteTask(task)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

const EmptyTasksState: React.FC<{ onCreateTask: () => void }> = ({ onCreateTask }) => {
  const { t } = useLanguage();
  
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <ListTodo className="w-8 h-8 text-primary/60" />
      </div>
      <h4 className="text-white font-medium mb-2">{t('tasks.no-tasks')}</h4>
      <p className="text-gray-400 text-sm mb-4">{t('tasks.no-tasks-description')}</p>
      <Button onClick={onCreateTask} variant="outline" size="sm" className="glass-card">
        <Plus className="w-4 h-4 mr-2" />
        {t('tasks.create-first')}
      </Button>
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  
  const isCompleted = task.status === 'completed';
  const isCancelled = task.status === 'cancelled';
  const isDimmed = isCompleted || isCancelled;
  
  const isOverdue = task.due_date && 
    new Date(task.due_date) < new Date() && 
    !isCompleted && 
    !isCancelled;

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
      medium: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
      high: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
      urgent: 'bg-red-600/20 text-red-400 border-red-600/30'
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
      in_progress: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
      completed: 'bg-green-600/20 text-green-400 border-green-600/30',
      cancelled: 'bg-gray-600/20 text-gray-400 border-gray-600/30'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      timeZone: 'UTC'
    });
  };

  const getPriorityLabel = (priority: string) => {
    return t(`tasks.priority.${priority}`);
  };

  const getStatusLabel = (status: string) => {
    return t(`tasks.status.${status}`);
  };

  const hasLongDescription = task.description && task.description.length > 100;
  const displayDescription = expanded || !hasLongDescription 
    ? task.description 
    : task.description?.substring(0, 100) + '...';

  return (
    <motion.div 
      className={`group rounded-lg border border-white/10 p-4 transition-all hover:border-white/20 ${
        isDimmed ? 'opacity-60' : ''
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      layout
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className={`text-white font-medium mb-2 ${isCompleted ? 'line-through' : ''}`}>
            {task.title}
          </h4>
          
          {/* Description */}
          {task.description && (
            <div className="mb-3">
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                {displayDescription}
              </p>
              {hasLongDescription && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-primary text-xs mt-1 flex items-center gap-1 hover:text-primary/80 transition-colors"
                >
                  {expanded ? (
                    <>{t('tasks.card.see-less')} <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>{t('tasks.card.see-more')} <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </div>
          )}
          
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`text-xs font-medium border ${getPriorityBadge(task.priority)}`}>
              {getPriorityLabel(task.priority)}
            </Badge>
            <Badge className={`text-xs font-medium border flex items-center gap-1 ${getStatusBadge(task.status)}`}>
              {getStatusIcon(task.status)}
              {getStatusLabel(task.status)}
            </Badge>
          </div>
        </div>
        
        {/* Meta info and Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 md:opacity-0 opacity-100 hover:bg-white/10 transition-all">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-white/10">
              <DropdownMenuItem 
                onClick={onEdit}
                className="text-gray-300 focus:bg-white/10 focus:text-white cursor-pointer"
              >
                <Pencil className="w-4 h-4 mr-2" />
                {t('tasks.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-red-400 focus:bg-red-600/20 focus:text-red-400 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('tasks.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {task.reminder && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <Bell className="w-3.5 h-3.5" />
              <span>{t('tasks.reminder')}</span>
            </div>
          )}
          {task.due_date ? (
            <div className={`flex items-center gap-1.5 text-xs ${
              isOverdue ? 'text-red-400' : 'text-gray-400'
            }`}>
              <Calendar className="w-3.5 h-3.5" />
              <span className={isOverdue ? 'font-medium' : ''}>
                {formatDate(task.due_date)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('tasks.no-due-date')}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Creator and Assignee Info */}
      <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-2 text-xs">
        {task.creator && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{t('tasks.card.created-by')}</span>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-300">{task.creator.name}</span>
              <span className="text-gray-500">({task.creator.email})</span>
            </div>
          </div>
        )}
        {task.assignee && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{t('tasks.assigned-to')}</span>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span className="text-gray-300">{task.assignee.name}</span>
              <span className="text-gray-500">({task.assignee.email})</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TasksSection;
