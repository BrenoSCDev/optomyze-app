/**
 * BOARD VIEW
 *
 * One column per status, drag-and-drop between them.
 *
 * Follows the lead Kanban's approach: columns are droppables, cards are
 * draggables (not sortables), which avoids the mixed droppable/sortable
 * collision problems that show up when a card is both.
 *
 * Drops are applied optimistically and rolled back if the server rejects the
 * move — a card that snaps back after a visible pause feels broken.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable,
} from '@dnd-kit/core';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  KANBAN_DROP_ANIMATION, KanbanDragPreview, KanbanDragSource,
  kanbanCollisionDetection, useKanbanSensors,
} from '@/components/dnd/kanbanDnd';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AssigneeStack, DueDateChip, PriorityFlag, ProgressBar, TaskMetaIcons, TaskTags,
} from './TaskBits';
import {
  BoardColumn, TaskStatus, WorkspaceTask, isTaskDone, taskLeadName, taskProgress,
} from '@/services/taskWorkspaceApi';

interface Props {
  columns: BoardColumn[];
  loading: boolean;
  onOpenTask: (task: WorkspaceTask) => void;
  onQuickAdd: (statusId: number) => void;
  /** Persists the move; resolving false rolls the optimistic update back. */
  onMoveTask: (taskId: number, statusId: number, beforeId?: number, afterId?: number) => Promise<boolean>;
  onEditStatus?: (status: TaskStatus) => void;
  onDeleteStatus?: (status: TaskStatus) => void;
}

const TaskBoardView: React.FC<Props> = ({
  columns, loading, onOpenTask, onQuickAdd, onMoveTask, onEditStatus, onDeleteStatus,
}) => {
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState<number | null>(null);
  /** Local override so a dropped card moves instantly. */
  const [optimistic, setOptimistic] = useState<Record<number, number>>({});

  // Shared with the lead and deal funnels so all three boards feel identical.
  const sensors = useKanbanSensors();

  const view = useMemo<BoardColumn[]>(() => {
    if (!Object.keys(optimistic).length) return columns;

    const moved = new Map<number, WorkspaceTask>();
    columns.forEach(col => col.tasks.forEach(task => {
      if (optimistic[task.id] !== undefined) moved.set(task.id, task);
    }));

    return columns.map(col => ({
      status: col.status,
      tasks: [
        ...col.tasks.filter(task => optimistic[task.id] === undefined),
        ...[...moved.values()].filter(task => optimistic[task.id] === col.status.id),
      ],
    }));
  }, [columns, optimistic]);

  const activeTask = useMemo(
    () => view.flatMap(col => col.tasks).find(task => task.id === activeId) ?? null,
    [view, activeId],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = Number(active.id);
    const targetStatusId = Number(String(over.id).replace('status-', ''));
    if (!targetStatusId) return;

    const current = view.find(col => col.tasks.some(task => task.id === taskId));
    if (current?.status.id === targetStatusId) return;

    setOptimistic(prev => ({ ...prev, [taskId]: targetStatusId }));

    const ok = await onMoveTask(taskId, targetStatusId);

    // The parent refetches on success; clearing here either way stops the
    // override from masking whatever the server actually returned.
    setOptimistic(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });

    if (!ok) return;
  }, [view, onMoveTask]);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-72 shrink-0 space-y-2">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 3 }).map((__, j) => <Skeleton key={j} className="h-24 w-full" />)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={kanbanCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex h-full gap-4 overflow-x-auto p-4">
        {view.map(column => (
          <BoardColumnView
            key={column.status.id}
            column={column}
            activeId={activeId}
            onOpenTask={onOpenTask}
            onQuickAdd={onQuickAdd}
            onEditStatus={onEditStatus}
            onDeleteStatus={onDeleteStatus}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={KANBAN_DROP_ANIMATION}>
        {activeTask && (
          <KanbanDragPreview className="w-72">
            <TaskCard task={activeTask} onOpen={() => {}} dragging />
          </KanbanDragPreview>
        )}
      </DragOverlay>
    </DndContext>
  );
};

/* ---------------------------------------------------------------- column */

const BoardColumnView: React.FC<{
  column: BoardColumn;
  activeId: number | null;
  onOpenTask: (task: WorkspaceTask) => void;
  onQuickAdd: (statusId: number) => void;
  onEditStatus?: (status: TaskStatus) => void;
  onDeleteStatus?: (status: TaskStatus) => void;
}> = ({ column, activeId, onOpenTask, onQuickAdd, onEditStatus, onDeleteStatus }) => {
  const { t } = useLanguage();
  const { isOver, setNodeRef } = useDroppable({ id: `status-${column.status.id}` });

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      <header className="mb-2 flex items-center gap-2 px-1">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: column.status.color }}
        />
        <span className="truncate text-sm font-medium text-foreground">{column.status.name}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{column.tasks.length}</span>

        <div className="ml-auto flex items-center">
          <Button variant="ghost" size="icon-sm" onClick={() => onQuickAdd(column.status.id)}>
            <Plus />
          </Button>
          {(onEditStatus || onDeleteStatus) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm"><MoreHorizontal /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEditStatus && (
                  <DropdownMenuItem onClick={() => onEditStatus(column.status)}>
                    {t('tasks.edit-status')}
                  </DropdownMenuItem>
                )}
                {onDeleteStatus && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeleteStatus(column.status)}
                  >
                    {t('tasks.delete-status')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg p-2 transition-colors duration-fast ease-standard',
          isOver ? 'bg-primary/5 ring-1 ring-primary/30' : 'bg-muted/30',
        )}
      >
        {column.tasks.map(task => (
          <DraggableCard
            key={task.id}
            task={task}
            onOpen={() => onOpenTask(task)}
            hidden={activeId === task.id}
          />
        ))}

        <button
          type="button"
          onClick={() => onQuickAdd(column.status.id)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors duration-fast hover:bg-hover hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />{t('tasks.add-task')}
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ card */

const DraggableCard: React.FC<{ task: WorkspaceTask; onOpen: () => void; hidden: boolean }> = ({
  task, onOpen, hidden,
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: task.id });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <KanbanDragSource isDragging={hidden}>
        <TaskCard task={task} onOpen={onOpen} />
      </KanbanDragSource>
    </div>
  );
};

const TaskCard: React.FC<{ task: WorkspaceTask; onOpen: () => void; dragging?: boolean }> = ({
  task, onOpen, dragging,
}) => {
  const done = isTaskDone(task);
  const progress = taskProgress(task);
  const leadName = taskLeadName(task.lead);

  return (
    <article
      onClick={onOpen}
      className={cn(
        'cursor-pointer space-y-2 rounded-lg border border-border bg-card p-3 transition-colors duration-fast ease-standard',
        dragging ? 'shadow-elevation-3' : 'hover:border-primary/40',
      )}
    >
      <div className="flex items-start gap-2">
        <PriorityFlag priority={task.priority} />
        <p className={cn('min-w-0 flex-1 text-sm leading-snug', done ? 'text-muted-foreground line-through' : 'text-foreground')}>
          {task.title}
        </p>
      </div>

      {leadName && (
        <p className="truncate rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
          {leadName}
        </p>
      )}

      <TaskTags tags={task.tags} max={3} />

      {progress !== null && <ProgressBar value={progress} />}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DueDateChip task={task} />
          <TaskMetaIcons task={task} />
        </div>
        <AssigneeStack users={task.assignees} max={2} />
      </div>
    </article>
  );
};

export default TaskBoardView;
