import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { taskApi, CreateTaskPayload, Task } from '@/services/taskApi';
import { userApi } from '@/services/userApi';
import { User } from '@/types/user';
import { toast } from 'sonner';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  onTaskCreated: (task: Task) => void;
  editTask?: Task | null;
  onTaskUpdated?: (task: Task) => void;
}

const TaskCreationModal: React.FC<TaskCreationModalProps> = ({
  isOpen,
  onClose,
  leadId,
  onTaskCreated,
  editTask,
  onTaskUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const isEditMode = !!editTask;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    due_date: undefined as Date | undefined,
    assigned_to: 'unassigned' as string,
    reminder: false
  });

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      
      if (editTask) {
        // Pre-fill form with existing task data
        setFormData({
          title: editTask.title || '',
          description: editTask.description || '',
          priority: editTask.priority || 'medium',
          status: editTask.status || 'pending',
          due_date: editTask.due_date ? parseISO(editTask.due_date) : undefined,
          assigned_to: editTask.assigned_to ? editTask.assigned_to.toString() : 'unassigned',
          reminder: editTask.reminder || false
        });
      } else {
        // Reset form for new task
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          status: 'pending',
          due_date: undefined,
          assigned_to: 'unassigned',
          reminder: false
        });
      }
    }
  }, [isOpen, editTask]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersData = await userApi.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setLoading(true);
    
    try {
      const payload: CreateTaskPayload = {
        lead_id: leadId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date 
          ? format(formData.due_date, 'yyyy-MM-dd HH:mm:ss')
          : undefined,
        assigned_to: formData.assigned_to && formData.assigned_to !== 'unassigned' 
          ? parseInt(formData.assigned_to) 
          : undefined,
        reminder: formData.reminder
      };

      if (isEditMode && editTask) {
        // Update existing task
        const updatedTask = await taskApi.updateTask(editTask.id, payload);
        toast.success('Task updated successfully');
        onTaskUpdated?.(updatedTask);
      } else {
        // Create new task
        const newTask = await taskApi.createTask(payload);
        toast.success('Task created successfully');
        onTaskCreated(newTask);
      }
      
      onClose();
      
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} task`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
          className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">
                {isEditMode ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button 
                type="button" 
                onClick={onClose} 
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-white mb-2 block">
                  Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-white mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description (optional)"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary resize-none min-h-[100px]"
                  rows={4}
                />
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      priority: value as 'low' | 'medium' | 'high' | 'urgent' 
                    }))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      <SelectItem value="low" className="text-gray-300 focus:bg-white/10 focus:text-white">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-500" />
                          Low
                        </span>
                      </SelectItem>
                      <SelectItem value="medium" className="text-gray-300 focus:bg-white/10 focus:text-white">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Medium
                        </span>
                      </SelectItem>
                      <SelectItem value="high" className="text-gray-300 focus:bg-white/10 focus:text-white">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          High
                        </span>
                      </SelectItem>
                      <SelectItem value="urgent" className="text-gray-300 focus:bg-white/10 focus:text-white">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Urgent
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      status: value as 'pending' | 'in_progress' | 'completed' | 'cancelled' 
                    }))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      <SelectItem value="pending" className="text-gray-300 focus:bg-white/10 focus:text-white">
                        Pending
                      </SelectItem>
                      <SelectItem value="in_progress" className="text-gray-300 focus:bg-white/10 focus:text-white">
                        In Progress
                      </SelectItem>
                      <SelectItem value="completed" className="text-gray-300 focus:bg-white/10 focus:text-white">
                        Completed
                      </SelectItem>
                      <SelectItem value="cancelled" className="text-gray-300 focus:bg-white/10 focus:text-white">
                        Cancelled
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <Label className="text-white mb-2 block">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white/5 border-white/10 hover:bg-white/10",
                        !formData.due_date && "text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? format(formData.due_date, "PPP") : "Select due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-900 border-white/10" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.due_date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Assigned To */}
              <div>
                <Label className="text-white mb-2 block">Assigned To</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select user (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    <SelectItem value="unassigned" className="text-gray-300 focus:bg-white/10 focus:text-white">
                      Unassigned
                    </SelectItem>
                    {loadingUsers ? (
                      <div className="p-2 text-center text-gray-400 text-sm">Loading users...</div>
                    ) : (
                      users.map((user) => (
                        <SelectItem 
                          key={user.id} 
                          value={user.id.toString()} 
                          className="text-gray-300 focus:bg-white/10 focus:text-white"
                        >
                          {user.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Reminder Switch */}
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div>
                  <Label className="text-white">Reminder</Label>
                  <p className="text-xs text-gray-400 mt-0.5">Enable notifications for this task</p>
                </div>
                <Switch
                  checked={formData.reminder}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminder: checked }))}
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={loading}
                className="border-white/10 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/80"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  isEditMode ? 'Save Changes' : 'Create Task'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskCreationModal;
