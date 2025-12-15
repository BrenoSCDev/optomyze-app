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
  ListTodo
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/services/taskApi';
import { Skeleton } from '@/components/ui/skeleton';

interface TasksSectionProps {
  tasks: Task[];
  loading?: boolean;
  onCreateTask: () => void;
}

const TasksSection: React.FC<TasksSectionProps> = ({ tasks, loading, onCreateTask }) => {
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
          Tasks
          {tasks.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary border-primary/30">
              {tasks.length}
            </Badge>
          )}
        </h3>
        <Button onClick={onCreateTask} size="sm" className="bg-primary hover:bg-primary/80">
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyTasksState onCreateTask={onCreateTask} />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const EmptyTasksState: React.FC<{ onCreateTask: () => void }> = ({ onCreateTask }) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
      <ListTodo className="w-8 h-8 text-primary/60" />
    </div>
    <h4 className="text-white font-medium mb-2">No tasks yet</h4>
    <p className="text-gray-400 text-sm mb-4">Create the first task for this lead.</p>
    <Button onClick={onCreateTask} variant="outline" size="sm" className="glass-card">
      <Plus className="w-4 h-4 mr-2" />
      Create Task
    </Button>
  </div>
);

const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
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
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const hasLongDescription = task.description && task.description.length > 100;
  const displayDescription = expanded || !hasLongDescription 
    ? task.description 
    : task.description?.substring(0, 100) + '...';

  return (
    <motion.div 
      className={`rounded-lg border border-white/10 p-4 transition-all hover:border-white/20 ${
        isDimmed ? 'opacity-60' : ''
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
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
                    <>See Less <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>See More <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </div>
          )}
          
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`text-xs font-medium border ${getPriorityBadge(task.priority)}`}>
              {task.priority}
            </Badge>
            <Badge className={`text-xs font-medium border flex items-center gap-1 ${getStatusBadge(task.status)}`}>
              {getStatusIcon(task.status)}
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        
        {/* Meta info */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {task.due_date && (
            <div className={`flex items-center gap-1.5 text-xs ${
              isOverdue ? 'text-red-400' : 'text-gray-400'
            }`}>
              <Calendar className="w-3.5 h-3.5" />
              <span className={isOverdue ? 'font-medium' : ''}>
                {formatDate(task.due_date)}
              </span>
            </div>
          )}
          {task.assigned_to && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <User className="w-3.5 h-3.5" />
              <span>Assigned</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TasksSection;
