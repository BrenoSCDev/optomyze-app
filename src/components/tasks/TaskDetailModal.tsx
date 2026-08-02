/**
 * TASK DETAIL
 *
 * The full task view: description, dates, people, subtasks, checklist and the
 * comment thread, all in one surface so nothing about a task needs a second
 * navigation.
 *
 * Field edits save on blur rather than behind a Save button — the ClickUp
 * behaviour — so `task` here is the local working copy and the parent is told
 * about each persisted change through onSaved.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Calendar, Check, Eye, EyeOff, Loader2, Plus, Send, Trash2, User as UserIcon, X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import UserAvatar from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { AssigneeStack, DueDateChip, ProgressBar } from './TaskBits';
import {
  PRIORITY_META, PRIORITY_ORDER, TaskChecklistItem, TaskComment, TaskPriority,
  TaskStatus, TaskUser, WorkspaceTask,
  addChecklistItem, addComment, deleteChecklistItem, deleteComment, deleteTask,
  fetchList, fetchTask, taskLeadName, taskProgress, toggleWatch,
  updateChecklistItem, updateTask,
} from '@/services/taskWorkspaceApi';

interface Props {
  open: boolean;
  taskId: number | null;
  /**
   * The columns of the task's list. Optional: callers outside the workspace
   * (the main Calendar, for one) have no list context, so the modal falls back
   * to fetching them from whichever list the task turns out to belong to.
   */
  statuses?: TaskStatus[];
  onClose: () => void;
  /** Fired after any persisted change so the parent list can refresh. */
  onSaved: () => void;
  onDeleted?: (taskId: number) => void;
}

/** `datetime-local` needs `YYYY-MM-DDTHH:mm`; the API sends ISO or SQL. */
const toInputValue = (iso: string | null): string => {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}` : '';
};

const TaskDetailModal: React.FC<Props> = ({
  open, taskId, statuses: providedStatuses, onClose, onSaved, onDeleted,
}) => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();

  const [fallbackStatuses, setFallbackStatuses] = useState<TaskStatus[]>([]);
  const statuses = providedStatuses?.length ? providedStatuses : fallbackStatuses;

  const [task, setTask] = useState<WorkspaceTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<TaskUser[]>([]);
  const [tags, setTags] = useState<{ id: number; name: string; color: string | null }[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [watching, setWatching] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  /* ------------------------------------------------------------- loading */

  const load = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const fresh = await fetchTask(taskId);
      setTask(fresh);
      setTitle(fresh.title);
      setDescription(fresh.description ?? '');
      setWatching(!!fresh.watchers?.some(w => w.id === currentUser?.id));
    } catch {
      toast.error(t('tasks.load-failed'));
      onClose();
    } finally {
      setLoading(false);
    }
  }, [taskId, currentUser?.id, t, onClose]);

  useEffect(() => { if (open && taskId) load(); }, [open, taskId, load]);

  // Only when the caller could not supply them — the status Select is
  // unusable without the list's columns.
  useEffect(() => {
    if (providedStatuses?.length || !task?.task_list_id) return;

    let cancelled = false;
    fetchList(task.task_list_id)
      .then(list => { if (!cancelled) setFallbackStatuses(list.statuses ?? []); })
      .catch(() => { if (!cancelled) setFallbackStatuses([]); });

    return () => { cancelled = true; };
  }, [task?.task_list_id, providedStatuses?.length]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    Promise.all([
      api.get('/api/users').then(r => r.data?.data ?? r.data ?? []).catch(() => []),
      api.get('/api/tags', { params: { scope: 'task' } }).then(r => r.data?.data ?? r.data ?? []).catch(() => []),
    ]).then(([userList, tagList]) => {
      if (cancelled) return;
      setUsers(Array.isArray(userList) ? userList : []);
      setTags(Array.isArray(tagList) ? tagList : []);
    });

    return () => { cancelled = true; };
  }, [open]);

  /* -------------------------------------------------------------- saving */

  const persist = useCallback(async (payload: Parameters<typeof updateTask>[1]) => {
    if (!task) return;
    try {
      setSaving(true);
      const updated = await updateTask(task.id, payload);
      // Merge rather than replace: the update response carries row relations
      // only, and would drop comments/checklist loaded by show().
      setTask(prev => (prev ? { ...prev, ...updated } : updated));
      onSaved();
    } catch {
      toast.error(t('tasks.save-failed'));
      load();
    } finally {
      setSaving(false);
    }
  }, [task, onSaved, t, load]);

  const saveTitle = () => {
    const trimmed = title.trim();
    if (!task || !trimmed || trimmed === task.title) {
      setTitle(task?.title ?? '');
      return;
    }
    persist({ title: trimmed });
  };

  const saveDescription = () => {
    if (!task || description === (task.description ?? '')) return;
    persist({ description });
  };

  /* ---------------------------------------------------------- checklist */

  const handleAddChecklistItem = async () => {
    const trimmed = newChecklistItem.trim();
    if (!task || !trimmed) return;

    try {
      const item = await addChecklistItem(task.id, trimmed);
      setTask(prev => prev
        ? { ...prev, checklist_items: [...(prev.checklist_items ?? []), item] }
        : prev);
      setNewChecklistItem('');
      onSaved();
    } catch {
      toast.error(t('tasks.save-failed'));
    }
  };

  const handleToggleChecklistItem = async (item: TaskChecklistItem) => {
    if (!task) return;
    try {
      const updated = await updateChecklistItem(task.id, item.id, { is_done: !item.is_done });
      setTask(prev => prev
        ? {
            ...prev,
            checklist_items: (prev.checklist_items ?? []).map(i => (i.id === item.id ? updated : i)),
          }
        : prev);
      onSaved();
    } catch {
      toast.error(t('tasks.save-failed'));
    }
  };

  const handleDeleteChecklistItem = async (item: TaskChecklistItem) => {
    if (!task) return;
    try {
      await deleteChecklistItem(task.id, item.id);
      setTask(prev => prev
        ? { ...prev, checklist_items: (prev.checklist_items ?? []).filter(i => i.id !== item.id) }
        : prev);
      onSaved();
    } catch {
      toast.error(t('tasks.save-failed'));
    }
  };

  /* ----------------------------------------------------------- comments */

  const handleAddComment = async () => {
    const trimmed = newComment.trim();
    if (!task || !trimmed) return;

    try {
      const comment = await addComment(task.id, trimmed);
      setTask(prev => prev ? { ...prev, comments: [...(prev.comments ?? []), comment] } : prev);
      setNewComment('');
      setWatching(true);
      requestAnimationFrame(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
    } catch {
      toast.error(t('tasks.comment-failed'));
    }
  };

  const handleDeleteComment = async (comment: TaskComment) => {
    if (!task) return;
    try {
      await deleteComment(task.id, comment.id);
      setTask(prev => prev
        ? { ...prev, comments: (prev.comments ?? []).filter(c => c.id !== comment.id) }
        : prev);
    } catch {
      toast.error(t('tasks.comment-failed'));
    }
  };

  /* ------------------------------------------------------------- delete */

  const handleDelete = async () => {
    if (!task || !window.confirm(t('tasks.confirm-delete'))) return;
    try {
      await deleteTask(task.id);
      toast.success(t('tasks.deleted'));
      onDeleted?.(task.id);
      onClose();
    } catch {
      toast.error(t('tasks.delete-failed'));
    }
  };

  const assigneeIds = new Set(task?.assignees?.map(a => a.id) ?? []);
  const tagIds = new Set(task?.tags?.map(tg => tg.id) ?? []);
  const progress = task ? taskProgress(task) : null;

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="flex h-[min(88vh,52rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        {loading || !task ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader className="shrink-0 border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                {task.list && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: task.list.color }}
                    />
                    {task.list.name}
                  </span>
                )}
                {task.parent && (
                  <span className="truncate text-xs text-muted-foreground">
                    / {task.parent.title}
                  </span>
                )}

                <div className="ml-auto flex items-center gap-1">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={async () => {
                          const next = await toggleWatch(task.id);
                          setWatching(next);
                        }}
                      >
                        {watching ? <Eye /> : <EyeOff />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {watching ? t('tasks.unwatch') : t('tasks.watch')}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost-destructive" size="icon-sm" onClick={handleDelete}>
                        <Trash2 />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('common.delete')}</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <DialogTitle asChild>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={e => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                    if (e.key === 'Escape') { setTitle(task.title); e.currentTarget.blur(); }
                  }}
                  className="w-full border-0 bg-transparent p-0 text-lg font-semibold text-foreground outline-none focus:ring-0"
                />
              </DialogTitle>
            </DialogHeader>

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[1fr_18rem]">
              {/* ------------------------------------------------ main */}
              <div className="min-h-0 space-y-6 overflow-y-auto px-5 py-4">
                <section>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t('tasks.description')}
                  </label>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    onBlur={saveDescription}
                    placeholder={t('tasks.description-placeholder')}
                    className="min-h-[6rem] resize-y"
                  />
                </section>

                {/* ------------------------------------------ subtasks */}
                {!!task.subtasks?.length && (
                  <section>
                    <h3 className="mb-2 text-xs font-medium text-muted-foreground">
                      {t('tasks.subtasks')} ({task.subtasks.length})
                    </h3>
                    <ul className="space-y-1">
                      {task.subtasks.map(sub => (
                        <li
                          key={sub.id}
                          className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: (sub as any).status?.color ?? '#94a3b8' }}
                          />
                          <span className="truncate text-sm text-foreground">{sub.title}</span>
                          <div className="ml-auto"><AssigneeStack users={sub.assignees} max={2} /></div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* ----------------------------------------- checklist */}
                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-xs font-medium text-muted-foreground">{t('tasks.checklist')}</h3>
                    {progress !== null && (
                      <span className="text-xs tabular-nums text-muted-foreground">{progress}%</span>
                    )}
                  </div>

                  {progress !== null && <ProgressBar value={progress} className="mb-2" />}

                  <ul className="space-y-1">
                    {(task.checklist_items ?? []).map(item => (
                      <li key={item.id} className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-hover">
                        <Checkbox
                          checked={item.is_done}
                          onCheckedChange={() => handleToggleChecklistItem(item)}
                        />
                        <span
                          className={cn(
                            'min-w-0 flex-1 truncate text-sm',
                            item.is_done ? 'text-muted-foreground line-through' : 'text-foreground',
                          )}
                        >
                          {item.title}
                        </span>
                        <Button
                          variant="ghost-destructive"
                          size="icon-sm"
                          className="opacity-0 transition-opacity duration-fast group-hover:opacity-100"
                          onClick={() => handleDeleteChecklistItem(item)}
                        >
                          <X />
                        </Button>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      value={newChecklistItem}
                      onChange={e => setNewChecklistItem(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()}
                      placeholder={t('tasks.add-checklist-item')}
                      className="h-8 text-sm"
                    />
                    <Button size="icon-sm" variant="outline" onClick={handleAddChecklistItem}>
                      <Plus />
                    </Button>
                  </div>
                </section>

                {/* ------------------------------------------ comments */}
                <section>
                  <h3 className="mb-2 text-xs font-medium text-muted-foreground">
                    {t('tasks.comments')} ({task.comments?.length ?? 0})
                  </h3>

                  <ul className="space-y-3">
                    {(task.comments ?? []).map(comment => (
                      <li key={comment.id} className="group flex gap-2.5">
                        <UserAvatar
                          name={comment.user?.name ?? '?'}
                          profilePicPath={comment.user?.profile_pic}
                          className="h-7 w-7 shrink-0 text-xs"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">
                              {comment.user?.name ?? t('tasks.unknown-user')}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                            {comment.edited_at && (
                              <span className="text-[11px] text-muted-foreground">
                                ({t('tasks.edited')})
                              </span>
                            )}
                            {comment.user_id === currentUser?.id && (
                              <Button
                                variant="ghost-destructive"
                                size="icon-sm"
                                className="ml-auto opacity-0 transition-opacity duration-fast group-hover:opacity-100"
                                onClick={() => handleDeleteComment(comment)}
                              >
                                <X />
                              </Button>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                            {comment.body}
                          </p>
                        </div>
                      </li>
                    ))}
                    <div ref={commentsEndRef} />
                  </ul>

                  <div className="mt-3 flex items-start gap-2">
                    <Textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => {
                        // Enter sends; Shift+Enter breaks the line.
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      placeholder={t('tasks.comment-placeholder')}
                      className="min-h-[2.5rem] resize-none"
                      rows={1}
                    />
                    <Button size="icon" variant="outline" onClick={handleAddComment}>
                      <Send />
                    </Button>
                  </div>
                </section>
              </div>

              {/* --------------------------------------------- sidebar */}
              <aside className="min-h-0 space-y-4 overflow-y-auto border-t border-border px-5 py-4 md:border-l md:border-t-0">
                <Field label={t('tasks.status')}>
                  <Select
                    value={task.task_status_id ? String(task.task_status_id) : undefined}
                    onValueChange={value => persist({ task_status_id: Number(value) })}
                  >
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status.id} value={String(status.id)}>
                          <span className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            {status.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={t('tasks.priority')}>
                  <Select
                    value={task.priority}
                    onValueChange={value => persist({ priority: value as TaskPriority })}
                  >
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_ORDER.map(priority => (
                        <SelectItem key={priority} value={priority}>
                          <span className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: PRIORITY_META[priority].color }}
                            />
                            {PRIORITY_META[priority].label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={t('tasks.assignees')}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-full justify-start">
                        {task.assignees?.length ? (
                          <AssigneeStack users={task.assignees} max={4} />
                        ) : (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <UserIcon className="h-3.5 w-3.5" />{t('tasks.unassigned')}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="max-h-72 w-56 overflow-y-auto">
                      <DropdownMenuLabel>{t('tasks.assignees')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {users.map(user => (
                        <DropdownMenuCheckboxItem
                          key={user.id}
                          checked={assigneeIds.has(user.id)}
                          onCheckedChange={checked => {
                            const next = checked
                              ? [...assigneeIds, user.id]
                              : [...assigneeIds].filter(id => id !== user.id);
                            persist({ assignee_ids: next });
                          }}
                        >
                          {user.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Field>

                <Field label={t('tasks.due-date')}>
                  <Input
                    type="datetime-local"
                    value={toInputValue(task.due_date)}
                    onChange={e => persist({ due_date: e.target.value || null })}
                    className="h-8 text-sm"
                  />
                </Field>

                <Field label={t('tasks.start-date')}>
                  <Input
                    type="datetime-local"
                    value={toInputValue(task.start_date)}
                    onChange={e => persist({ start_date: e.target.value || null })}
                    className="h-8 text-sm"
                  />
                </Field>

                <Field label={t('tasks.tags')}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-full justify-start">
                        {task.tags?.length
                          ? <span className="truncate">{task.tags.map(tg => tg.name).join(', ')}</span>
                          : <span className="text-muted-foreground">{t('tasks.no-tags')}</span>}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="max-h-72 w-56 overflow-y-auto">
                      {tags.map(tag => (
                        <DropdownMenuCheckboxItem
                          key={tag.id}
                          checked={tagIds.has(tag.id)}
                          onCheckedChange={checked => {
                            const next = checked
                              ? [...tagIds, tag.id]
                              : [...tagIds].filter(id => id !== tag.id);
                            persist({ tag_ids: next });
                          }}
                        >
                          {tag.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Field>

                {/* Sales context is read-only here — it is set from the lead. */}
                {task.lead && (
                  <Field label={t('tasks.linked-lead')}>
                    <div className="rounded-md border border-border px-2.5 py-1.5 text-sm text-foreground">
                      {taskLeadName(task.lead)}
                    </div>
                  </Field>
                )}

                {task.creator && (
                  <Field label={t('tasks.created-by')}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserAvatar
                        name={task.creator.name}
                        profilePicPath={task.creator.profile_pic}
                        className="h-5 w-5 text-[10px]"
                      />
                      {task.creator.name}
                    </div>
                  </Field>
                )}
              </aside>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
    {children}
  </div>
);

export default TaskDetailModal;
