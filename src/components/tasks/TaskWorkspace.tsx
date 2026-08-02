/**
 * TASK WORKSPACE
 *
 * The module shell: Space/List tree on the left, one of three views on the
 * right, and a filter bar shared by all of them.
 *
 * Filters live here rather than in each view so switching List -> Board ->
 * Calendar never loses what you had narrowed down to.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive, ArchiveRestore, CalendarDays, CheckSquare, Filter, KanbanSquare,
  LayoutList, Loader2, Plus, Search, Tag as TagIcon, Trash2, UserPlus, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/services/api';
import TaskSpaceSidebar from './TaskSpaceSidebar';
import TaskListView, { GroupBy } from './TaskListView';
import TaskBoardView from './TaskBoardView';
import TaskCalendarView from './TaskCalendarView';
import TaskDetailModal from './TaskDetailModal';
import {
  ArchiveMode, BoardColumn, PRIORITY_META, PRIORITY_ORDER, TaskFilters,
  TaskListSummary, TaskPageMeta, TaskPriority, TaskSpace, TaskStatus, TaskSummary,
  TaskUser, TaskView, WorkspaceTask,
  bulkTaskAction, createList, createSpace, createTask, deleteList, deleteSpace,
  fetchBoard, fetchList, fetchSpaces, fetchTaskCalendar, fetchTaskSummary,
  fetchTasks, isTaskDone, moveTask, setListArchived, setSpaceArchived,
  updateList, updateSpace, updateTask,
} from '@/services/taskWorkspaceApi';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const TaskWorkspace: React.FC = () => {
  const { t } = useLanguage();

  /* ------------------------------------------------------------ hierarchy */
  const [spaces, setSpaces] = useState<TaskSpace[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [activeList, setActiveList] = useState<TaskListSummary | null>(null);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);

  /* ----------------------------------------------------------------- data */
  const [view, setView] = useState<TaskView>('list');
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [meta, setMeta] = useState<TaskPageMeta | null>(null);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [calendarCursor, setCalendarCursor] = useState(() => startOfDay(new Date()));

  /* -------------------------------------------------------------- filters */
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [priority, setPriority] = useState<TaskPriority[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [archived, setArchived] = useState<ArchiveMode>('active');
  const [onlyMine, setOnlyMine] = useState(false);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [sortBy, setSortBy] = useState<TaskFilters['sort_by']>('manual');

  /* ------------------------------------------------------------ selection */
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  /* --------------------------------------------------------------- modals */
  const [detailId, setDetailId] = useState<number | null>(null);
  const [quickAdd, setQuickAdd] = useState<{ statusId: number | null; dueDate?: string } | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [spaceDialog, setSpaceDialog] = useState<{ space: TaskSpace | null } | null>(null);
  const [listDialog, setListDialog] = useState<{ space: TaskSpace; list: TaskListSummary | null } | null>(null);
  const [dialogName, setDialogName] = useState('');

  const [users, setUsers] = useState<TaskUser[]>([]);
  const [allTags, setAllTags] = useState<{ id: number; name: string; color: string | null }[]>([]);

  /* ------------------------------------------------------------ debouncing */

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/api/users').then(r => r.data?.data ?? r.data ?? []).catch(() => []),
      api.get('/api/tags', { params: { scope: 'task' } }).then(r => r.data?.data ?? r.data ?? []).catch(() => []),
    ]).then(([userList, tagList]) => {
      if (cancelled) return;
      setUsers(Array.isArray(userList) ? userList : []);
      setAllTags(Array.isArray(tagList) ? tagList : []);
    });
    return () => { cancelled = true; };
  }, []);

  /* ------------------------------------------------------------- hierarchy */

  const loadSpaces = useCallback(async () => {
    try {
      setSpacesLoading(true);
      const list = await fetchSpaces();
      setSpaces(list);

      // Land on the first list so the workspace is never an empty shell.
      setActiveList(prev => {
        if (prev) {
          const stillThere = list.flatMap(s => s.lists).find(l => l.id === prev.id);
          if (stillThere) return stillThere;
        }
        return list.find(s => s.lists.length)?.lists[0] ?? null;
      });
    } catch {
      toast.error(t('tasks.load-failed'));
    } finally {
      setSpacesLoading(false);
    }
  }, [t]);

  useEffect(() => { loadSpaces(); }, [loadSpaces]);

  // Statuses belong to the list, so they reload whenever the list changes.
  useEffect(() => {
    if (!activeList) { setStatuses([]); return; }

    let cancelled = false;
    fetchList(activeList.id)
      .then(full => { if (!cancelled) setStatuses(full.statuses ?? []); })
      .catch(() => { if (!cancelled) setStatuses([]); });

    return () => { cancelled = true; };
  }, [activeList?.id]);

  /* ------------------------------------------------------------------ data */

  const filters = useMemo<TaskFilters>(() => ({
    list_id: activeList?.id ?? null,
    priority: priority.length ? priority : undefined,
    assignee_id: assigneeIds.length ? assigneeIds : undefined,
    tag_id: tagIds.length ? tagIds : undefined,
    archived,
    mine: onlyMine || undefined,
    overdue: onlyOverdue || undefined,
    q: debouncedSearch || undefined,
    sort_by: sortBy,
  }), [activeList?.id, priority, assigneeIds, tagIds, archived, onlyMine, onlyOverdue, debouncedSearch, sortBy]);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      if (view === 'board') {
        if (!activeList) { setColumns([]); return; }
        const board = await fetchBoard(activeList.id, filters);
        setColumns(board.columns);
        return;
      }

      if (view === 'calendar') {
        // A whole padded month, so tasks in the leading/trailing week are not
        // missing from the grid.
        const first = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
        const last = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 0);
        const list = await fetchTaskCalendar(
          new Date(first.getTime() - 7 * 86_400_000).toISOString().slice(0, 10),
          new Date(last.getTime() + 7 * 86_400_000).toISOString().slice(0, 10),
          filters,
        );
        setTasks(list);
        return;
      }

      const res = await fetchTasks(filters, page, perPage);
      setTasks(res.tasks);
      setMeta(res.meta);
    } catch {
      toast.error(t('tasks.load-failed'));
    } finally {
      setLoading(false);
    }
  }, [view, activeList, filters, page, perPage, calendarCursor, t]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { fetchTaskSummary().then(setSummary).catch(() => {}); }, [tasks.length, columns.length]);

  // Changing what is being looked at invalidates a selection built against it.
  useEffect(() => { setSelected(new Set()); setPage(1); }, [filters]);

  /* ------------------------------------------------------------ selection */

  const toggleSelect = useCallback((id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectMany = useCallback((ids: number[], select: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => (select ? next.add(id) : next.delete(id)));
      return next;
    });
  }, []);

  const runBulk = async (action: Parameters<typeof bulkTaskAction>[1], extra?: Record<string, unknown>) => {
    if (!selected.size) return;
    try {
      setBulkBusy(true);
      const updated = await bulkTaskAction([...selected], action, extra);
      toast.success(t('tasks.bulk-done').replace('{n}', String(updated)));
      setSelected(new Set());
      load();
    } catch {
      toast.error(t('tasks.bulk-failed'));
    } finally {
      setBulkBusy(false);
    }
  };

  /* --------------------------------------------------------------- actions */

  const handleToggleComplete = async (task: WorkspaceTask) => {
    const done = isTaskDone(task);
    const target = statuses.find(s => (done ? s.type === 'not_started' : s.type === 'done'));

    if (!target) {
      toast.error(t('tasks.no-done-column'));
      return;
    }

    // Optimistic: the tick has to feel instant.
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

  const handleMoveTask = async (taskId: number, statusId: number) => {
    try {
      await moveTask(taskId, { task_status_id: statusId });
      load();
      return true;
    } catch {
      toast.error(t('tasks.move-failed'));
      load();
      return false;
    }
  };

  const handleQuickCreate = async () => {
    const title = quickTitle.trim();
    if (!title || !activeList) return;

    try {
      await createTask({
        title,
        task_list_id: activeList.id,
        task_status_id: quickAdd?.statusId ?? undefined,
        due_date: quickAdd?.dueDate ?? undefined,
      });
      setQuickTitle('');
      setQuickAdd(null);
      load();
      loadSpaces();
    } catch {
      toast.error(t('tasks.save-failed'));
    }
  };

  /* -------------------------------------------------- space/list dialogs */

  const submitSpaceDialog = async () => {
    const name = dialogName.trim();
    if (!name || !spaceDialog) return;

    try {
      spaceDialog.space
        ? await updateSpace(spaceDialog.space.id, { name })
        : await createSpace({ name });
      setSpaceDialog(null);
      setDialogName('');
      loadSpaces();
    } catch {
      toast.error(t('tasks.save-failed'));
    }
  };

  const submitListDialog = async () => {
    const name = dialogName.trim();
    if (!name || !listDialog) return;

    try {
      listDialog.list
        ? await updateList(listDialog.list.id, { name })
        : await createList({ task_space_id: listDialog.space.id, name });
      setListDialog(null);
      setDialogName('');
      loadSpaces();
    } catch {
      toast.error(t('tasks.save-failed'));
    }
  };

  const activeFilterCount =
    priority.length + assigneeIds.length + tagIds.length +
    (archived !== 'active' ? 1 : 0) + (onlyMine ? 1 : 0) + (onlyOverdue ? 1 : 0);

  const clearFilters = () => {
    setPriority([]); setAssigneeIds([]); setTagIds([]);
    setArchived('active'); setOnlyMine(false); setOnlyOverdue(false);
  };

  /* ------------------------------------------------------------------- ui */

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <TaskSpaceSidebar
        spaces={spaces}
        loading={spacesLoading}
        activeListId={activeList?.id ?? null}
        onSelectList={list => { setActiveList(list); setPage(1); }}
        onCreateSpace={() => { setDialogName(''); setSpaceDialog({ space: null }); }}
        onCreateList={space => { setDialogName(''); setListDialog({ space, list: null }); }}
        onEditSpace={space => { setDialogName(space.name); setSpaceDialog({ space }); }}
        onArchiveSpace={async space => {
          await setSpaceArchived(space.id, true);
          toast.success(t('tasks.archive-done'));
          loadSpaces();
        }}
        onDeleteSpace={async space => {
          if (!window.confirm(t('tasks.confirm-delete-space'))) return;
          await deleteSpace(space.id);
          toast.success(t('tasks.deleted'));
          loadSpaces();
        }}
        onEditList={list => {
          const space = spaces.find(s => s.id === list.task_space_id);
          if (space) { setDialogName(list.name); setListDialog({ space, list }); }
        }}
        onArchiveList={async list => {
          await setListArchived(list.id, true);
          toast.success(t('tasks.archive-done'));
          loadSpaces();
        }}
        onDeleteList={async list => {
          if (!window.confirm(t('tasks.confirm-delete-list'))) return;
          await deleteList(list.id);
          toast.success(t('tasks.deleted'));
          loadSpaces();
        }}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* ------------------------------------------------------ toolbar */}
        <div className="shrink-0 border-b border-border">
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
            <h1 className="mr-1 truncate text-base font-semibold text-foreground">
              {activeList?.name ?? t('tasks.everything')}
            </h1>

            {summary && (
              <div className="hidden items-center gap-3 text-xs text-muted-foreground lg:flex">
                <span>{summary.open} {t('tasks.open')}</span>
                {summary.overdue > 0 && (
                  <span className="font-medium text-destructive">
                    {summary.overdue} {t('tasks.overdue')}
                  </span>
                )}
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('tasks.search')}
                  className="h-8 w-44 pl-8 text-sm"
                />
              </div>

              {/* view switcher */}
              <div className="flex items-center rounded-md border border-border p-0.5">
                {([
                  ['list', LayoutList],
                  ['board', KanbanSquare],
                  ['calendar', CalendarDays],
                ] as const).map(([mode, Icon]) => (
                  <Tooltip key={mode}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={view === mode ? 'secondary' : 'ghost'}
                        size="icon-sm"
                        onClick={() => setView(mode)}
                      >
                        <Icon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t(`tasks.view-${mode}`)}</TooltipContent>
                  </Tooltip>
                ))}
              </div>

              <FilterMenu
                activeCount={activeFilterCount}
                priority={priority} setPriority={setPriority}
                users={users} assigneeIds={assigneeIds} setAssigneeIds={setAssigneeIds}
                tags={allTags} tagIds={tagIds} setTagIds={setTagIds}
                archived={archived} setArchived={setArchived}
                onlyMine={onlyMine} setOnlyMine={setOnlyMine}
                onlyOverdue={onlyOverdue} setOnlyOverdue={setOnlyOverdue}
                onClear={clearFilters}
              />

              {view === 'list' && (
                <Select value={groupBy} onValueChange={v => setGroupBy(v as GroupBy)}>
                  <SelectTrigger className="h-8 w-32 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['status', 'priority', 'assignee', 'due', 'none'] as GroupBy[]).map(option => (
                      <SelectItem key={option} value={option}>{t(`tasks.group-${option}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                size="sm"
                onClick={() => { setQuickTitle(''); setQuickAdd({ statusId: null }); }}
                disabled={!activeList}
              >
                <Plus className="mr-1 h-4 w-4" />{t('tasks.new-task')}
              </Button>
            </div>
          </div>

          {/* --------------------------------------------------- bulk bar */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border bg-selected px-4 py-2">
              <span className="text-sm font-medium text-foreground">
                {t('tasks.n-selected').replace('{n}', String(selected.size))}
              </span>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={bulkBusy}>
                      <UserPlus className="mr-1 h-3.5 w-3.5" />{t('tasks.assign')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
                    {users.map(user => (
                      <DropdownMenuCheckboxItem
                        key={user.id}
                        checked={false}
                        onCheckedChange={() => runBulk('assign', { user_ids: [user.id] })}
                      >
                        {user.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={bulkBusy}>
                      <TagIcon className="mr-1 h-3.5 w-3.5" />{t('tasks.tag')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
                    {allTags.map(tag => (
                      <DropdownMenuCheckboxItem
                        key={tag.id}
                        checked={false}
                        onCheckedChange={() => runBulk('tag', { tag_ids: [tag.id], mode: 'attach' })}
                      >
                        {tag.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={bulkBusy}>
                      {t('tasks.priority')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {PRIORITY_ORDER.map(p => (
                      <DropdownMenuCheckboxItem
                        key={p}
                        checked={false}
                        onCheckedChange={() => runBulk('priority', { priority: p })}
                      >
                        {PRIORITY_META[p].label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkBusy}
                  onClick={() => runBulk(archived === 'archived' ? 'unarchive' : 'archive')}
                >
                  {archived === 'archived'
                    ? <><ArchiveRestore className="mr-1 h-3.5 w-3.5" />{t('tasks.unarchive')}</>
                    : <><Archive className="mr-1 h-3.5 w-3.5" />{t('tasks.archive')}</>}
                </Button>

                <Button
                  variant="ghost-destructive"
                  size="sm"
                  disabled={bulkBusy}
                  onClick={() => {
                    if (window.confirm(t('tasks.confirm-bulk-delete'))) runBulk('delete');
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />{t('common.delete')}
                </Button>

                <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())}>
                  <X />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* --------------------------------------------------------- body */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-surface">
          {!activeList && !spacesLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <CheckSquare className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">{t('tasks.no-list-title')}</p>
              <p className="max-w-sm text-xs text-muted-foreground">{t('tasks.no-list-desc')}</p>
              <Button size="sm" onClick={() => { setDialogName(''); setSpaceDialog({ space: null }); }}>
                <Plus className="mr-1 h-4 w-4" />{t('tasks.new-space')}
              </Button>
            </div>
          ) : view === 'board' ? (
            <TaskBoardView
              columns={columns}
              loading={loading}
              onOpenTask={task => setDetailId(task.id)}
              onQuickAdd={statusId => { setQuickTitle(''); setQuickAdd({ statusId }); }}
              onMoveTask={handleMoveTask}
            />
          ) : view === 'calendar' ? (
            <TaskCalendarView
              tasks={tasks}
              loading={loading}
              cursor={calendarCursor}
              onCursorChange={setCalendarCursor}
              onOpenTask={task => setDetailId(task.id)}
              onCreateOnDay={day => {
                setQuickTitle('');
                setQuickAdd({
                  statusId: null,
                  dueDate: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}T09:00`,
                });
              }}
            />
          ) : (
            <>
              <TaskListView
                tasks={tasks}
                statuses={statuses}
                loading={loading}
                groupBy={groupBy}
                selected={selected}
                onToggleSelect={toggleSelect}
                onToggleSelectMany={toggleSelectMany}
                onOpenTask={task => setDetailId(task.id)}
                onToggleComplete={handleToggleComplete}
                onQuickAdd={statusId => { setQuickTitle(''); setQuickAdd({ statusId }); }}
              />

              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">
                    {t('tasks.showing')
                      .replace('{from}', String((meta.current_page - 1) * meta.per_page + 1))
                      .replace('{to}', String(Math.min(meta.current_page * meta.per_page, meta.total)))
                      .replace('{total}', String(meta.total))}
                  </span>

                  <div className="flex items-center gap-2">
                    <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
                      <SelectTrigger className="h-8 w-20 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(meta.page_sizes ?? [25]).map(size => (
                          <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline" size="sm"
                      disabled={meta.current_page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      {t('tasks.previous')}
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      disabled={meta.current_page >= meta.last_page}
                      onClick={() => setPage(p => p + 1)}
                    >
                      {t('tasks.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ------------------------------------------------------- detail */}
      <TaskDetailModal
        open={detailId !== null}
        taskId={detailId}
        statuses={statuses}
        onClose={() => setDetailId(null)}
        onSaved={() => { load(); loadSpaces(); }}
        onDeleted={() => { load(); loadSpaces(); }}
      />

      {/* ---------------------------------------------------- quick add */}
      <Dialog open={quickAdd !== null} onOpenChange={o => !o && setQuickAdd(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('tasks.new-task')}</DialogTitle></DialogHeader>
          <Input
            autoFocus
            value={quickTitle}
            onChange={e => setQuickTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuickCreate()}
            placeholder={t('tasks.title-placeholder')}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickAdd(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleQuickCreate} disabled={!quickTitle.trim()}>{t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------- space dialog */}
      <Dialog open={spaceDialog !== null} onOpenChange={o => !o && setSpaceDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {spaceDialog?.space ? t('tasks.edit-space') : t('tasks.new-space')}
            </DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={dialogName}
            onChange={e => setDialogName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitSpaceDialog()}
            placeholder={t('tasks.space-name')}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpaceDialog(null)}>{t('common.cancel')}</Button>
            <Button onClick={submitSpaceDialog} disabled={!dialogName.trim()}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------- list dialog */}
      <Dialog open={listDialog !== null} onOpenChange={o => !o && setListDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {listDialog?.list ? t('tasks.edit-list') : t('tasks.new-list')}
            </DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={dialogName}
            onChange={e => setDialogName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitListDialog()}
            placeholder={t('tasks.list-name')}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setListDialog(null)}>{t('common.cancel')}</Button>
            <Button onClick={submitListDialog} disabled={!dialogName.trim()}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ------------------------------------------------------------ filter menu */

const FilterMenu: React.FC<{
  activeCount: number;
  priority: TaskPriority[]; setPriority: (v: TaskPriority[]) => void;
  users: TaskUser[]; assigneeIds: number[]; setAssigneeIds: (v: number[]) => void;
  tags: { id: number; name: string }[]; tagIds: number[]; setTagIds: (v: number[]) => void;
  archived: ArchiveMode; setArchived: (v: ArchiveMode) => void;
  onlyMine: boolean; setOnlyMine: (v: boolean) => void;
  onlyOverdue: boolean; setOnlyOverdue: (v: boolean) => void;
  onClear: () => void;
}> = ({
  activeCount, priority, setPriority, users, assigneeIds, setAssigneeIds,
  tags, tagIds, setTagIds, archived, setArchived, onlyMine, setOnlyMine,
  onlyOverdue, setOnlyOverdue, onClear,
}) => {
  const { t } = useLanguage();

  const toggle = <T,>(list: T[], value: T, set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-1 h-3.5 w-3.5" />
          {t('tasks.filters')}
          {activeCount > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-96 w-56 overflow-y-auto">
        <DropdownMenuCheckboxItem checked={onlyMine} onCheckedChange={v => setOnlyMine(!!v)}>
          {t('tasks.only-mine')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={onlyOverdue} onCheckedChange={v => setOnlyOverdue(!!v)}>
          {t('tasks.only-overdue')}
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('tasks.priority')}</DropdownMenuLabel>
        {PRIORITY_ORDER.map(p => (
          <DropdownMenuCheckboxItem
            key={p}
            checked={priority.includes(p)}
            onCheckedChange={() => toggle(priority, p, setPriority)}
          >
            {PRIORITY_META[p].label}
          </DropdownMenuCheckboxItem>
        ))}

        {users.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t('tasks.assignees')}</DropdownMenuLabel>
            {users.map(user => (
              <DropdownMenuCheckboxItem
                key={user.id}
                checked={assigneeIds.includes(user.id)}
                onCheckedChange={() => toggle(assigneeIds, user.id, setAssigneeIds)}
              >
                {user.name}
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}

        {tags.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t('tasks.tags')}</DropdownMenuLabel>
            {tags.map(tag => (
              <DropdownMenuCheckboxItem
                key={tag.id}
                checked={tagIds.includes(tag.id)}
                onCheckedChange={() => toggle(tagIds, tag.id, setTagIds)}
              >
                {tag.name}
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('tasks.archived')}</DropdownMenuLabel>
        {(['active', 'archived', 'all'] as ArchiveMode[]).map(mode => (
          <DropdownMenuCheckboxItem
            key={mode}
            checked={archived === mode}
            onCheckedChange={() => setArchived(mode)}
          >
            {t(`tasks.archived-${mode}`)}
          </DropdownMenuCheckboxItem>
        ))}

        {activeCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <button
              type="button"
              onClick={onClear}
              className="w-full px-2 py-1.5 text-left text-sm text-muted-foreground hover:text-foreground"
            >
              {t('tasks.clear-filters')}
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TaskWorkspace;
