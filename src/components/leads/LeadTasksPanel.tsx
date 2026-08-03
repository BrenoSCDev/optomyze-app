/**
 * RECORD TASKS
 *
 * The Tasks tab inside a contact or a deal. Replaces the old TasksSection, which ran on
 * the legacy taskApi and its own create/edit/delete modals; this reads and
 * writes through the task workspace, so a task raised here is the same record
 * the Tasks module shows.
 *
 * Self-loading on purpose. The old panel took `tasks` as a prop threaded down
 * from whichever screen embedded it, which meant every host had to own task
 * state, refresh logic and three modals. Hosts now render `<LeadTasksPanel
 * leadId={...} />` — or `saleId={...}` for a deal — and nothing else.
 *
 * A task links to a lead or a deal, never both from here: whichever id the
 * host supplies is the one tasks are filtered by and created against.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ListTodo, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import {
  AssigneeStack, DueDateChip, PriorityFlag, StatusPill, TaskMetaIcons,
} from '@/components/tasks/TaskBits';
import {
  TaskListSummary, TaskStatus, WorkspaceTask,
  createTask, fetchList, fetchSpaces, fetchTasks, isTaskDone, updateTask,
} from '@/services/taskWorkspaceApi';

interface Props {
  /** Tasks for a contact. Mutually exclusive with `saleId`. */
  leadId?: number | string;
  /** Tasks for a deal. Mutually exclusive with `leadId`. */
  saleId?: number | string;
}

const LeadTasksPanel: React.FC<Props> = ({ leadId, saleId }) => {
  const { t } = useLanguage();
  const numericLeadId = Number(leadId);
  const numericSaleId = Number(saleId);

  // One link field, chosen by whichever the host gave us. Used for both the
  // filter and the create payload so they can never disagree.
  const link = numericSaleId
    ? { sale_id: numericSaleId }
    : { lead_id: numericLeadId };
  const linkedId = numericSaleId || numericLeadId;

  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [lists, setLists] = useState<TaskListSummary[]>([]);
  const [targetListId, setTargetListId] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);

  const [newTitle, setNewTitle] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);

  /* ------------------------------------------------------------------ load */

  const load = useCallback(async () => {
    if (!linkedId) return;
    try {
      setLoading(true);
      // `archived: 'all'` — a contact's history should still show work that was
      // archived, unlike the workspace where archived is noise by default.
      const res = await fetchTasks(
        { ...link, archived: 'all', include_subtasks: true, sort_by: 'due_date' },
        1,
        100,
      );
      setTasks(res.tasks);
    } catch {
      toast.error(t('tasks.load-failed'));
    } finally {
      setLoading(false);
    }
  }, [linkedId, numericSaleId, t]);

  useEffect(() => { load(); }, [load]);

  // Creating a task needs a list to put it in. Flattened from the space tree
  // so the picker is a single list rather than a nested menu.
  useEffect(() => {
    let cancelled = false;

    fetchSpaces()
      .then(spaces => {
        if (cancelled) return;
        const flat = spaces.flatMap(space => space.lists);
        setLists(flat);
        setTargetListId(prev => prev ?? flat[0]?.id ?? null);
      })
      .catch(() => { if (!cancelled) setLists([]); });

    return () => { cancelled = true; };
  }, []);

  // The completion toggle needs the target list's columns.
  useEffect(() => {
    if (!targetListId) { setStatuses([]); return; }

    let cancelled = false;
    fetchList(targetListId)
      .then(list => { if (!cancelled) setStatuses(list.statuses ?? []); })
      .catch(() => { if (!cancelled) setStatuses([]); });

    return () => { cancelled = true; };
  }, [targetListId]);

  /* --------------------------------------------------------------- actions */

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title || !targetListId) return;

    try {
      setCreating(true);
      await createTask({ title, task_list_id: targetListId, ...link });
      setNewTitle('');
      load();
    } catch {
      toast.error(t('tasks.save-failed'));
    } finally {
      setCreating(false);
    }
  };

  /**
   * Completion has to resolve against the task's *own* list, not the create
   * picker's — a contact's tasks can live in several lists, each with its own
   * columns.
   */
  const handleToggleComplete = async (task: WorkspaceTask) => {
    const done = isTaskDone(task);

    let columns = statuses;
    if (task.task_list_id && task.task_list_id !== targetListId) {
      try {
        columns = (await fetchList(task.task_list_id)).statuses ?? [];
      } catch {
        columns = [];
      }
    }

    const target = columns.find(s => (done ? s.type === 'not_started' : s.type === 'done'));
    if (!target) {
      toast.error(t('tasks.no-done-column'));
      return;
    }

    // Optimistic — the tick must feel instant.
    setTasks(prev => prev.map(item =>
      item.id === task.id ? { ...item, status_obj: target, task_status_id: target.id } : item));

    try {
      await updateTask(task.id, { task_status_id: target.id });
      load();
    } catch {
      toast.error(t('tasks.save-failed'));
      load();
    }
  };

  const openCount = useMemo(() => tasks.filter(task => !isTaskDone(task)).length, [tasks]);

  /* -------------------------------------------------------------------- ui */

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t('lead-details.tabs.tasks')}</h3>
        {!loading && (
          <span className="text-xs text-muted-foreground">
            {openCount} {t('tasks.open')}
          </span>
        )}

        {lists.length > 1 && (
          <Select
            value={targetListId ? String(targetListId) : undefined}
            onValueChange={value => setTargetListId(Number(value))}
          >
            <SelectTrigger className="ml-auto h-8 w-44 text-xs">
              <SelectValue placeholder={t('tasks.list-name')} />
            </SelectTrigger>
            <SelectContent>
              {lists.map(list => (
                <SelectItem key={list.id} value={String(list.id)}>{list.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Inline create — no modal for the common case of jotting a follow-up. */}
      <div className="flex items-center gap-2">
        <Input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder={t('tasks.title-placeholder')}
          className="h-9 text-sm"
          disabled={!targetListId}
        />
        <Button
          size="icon"
          variant="outline"
          onClick={handleCreate}
          disabled={!newTitle.trim() || !targetListId || creating}
        >
          {creating ? <Loader2 className="animate-spin" /> : <Plus />}
        </Button>
      </div>

      {!targetListId && !loading && (
        <p className="text-xs text-muted-foreground">{t('tasks.no-list-desc')}</p>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
          <ListTodo className="h-7 w-7 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">{t('tasks.empty-title')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {tasks.map(task => {
            const done = isTaskDone(task);

            return (
              <li
                key={task.id}
                className="group flex items-center gap-3 px-3 py-2.5 transition-colors duration-fast ease-standard hover:bg-hover"
              >
                <button
                  type="button"
                  onClick={() => handleToggleComplete(task)}
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-fast',
                    done
                      ? 'border-success bg-success text-success-foreground'
                      : 'border-muted-foreground/40 hover:border-primary',
                  )}
                  aria-label={done ? t('tasks.unarchive') : t('tasks.archive')}
                >
                  {done && <CheckCircle2 className="h-3 w-3" />}
                </button>

                <button
                  type="button"
                  onClick={() => setDetailId(task.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span
                    className={cn(
                      'block truncate text-sm',
                      done ? 'text-muted-foreground line-through' : 'text-foreground',
                    )}
                  >
                    {task.title}
                  </span>
                </button>

                <div className="hidden items-center gap-3 sm:flex">
                  <TaskMetaIcons task={task} />
                  <StatusPill status={task.status_obj} />
                  <DueDateChip task={task} />
                  <PriorityFlag priority={task.priority} />
                  <AssigneeStack users={task.assignees} max={2} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <TaskDetailModal
        open={detailId !== null}
        taskId={detailId}
        onClose={() => setDetailId(null)}
        onSaved={load}
        onDeleted={() => { setDetailId(null); load(); }}
      />
    </div>
  );
};

export default LeadTasksPanel;
