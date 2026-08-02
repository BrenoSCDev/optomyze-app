/**
 * LIST VIEW
 *
 * Rows grouped under collapsible headers. Grouping is a client-side concern —
 * the API returns a flat page and this decides how to slice it, so switching
 * "group by" never costs a round trip.
 */

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, CircleDashed, GitBranch, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AssigneeStack, DueDateChip, PriorityFlag, StatusPill, TaskMetaIcons, TaskTags,
} from './TaskBits';
import {
  PRIORITY_META, PRIORITY_ORDER, TaskStatus, WorkspaceTask,
  isTaskDone, taskLeadName,
} from '@/services/taskWorkspaceApi';

export type GroupBy = 'status' | 'priority' | 'assignee' | 'due' | 'none';

interface Props {
  tasks: WorkspaceTask[];
  statuses: TaskStatus[];
  loading: boolean;
  groupBy: GroupBy;
  selected: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectMany: (ids: number[], select: boolean) => void;
  onOpenTask: (task: WorkspaceTask) => void;
  onToggleComplete: (task: WorkspaceTask) => void;
  onQuickAdd?: (statusId: number | null) => void;
}

interface Group {
  key: string;
  label: string;
  color?: string;
  statusId: number | null;
  tasks: WorkspaceTask[];
}

const TaskListView: React.FC<Props> = ({
  tasks, statuses, loading, groupBy, selected,
  onToggleSelect, onToggleSelectMany, onOpenTask, onToggleComplete, onQuickAdd,
}) => {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = useMemo<Group[]>(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', label: '', statusId: null, tasks }];
    }

    if (groupBy === 'status') {
      // Driven by the status list, not by what happens to be on this page, so
      // empty columns still show and keep the board's own ordering.
      const byStatus = new Map<number, WorkspaceTask[]>();
      tasks.forEach(task => {
        if (task.task_status_id == null) return;
        const bucket = byStatus.get(task.task_status_id) ?? [];
        bucket.push(task);
        byStatus.set(task.task_status_id, bucket);
      });

      const groups: Group[] = statuses.map(status => ({
        key: `s${status.id}`,
        label: status.name,
        color: status.color,
        statusId: status.id,
        tasks: byStatus.get(status.id) ?? [],
      }));

      const unfiled = tasks.filter(task => task.task_status_id == null);
      if (unfiled.length) {
        groups.push({ key: 'none', label: t('tasks.no-status'), statusId: null, tasks: unfiled });
      }

      return groups;
    }

    if (groupBy === 'priority') {
      return PRIORITY_ORDER.map(priority => ({
        key: `p${priority}`,
        label: PRIORITY_META[priority].label,
        color: PRIORITY_META[priority].color,
        statusId: null,
        tasks: tasks.filter(task => task.priority === priority),
      })).filter(group => group.tasks.length);
    }

    if (groupBy === 'assignee') {
      const byUser = new Map<string, Group>();

      tasks.forEach(task => {
        // A task with several assignees appears under each of them — that is
        // what "show me Ana's work" has to mean.
        const owners = task.assignees?.length ? task.assignees : [null];

        owners.forEach(user => {
          const key = user ? `u${user.id}` : 'unassigned';
          const label = user?.name ?? t('tasks.unassigned');
          const group = byUser.get(key) ?? { key, label, statusId: null, tasks: [] };
          group.tasks.push(task);
          byUser.set(key, group);
        });
      });

      return [...byUser.values()].sort((a, b) =>
        a.key === 'unassigned' ? 1 : b.key === 'unassigned' ? -1 : a.label.localeCompare(b.label));
    }

    // group by due-date bucket
    const now = new Date();
    const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const buckets: Record<string, WorkspaceTask[]> = {
      overdue: [], today: [], week: [], later: [], none: [],
    };

    tasks.forEach(task => {
      if (!task.due_date) return void buckets.none.push(task);

      const days = Math.round((startOf(new Date(task.due_date)) - startOf(now)) / 86_400_000);
      if (days < 0) buckets.overdue.push(task);
      else if (days === 0) buckets.today.push(task);
      else if (days <= 7) buckets.week.push(task);
      else buckets.later.push(task);
    });

    return ([
      ['overdue', t('tasks.overdue'), '#ef4444'],
      ['today',   t('tasks.due-today'), '#f59e0b'],
      ['week',    t('tasks.this-week'), '#3b82f6'],
      ['later',   t('tasks.later'), '#94a3b8'],
      ['none',    t('tasks.no-due-date'), '#94a3b8'],
    ] as const)
      .map(([key, label, color]) => ({
        key, label, color, statusId: null, tasks: buckets[key],
      }))
      .filter(group => group.tasks.length);
  }, [tasks, statuses, groupBy, t]);

  const toggleGroup = (key: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <CircleDashed className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">{t('tasks.empty-title')}</p>
        <p className="max-w-xs text-xs text-muted-foreground">{t('tasks.empty-desc')}</p>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {groups.map(group => {
        const isCollapsed = collapsed.has(group.key);
        const ids = group.tasks.map(task => task.id);
        const allSelected = ids.length > 0 && ids.every(id => selected.has(id));

        return (
          <section key={group.key}>
            {groupBy !== 'none' && (
              <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  {isCollapsed
                    ? <ChevronRight className="h-3.5 w-3.5" />
                    : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {group.color && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                )}
                <span className="text-sm font-medium text-foreground">{group.label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{group.tasks.length}</span>

                {ids.length > 0 && (
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={checked => onToggleSelectMany(ids, !!checked)}
                    aria-label={t('tasks.select-group')}
                    className="ml-2"
                  />
                )}

                {onQuickAdd && groupBy === 'status' && group.statusId !== null && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 text-xs"
                    onClick={() => onQuickAdd(group.statusId)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />{t('tasks.add-task')}
                  </Button>
                )}
              </header>
            )}

            {!isCollapsed && (
              <ul>
                {group.tasks.map(task => (
                  <TaskRow
                    key={`${group.key}-${task.id}`}
                    task={task}
                    selected={selected.has(task.id)}
                    onToggleSelect={() => onToggleSelect(task.id)}
                    onOpen={() => onOpenTask(task)}
                    onToggleComplete={() => onToggleComplete(task)}
                    showStatus={groupBy !== 'status'}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------- row */

interface RowProps {
  task: WorkspaceTask;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  onToggleComplete: () => void;
  showStatus: boolean;
}

const TaskRow: React.FC<RowProps> = React.memo(({
  task, selected, onToggleSelect, onOpen, onToggleComplete, showStatus,
}) => {
  const done = isTaskDone(task);
  const leadName = taskLeadName(task.lead);

  return (
    <li
      className={cn(
        'group flex items-center gap-3 border-b border-border/60 px-4 py-2.5 transition-colors duration-fast ease-standard',
        selected ? 'bg-selected' : 'hover:bg-hover',
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggleSelect}
        onClick={e => e.stopPropagation()}
        aria-label="Select task"
      />

      {/* Completion toggle, deliberately separate from row selection. */}
      <button
        type="button"
        onClick={onToggleComplete}
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-fast',
          done
            ? 'border-success bg-success text-success-foreground'
            : 'border-muted-foreground/40 hover:border-primary',
        )}
        aria-label={done ? 'Reopen task' : 'Complete task'}
      >
        {done && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 6.5L4.5 9L10 3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        {task.parent_task_id && <GitBranch className="h-3 w-3 shrink-0 text-muted-foreground" />}
        <span
          className={cn(
            'truncate text-sm',
            done ? 'text-muted-foreground line-through' : 'text-foreground',
          )}
        >
          {task.title}
        </span>
        {leadName && (
          <span className="hidden shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground lg:inline">
            {leadName}
          </span>
        )}
      </button>

      <div className="hidden items-center gap-3 md:flex">
        <TaskMetaIcons task={task} />
        <TaskTags tags={task.tags} />
        {showStatus && <StatusPill status={task.status_obj} />}
        <DueDateChip task={task} />
        <PriorityFlag priority={task.priority} />
        <AssigneeStack users={task.assignees} />
      </div>
    </li>
  );
});

TaskRow.displayName = 'TaskRow';

export default TaskListView;
