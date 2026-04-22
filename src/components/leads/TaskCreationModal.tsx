import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Calendar as CalendarIcon, Search, UserCheck, XCircle } from 'lucide-react';
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
import { taskApi, CreateTaskPayload, Task, TaskLeadResult } from '@/services/taskApi';
import { userApi } from '@/services/userApi';
import { User } from '@/types/user';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: number;
  onTaskCreated: (task: Task, transaction?: any) => void;
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
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isStandaloneMode = leadId === undefined;
  const [leadQuery, setLeadQuery] = useState('');
  const [leadResults, setLeadResults] = useState<TaskLeadResult[]>([]);
  const [leadSearchLoading, setLeadSearchLoading] = useState(false);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const [selectedLead, setSelectedLead] = useState<TaskLeadResult | null>(null);
  const leadDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setSelectedLead(null);
      setLeadQuery('');
      setLeadResults([]);

      if (editTask) {
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

  useEffect(() => {
    if (!isStandaloneMode || leadQuery.length < 3) {
      setLeadResults([]);
      setShowLeadDropdown(false);
      return;
    }
    if (leadDebounceRef.current) clearTimeout(leadDebounceRef.current);
    leadDebounceRef.current = setTimeout(async () => {
      setLeadSearchLoading(true);
      try {
        const results = await taskApi.searchLeads(leadQuery);
        setLeadResults(results);
        setShowLeadDropdown(true);
      } catch {
      } finally {
        setLeadSearchLoading(false);
      }
    }, 300);
  }, [leadQuery, isStandaloneMode]);

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
      toast.error(t('tasks.modal.title-required'));
      return;
    }

    setLoading(true);
    
    try {
      const resolvedLeadId = leadId ?? selectedLead?.id;

      const payload: CreateTaskPayload = {
        ...(resolvedLeadId !== undefined ? { lead_id: resolvedLeadId } : {}),
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
        const updatedTask = await taskApi.updateTask(editTask.id, payload);
        toast.success(t('tasks.modal.update-success'));
        onTaskUpdated?.(updatedTask);
      } else {
        const result = await taskApi.createTask(payload);
        toast.success(t('tasks.modal.create-success'));
        onTaskCreated(result.task, result.transaction);
      }
      
      onClose();
      
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error(error.response?.data?.message || t(isEditMode ? 'tasks.modal.update-error' : 'tasks.modal.create-error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const modalTree = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card text-card-foreground shadow-2xl scrollbar-thin"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between border-b border-border p-6">
              <h3 className="text-xl font-semibold text-foreground">
                {isEditMode ? t('tasks.modal.edit-title') : t('tasks.modal.create-title')}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {isStandaloneMode && (
                <div>
                  <Label className="mb-2 block text-foreground">
                    Associate with Lead <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  {selectedLead ? (
                    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
                      <UserCheck className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground flex-1">
                        {selectedLead.first_name} {selectedLead.last_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedLead(null)}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={leadQuery}
                          onChange={(e) => setLeadQuery(e.target.value)}
                          placeholder="Search by name (min 3 chars)…"
                          className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
                          onBlur={() => setTimeout(() => setShowLeadDropdown(false), 150)}
                          onFocus={() => leadResults.length > 0 && setShowLeadDropdown(true)}
                        />
                        {leadSearchLoading && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                        )}
                      </div>
                      {showLeadDropdown && leadResults.length > 0 && (
                        <div className="absolute z-[80] w-full mt-1 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                          {leadResults.map((lead) => (
                            <button
                              key={lead.id}
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                              onMouseDown={() => {
                                setSelectedLead(lead);
                                setLeadQuery('');
                                setShowLeadDropdown(false);
                              }}
                            >
                              {lead.first_name} {lead.last_name}
                            </button>
                          ))}
                        </div>
                      )}
                      {showLeadDropdown && leadResults.length === 0 && !leadSearchLoading && leadQuery.length >= 3 && (
                        <div className="absolute z-[80] w-full mt-1 rounded-lg border border-border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-lg">
                          No leads found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="title" className="mb-2 block text-foreground">
                  {t('tasks.modal.title-label')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('tasks.modal.title-placeholder')}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="mb-2 block text-foreground">
                  {t('tasks.modal.description-label')}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('tasks.modal.description-placeholder')}
                  className="min-h-[100px] resize-none bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block text-foreground">{t('tasks.modal.priority-label')}</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      priority: value as 'low' | 'medium' | 'high' | 'urgent'
                    }))}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground z-[80]">
                      <SelectItem value="low">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                          {t('tasks.priority.low')}
                        </span>
                      </SelectItem>
                      <SelectItem value="medium">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[hsl(var(--deal-accent))]" />
                          {t('tasks.priority.medium')}
                        </span>
                      </SelectItem>
                      <SelectItem value="high">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary/60" />
                          {t('tasks.priority.high')}
                        </span>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-destructive" />
                          {t('tasks.priority.urgent')}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block text-foreground">{t('tasks.modal.status-label')}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      status: value as 'pending' | 'in_progress' | 'completed' | 'cancelled'
                    }))}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground z-[80]">
                      <SelectItem value="pending">{t('tasks.status.pending')}</SelectItem>
                      <SelectItem value="in_progress">{t('tasks.status.in_progress')}</SelectItem>
                      <SelectItem value="completed">{t('tasks.status.completed')}</SelectItem>
                      <SelectItem value="cancelled">{t('tasks.status.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-foreground">{t('tasks.modal.due-date-label')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal bg-background border-border hover:bg-muted',
                        !formData.due_date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? format(formData.due_date, 'PPP') : t('tasks.modal.select-due-date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border text-popover-foreground z-[80]" align="start">
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

              {isEditMode && editTask?.creator && (
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <Label className="mb-2 block text-xs text-muted-foreground">{t('tasks.modal.created-by')}</Label>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-sm font-medium">
                        {editTask.creator.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{editTask.creator.name}</p>
                      <p className="text-xs text-muted-foreground">{editTask.creator.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label className="mb-2 block text-foreground">{t('tasks.modal.assigned-to-label')}</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder={t('tasks.modal.select-user')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground z-[80]">
                    <SelectItem value="unassigned">{t('tasks.modal.unassigned')}</SelectItem>
                    {loadingUsers ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">{t('tasks.modal.loading-users')}</div>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex flex-col">
                            <span>{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                <div>
                  <Label className="text-foreground">{t('tasks.modal.reminder-label')}</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t('tasks.modal.reminder-description')}</p>
                </div>
                <Switch
                  checked={formData.reminder}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminder: checked }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border p-6">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={loading}
              >
                {t('tasks.modal.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/80"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? t('tasks.modal.saving') : t('tasks.modal.creating')}
                  </>
                ) : (
                  isEditMode ? t('tasks.modal.save') : t('tasks.modal.create')
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalTree, document.body);
};

export default TaskCreationModal;