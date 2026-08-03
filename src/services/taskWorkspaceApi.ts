/**
 * TASK WORKSPACE API
 *
 * The workspace hierarchy is Space > List > Task > Subtask. A list owns its
 * board columns (TaskStatus), so "done" is whatever a company decides to call
 * it — `TaskStatus.type` is the stable semantic to branch on, never the name.
 *
 * Kept separate from the older `taskApi.ts`, which still backs the task panel
 * inside lead details and the reports dashboard.
 */

import api from './api';

/* ------------------------------------------------------------------ types */

export type StatusType = 'not_started' | 'active' | 'done' | 'closed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskView = 'list' | 'board' | 'calendar';
export type ArchiveMode = 'active' | 'archived' | 'all';

export interface TaskUser {
  id: number;
  name: string;
  email: string;
  profile_pic: string | null;
}

export interface TaskStatus {
  id: number;
  task_list_id: number;
  name: string;
  color: string;
  type: StatusType;
  order: number;
  is_default: boolean;
}

export interface TaskListSummary {
  id: number;
  task_space_id: number;
  name: string;
  description: string | null;
  color: string;
  order: number;
  default_view: TaskView;
  archived_at: string | null;
  open_tasks_count?: number;
  statuses?: TaskStatus[];
}

export interface TaskSpace {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  order: number;
  archived_at: string | null;
  lists: TaskListSummary[];
}

export interface TaskTag {
  id: number;
  name: string;
  color: string | null;
}

export interface TaskLeadRef {
  id: number;
  first_name: string | null;
  last_name: string | null;
  source_platform: string | null;
}

export interface WorkspaceTask {
  id: number;
  company_id: number;
  task_list_id: number | null;
  task_status_id: number | null;
  parent_task_id: number | null;
  lead_id: number | null;
  sale_id: number | null;

  title: string;
  description: string | null;
  /** Derived mirror of the status type — prefer `status` (the object). */
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: TaskPriority;

  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  archived_at: string | null;
  position: number;

  assigned_to: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;

  status_obj?: TaskStatus | null;
  list?: Pick<TaskListSummary, 'id' | 'name' | 'color' | 'task_space_id'> | null;
  assignees?: TaskUser[];
  watchers?: TaskUser[];
  creator?: TaskUser | null;
  tags?: TaskTag[];
  lead?: TaskLeadRef | null;
  sale?: { id: number; title: string } | null;
  parent?: { id: number; title: string } | null;
  subtasks?: WorkspaceTask[];
  checklist_items?: TaskChecklistItem[];
  comments?: TaskComment[];

  subtasks_count?: number;
  completed_subtasks_count?: number;
  comments_count?: number;
  checklist_items_count?: number;
  completed_checklist_count?: number;
}

export interface TaskChecklistItem {
  id: number;
  task_id: number;
  title: string;
  is_done: boolean;
  order: number;
  completed_at: string | null;
  completed_by: number | null;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number | null;
  body: string;
  mentions: number[] | null;
  edited_at: string | null;
  created_at: string;
  user?: TaskUser | null;
}

export interface TaskSummary {
  open: number;
  overdue: number;
  due_today: number;
  unscheduled: number;
  completed_this_week: number;
}

export interface TaskFilters {
  list_id?: number | null;
  space_id?: number | null;
  status_id?: number[];
  status_type?: StatusType[];
  priority?: TaskPriority[];
  assignee_id?: number[];
  tag_id?: number[];
  lead_id?: number | null;
  sale_id?: number | null;
  due_from?: string;
  due_to?: string;
  overdue?: boolean;
  mine?: boolean;
  archived?: ArchiveMode;
  q?: string;
  sort_by?: 'title' | 'due_date' | 'priority' | 'created' | 'updated' | 'manual';
  sort_dir?: 'asc' | 'desc';
  include_subtasks?: boolean;
}

export interface TaskPageMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  page_sizes: number[];
}

export interface BoardColumn {
  status: TaskStatus;
  tasks: WorkspaceTask[];
}

/* -------------------------------------------------------------- normalise */

/**
 * Laravel serialises the `status` relation over the top of the legacy `status`
 * enum column — same key, different shape. Splitting them here means no
 * component has to guess which one it is holding.
 */
const normalise = (raw: any): WorkspaceTask => {
  const statusObj = raw?.status && typeof raw.status === 'object' ? raw.status : null;

  return {
    ...raw,
    status: statusObj ? legacyFromType(statusObj.type) : raw?.status,
    status_obj: statusObj,
    checklist_items: raw?.checklist_items ?? raw?.checklistItems ?? undefined,
  };
};

const legacyFromType = (type: StatusType): WorkspaceTask['status'] =>
  ({ not_started: 'pending', active: 'in_progress', done: 'completed', closed: 'cancelled' } as const)[type];

/** True once a task sits in a column that counts as finished. */
export const isTaskDone = (task: WorkspaceTask): boolean =>
  task.status_obj ? task.status_obj.type === 'done' : task.status === 'completed';

export const isTaskClosed = (task: WorkspaceTask): boolean =>
  task.status_obj
    ? task.status_obj.type === 'done' || task.status_obj.type === 'closed'
    : task.status === 'completed' || task.status === 'cancelled';

export const isTaskOverdue = (task: WorkspaceTask): boolean =>
  !!task.due_date && !isTaskClosed(task) && new Date(task.due_date) < new Date();

/** Query-string builder that expands array filters into `key[]=` pairs. */
const toParams = (filters: TaskFilters & Record<string, unknown>) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      if (!value.length) return;
      value.forEach(v => params.append(`${key}[]`, String(v)));
      return;
    }
    if (typeof value === 'boolean') {
      if (value) params.append(key, '1');
      return;
    }
    params.append(key, String(value));
  });

  return params;
};

/* ------------------------------------------------------------- hierarchy */

export const fetchSpaces = async (archived?: ArchiveMode): Promise<TaskSpace[]> => {
  const res = await api.get('/api/task-spaces', { params: archived ? { archived } : {} });
  return res.data?.data ?? [];
};

export const createSpace = async (payload: Partial<TaskSpace>): Promise<TaskSpace> =>
  (await api.post('/api/task-spaces', payload)).data.data;

export const updateSpace = async (id: number, payload: Partial<TaskSpace>): Promise<TaskSpace> =>
  (await api.put(`/api/task-spaces/${id}`, payload)).data.data;

export const setSpaceArchived = async (id: number, archived: boolean): Promise<TaskSpace> =>
  (await api.patch(`/api/task-spaces/${id}/archive`, { archived })).data.data;

export const deleteSpace = async (id: number): Promise<void> => {
  await api.delete(`/api/task-spaces/${id}`);
};

export const reorderSpaces = async (spaceIds: number[]): Promise<void> => {
  await api.put('/api/task-spaces/reorder', { space_ids: spaceIds });
};

export const fetchList = async (id: number): Promise<TaskListSummary> =>
  (await api.get(`/api/task-lists/${id}`)).data.data;

export const createList = async (payload: Partial<TaskListSummary> & { task_space_id: number }) =>
  (await api.post('/api/task-lists', payload)).data.data as TaskListSummary;

export const updateList = async (id: number, payload: Partial<TaskListSummary>) =>
  (await api.put(`/api/task-lists/${id}`, payload)).data.data as TaskListSummary;

export const setListArchived = async (id: number, archived: boolean) =>
  (await api.patch(`/api/task-lists/${id}/archive`, { archived })).data.data as TaskListSummary;

export const deleteList = async (id: number): Promise<void> => {
  await api.delete(`/api/task-lists/${id}`);
};

/* --------------------------------------------------------------- statuses */

export const createStatus = async (listId: number, payload: Partial<TaskStatus>) =>
  (await api.post(`/api/task-lists/${listId}/statuses`, payload)).data.data as TaskStatus;

export const updateStatus = async (listId: number, statusId: number, payload: Partial<TaskStatus>) =>
  (await api.put(`/api/task-lists/${listId}/statuses/${statusId}`, payload)).data.data as TaskStatus;

/** `reassignTo` receives any tasks left in the deleted column. */
export const deleteStatus = async (listId: number, statusId: number, reassignTo?: number) => {
  await api.delete(`/api/task-lists/${listId}/statuses/${statusId}`, {
    data: reassignTo ? { reassign_to: reassignTo } : {},
  });
};

export const reorderStatuses = async (listId: number, statusIds: number[]): Promise<void> => {
  await api.put(`/api/task-lists/${listId}/statuses/reorder`, { status_ids: statusIds });
};

/* ------------------------------------------------------------------ tasks */

export const fetchTasks = async (
  filters: TaskFilters,
  page = 1,
  perPage = 25,
): Promise<{ tasks: WorkspaceTask[]; meta: TaskPageMeta }> => {
  const params = toParams({ ...filters, page, per_page: perPage });
  const res = await api.get(`/api/tasks/feed?${params.toString()}`);

  return {
    tasks: (res.data?.data ?? []).map(normalise),
    meta: res.data?.meta,
  };
};

export const fetchBoard = async (
  listId: number,
  filters: TaskFilters = {},
): Promise<{ list: TaskListSummary; columns: BoardColumn[] }> => {
  const params = toParams({ ...filters, list_id: listId });
  const res = await api.get(`/api/tasks/board?${params.toString()}`);

  return {
    list: res.data?.data?.list,
    columns: (res.data?.data?.columns ?? []).map((col: any) => ({
      status: col.status,
      tasks: (col.tasks ?? []).map(normalise),
    })),
  };
};

export const fetchTaskCalendar = async (
  start: string,
  end: string,
  filters: TaskFilters = {},
): Promise<WorkspaceTask[]> => {
  const params = toParams({ ...filters, start, end });
  const res = await api.get(`/api/tasks/calendar?${params.toString()}`);
  return (res.data?.data ?? []).map(normalise);
};

export const fetchTask = async (id: number): Promise<WorkspaceTask> =>
  normalise((await api.get(`/api/tasks/${id}`)).data.data);

export const fetchTaskSummary = async (): Promise<TaskSummary> =>
  (await api.get('/api/tasks/summary')).data.data;

export interface TaskWritePayload {
  title?: string;
  description?: string | null;
  task_list_id?: number | null;
  task_status_id?: number | null;
  parent_task_id?: number | null;
  lead_id?: number | null;
  sale_id?: number | null;
  priority?: TaskPriority;
  due_date?: string | null;
  start_date?: string | null;
  reminder?: boolean;
  assignee_ids?: number[];
  watcher_ids?: number[];
  tag_ids?: number[];
}

export const createTask = async (payload: TaskWritePayload): Promise<WorkspaceTask> =>
  normalise((await api.post('/api/tasks', payload)).data.data);

export const updateTask = async (id: number, payload: TaskWritePayload): Promise<WorkspaceTask> =>
  normalise((await api.put(`/api/tasks/${id}`, payload)).data.data);

/**
 * Drag-and-drop. `beforeId`/`afterId` are the tasks either side of the drop
 * point; omit both to append to the end of the target column.
 */
export const moveTask = async (
  id: number,
  target: { task_list_id?: number; task_status_id?: number; before_id?: number; after_id?: number },
): Promise<WorkspaceTask> =>
  normalise((await api.patch(`/api/tasks/${id}/move`, target)).data.data);

export const setTaskArchived = async (id: number, archived: boolean): Promise<WorkspaceTask> =>
  normalise((await api.patch(`/api/tasks/${id}/archive`, { archived })).data.data);

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/api/tasks/${id}`);
};

export type BulkAction =
  | 'archive' | 'unarchive' | 'delete' | 'assign'
  | 'tag' | 'status' | 'priority' | 'move';

export const bulkTaskAction = async (
  taskIds: number[],
  action: BulkAction,
  extra: Record<string, unknown> = {},
): Promise<number> => {
  const res = await api.post('/api/tasks/bulk', { task_ids: taskIds, action, ...extra });
  return res.data?.updated ?? 0;
};

/* ------------------------------------------------- comments and checklist */

export const fetchComments = async (taskId: number): Promise<TaskComment[]> =>
  (await api.get(`/api/tasks/${taskId}/comments`)).data.data ?? [];

export const addComment = async (taskId: number, body: string): Promise<TaskComment> =>
  (await api.post(`/api/tasks/${taskId}/comments`, { body })).data.data;

export const editComment = async (taskId: number, commentId: number, body: string) =>
  (await api.put(`/api/tasks/${taskId}/comments/${commentId}`, { body })).data.data as TaskComment;

export const deleteComment = async (taskId: number, commentId: number): Promise<void> => {
  await api.delete(`/api/tasks/${taskId}/comments/${commentId}`);
};

export const addChecklistItem = async (taskId: number, title: string): Promise<TaskChecklistItem> =>
  (await api.post(`/api/tasks/${taskId}/checklist`, { title })).data.data;

export const updateChecklistItem = async (
  taskId: number,
  itemId: number,
  payload: { title?: string; is_done?: boolean },
): Promise<TaskChecklistItem> =>
  (await api.put(`/api/tasks/${taskId}/checklist/${itemId}`, payload)).data.data;

export const deleteChecklistItem = async (taskId: number, itemId: number): Promise<void> => {
  await api.delete(`/api/tasks/${taskId}/checklist/${itemId}`);
};

export const toggleWatch = async (taskId: number): Promise<boolean> =>
  (await api.post(`/api/tasks/${taskId}/watch`)).data.watching;

/* ---------------------------------------------------------------- helpers */

export const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  urgent: { label: 'Urgent', color: '#ef4444' },
  high:   { label: 'High',   color: '#f59e0b' },
  medium: { label: 'Medium', color: '#3b82f6' },
  low:    { label: 'Low',    color: '#94a3b8' },
};

export const PRIORITY_ORDER: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

export const taskLeadName = (lead?: TaskLeadRef | null): string => {
  if (!lead) return '';
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim();
  return name || `#${lead.id}`;
};

/** Checklist + subtask progress as a single 0-100 number, or null if neither. */
export const taskProgress = (task: WorkspaceTask): number | null => {
  const total = (task.subtasks_count ?? 0) + (task.checklist_items_count ?? 0);
  if (!total) return null;

  const done = (task.completed_subtasks_count ?? 0) + (task.completed_checklist_count ?? 0);
  return Math.round((done / total) * 100);
};
