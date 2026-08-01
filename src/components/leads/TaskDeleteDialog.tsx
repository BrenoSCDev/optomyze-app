import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { taskApi, Task } from '@/services/taskApi';
import { toast } from 'sonner';

interface TaskDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onTaskDeleted: (taskId: number) => void;
}

const TaskDeleteDialog: React.FC<TaskDeleteDialogProps> = ({
  isOpen,
  onClose,
  task,
  onTaskDeleted
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!task) return;
    
    setLoading(true);
    
    try {
      await taskApi.deleteTask(task.id);
      toast.success('Task deleted successfully');
      onTaskDeleted(task.id);
      onClose();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(error.response?.data?.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <motion.div 
          className="glass-card w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Content */}
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            
            <h3 className="text-xl font-semibold text-foreground mb-2">Delete Task</h3>
            
            <p className="text-muted-foreground mb-2">
              Are you sure you want to delete this task?
            </p>
            
            <p className="text-foreground font-medium mb-4 px-4 py-2 bg-surface-2 rounded-lg">
              "{task.title}"
            </p>
            
            <p className="text-subtle text-sm">
              This action cannot be undone.
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3 p-6 border-t border-border">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
              className="flex-1 border-border hover:bg-surface-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Task'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskDeleteDialog;
