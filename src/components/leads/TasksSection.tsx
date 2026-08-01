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
import ClickableUser from '@/components/users/ClickableUser';

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
        className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm"
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
      className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <ListTodo className="w-5 h-5" />
          {t('tasks.title')}
          {tasks.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary border-primary/30">
              {tasks.length}
            </Badge>
          )}
        </h3>
        <Button onClick={onCreateTask} size="sm" className="bg-primary hover:bg-primary/80">
          <Plus className="w-4 h-4" />
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
      <div className="py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <ListTodo className="w-8 h-8 text-primary/60" />
      </div>
      <h4 className="mb-2 font-medium text-foreground">{t('tasks.no-tasks')}</h4>
      <p className="mb-4 text-sm text-muted-foreground">{t('tasks.no-tasks-description')}</p>
      <Button onClick={onCreateTask} variant="outline" size="sm" className="border-border bg-background hover:bg-muted">
        <Plus className="w-4 h-4" />
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
      low: 'border-border bg-muted text-muted-foreground',
      medium: 'border-primary/20 bg-primary/10 text-primary',
      high: 'border-accent/40 bg-accent text-accent-foreground',
      urgent: 'border-destructive/30 bg-destructive/10 text-destructive'
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'border-border bg-muted text-muted-foreground',
      in_progress: 'border-primary/20 bg-primary/10 text-primary',
      completed: 'border-accent/40 bg-accent text-accent-foreground',
      cancelled: 'border-border bg-muted text-muted-foreground'
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
      className={`group rounded-lg border border-border bg-background/60 p-4 transition-colors duration-fast ease-standard hover:bg-muted/40 ${
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
          <h4 className={`mb-2 font-medium text-foreground ${isCompleted ? 'line-through' : ''}`}>
            {task.title}
          </h4>
          
          {/* Description */}
          {task.description && (
            <div className="mb-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {displayDescription}
              </p>
              {hasLongDescription && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-1 flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
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
               <button className="rounded-md p-1.5 opacity-100 transition-colors duration-fast ease-standard hover:bg-muted md:opacity-0 md:group-hover:opacity-100">
                 <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="border-border bg-popover text-popover-foreground">
              <DropdownMenuItem 
                onClick={onEdit}
                 className="cursor-pointer focus:bg-muted focus:text-foreground"
              >
                <Pencil className="w-4 h-4" />
                {t('tasks.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete}
                 className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                {t('tasks.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {task.reminder && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <Bell className="w-3.5 h-3.5" />
              <span>{t('tasks.reminder')}</span>
            </div>
          )}
          {task.due_date ? (
            <div className={`flex items-center gap-1.5 text-xs ${
              isOverdue ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              <Calendar className="w-3.5 h-3.5" />
              <span className={isOverdue ? 'font-medium' : ''}>
                {formatDate(task.due_date)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('tasks.no-due-date')}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Creator and Assignee Info */}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-3 text-xs">
        {task.creator && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t('tasks.card.created-by')}</span>
            <ClickableUser userId={task.creator.id} className="gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground">{task.creator.name}</span>
              <span className="text-muted-foreground">({task.creator.email})</span>
            </ClickableUser>
          </div>
        )}
        {task.assignee && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t('tasks.assigned-to')}</span>
            <ClickableUser userId={task.assignee.id} className="gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              <span className="text-foreground">{task.assignee.name}</span>
              <span className="text-muted-foreground">({task.assignee.email})</span>
            </ClickableUser>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TasksSection;
