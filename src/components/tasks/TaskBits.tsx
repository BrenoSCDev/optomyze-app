/**
 * Small presentational pieces shared by every task view.
 *
 * Kept together because they are meaningless apart and always change as a set
 * — a status pill and a priority dot have to agree on size and weight or rows
 * stop lining up.
 */

import React from 'react';
import { AlertTriangle, CheckSquare, GitBranch, MessageSquare, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserAvatar from '@/components/ui/user-avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  PRIORITY_META, TaskPriority, TaskStatus, TaskUser, WorkspaceTask,
  isTaskOverdue, taskProgress,
} from '@/services/taskWorkspaceApi';

/* ------------------------------------------------------------- priority */

export const PriorityFlag: React.FC<{ priority: TaskPriority; withLabel?: boolean }> = ({
  priority, withLabel = false,
}) => {
  const meta = PRIORITY_META[priority];

  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {withLabel && <span className="text-muted-foreground">{meta.label}</span>}
    </span>
  );
};

/* --------------------------------------------------------------- status */

export const StatusPill: React.FC<{ status?: TaskStatus | null; className?: string }> = ({
  status, className,
}) => {
  if (!status) return null;

  return (
    <span
      className={cn(
        'inline-flex max-w-[10rem] items-center gap-1.5 truncate rounded-full px-2 py-0.5 text-xs font-medium',
        className,
      )}
      style={{
        // Tinted from the column's own colour so a renamed board still reads
        // correctly, with enough alpha to stay legible on both themes.
        backgroundColor: `${status.color}1f`,
        color: status.color,
      }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
      <span className="truncate">{status.name}</span>
    </span>
  );
};

/* ------------------------------------------------------------ assignees */

export const AssigneeStack: React.FC<{ users?: TaskUser[]; max?: number; size?: 'sm' | 'md' }> = ({
  users, max = 3, size = 'sm',
}) => {
  if (!users?.length) return null;

  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  const dim = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-7 w-7 text-xs';

  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map(user => (
        <Tooltip key={user.id}>
          <TooltipTrigger asChild>
            <div>
              <UserAvatar
                name={user.name}
                profilePicPath={user.profile_pic}
                className={cn(dim, 'ring-2 ring-card')}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>{user.name}</TooltipContent>
        </Tooltip>
      ))}
      {extra > 0 && (
        <span
          className={cn(
            dim,
            'flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground ring-2 ring-card',
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
};

/* ----------------------------------------------------------- due dates */

/**
 * Dates read as "Today"/"Tomorrow" near the present and fall back to a short
 * absolute date further out, which is what people actually scan for.
 */
export const formatDueDate = (iso: string, locale = 'en-GB'): string => {
  const date = new Date(iso);
  const today = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(date) - startOf(today)) / 86_400_000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';

  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  });
};

export const DueDateChip: React.FC<{ task: WorkspaceTask }> = ({ task }) => {
  if (!task.due_date) return null;

  const overdue = isTaskOverdue(task);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap text-xs',
        overdue ? 'font-medium text-destructive' : 'text-muted-foreground',
      )}
    >
      {overdue && <AlertTriangle className="h-3 w-3" />}
      {formatDueDate(task.due_date)}
    </span>
  );
};

/* ------------------------------------------------------------- metadata */

/**
 * The counters on a task row: subtasks, comments, checklist. Each is hidden
 * when zero so a simple task stays visually simple.
 */
export const TaskMetaIcons: React.FC<{ task: WorkspaceTask }> = ({ task }) => {
  const progress = taskProgress(task);

  const items = [
    task.subtasks_count
      ? { icon: GitBranch, label: `${task.completed_subtasks_count ?? 0}/${task.subtasks_count}` }
      : null,
    task.checklist_items_count
      ? { icon: CheckSquare, label: `${task.completed_checklist_count ?? 0}/${task.checklist_items_count}` }
      : null,
    task.comments_count ? { icon: MessageSquare, label: String(task.comments_count) } : null,
  ].filter(Boolean) as { icon: typeof GitBranch; label: string }[];

  if (!items.length) return null;

  return (
    <span className="flex items-center gap-2.5 text-xs text-muted-foreground">
      {items.map(({ icon: Icon, label }, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
      ))}
      {progress !== null && progress === 100 && (
        <span className="text-success">100%</span>
      )}
    </span>
  );
};

/* ----------------------------------------------------------------- tags */

export const TaskTags: React.FC<{ tags?: { id: number; name: string; color: string | null }[]; max?: number }> = ({
  tags, max = 2,
}) => {
  if (!tags?.length) return null;

  const shown = tags.slice(0, max);
  const extra = tags.length - shown.length;

  return (
    <span className="flex items-center gap-1">
      {shown.map(tag => (
        <span
          key={tag.id}
          className="max-w-[7rem] truncate rounded px-1.5 py-0.5 text-[11px] font-medium"
          style={{
            backgroundColor: `${tag.color ?? '#94a3b8'}1f`,
            color: tag.color ?? '#64748b',
          }}
        >
          {tag.name}
        </span>
      ))}
      {extra > 0 && <span className="text-[11px] text-muted-foreground">+{extra}</span>}
    </span>
  );
};

/* ------------------------------------------------------------- progress */

export const ProgressBar: React.FC<{ value: number; className?: string }> = ({ value, className }) => (
  <div className={cn('h-1 w-full overflow-hidden rounded-full bg-muted', className)}>
    <div
      className="h-full rounded-full bg-primary transition-all duration-base ease-standard"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);
