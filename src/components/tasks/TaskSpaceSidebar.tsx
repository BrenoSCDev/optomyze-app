/**
 * The Space > List tree down the left of the workspace.
 *
 * Spaces collapse independently and remember their state for the session, so a
 * company with a dozen spaces is not forced to scroll past all of them to
 * reach the one list they live in.
 */

import React, { useState } from 'react';
import {
  Archive, ChevronDown, ChevronRight, Inbox, MoreHorizontal, Pencil, Plus, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { TaskListSummary, TaskSpace } from '@/services/taskWorkspaceApi';

interface Props {
  spaces: TaskSpace[];
  loading: boolean;
  activeListId: number | null;
  /** null = the cross-space "Everything" view. */
  onSelectList: (list: TaskListSummary | null) => void;
  onCreateSpace: () => void;
  onCreateList: (space: TaskSpace) => void;
  onEditSpace: (space: TaskSpace) => void;
  onArchiveSpace: (space: TaskSpace) => void;
  onDeleteSpace: (space: TaskSpace) => void;
  onEditList: (list: TaskListSummary) => void;
  onArchiveList: (list: TaskListSummary) => void;
  onDeleteList: (list: TaskListSummary) => void;
}

const TaskSpaceSidebar: React.FC<Props> = ({
  spaces, loading, activeListId, onSelectList,
  onCreateSpace, onCreateList,
  onEditSpace, onArchiveSpace, onDeleteSpace,
  onEditList, onArchiveList, onDeleteList,
}) => {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-sidebar-bg">
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('tasks.spaces')}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onCreateSpace}>
              <Plus />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('tasks.new-space')}</TooltipContent>
        </Tooltip>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {/* Cross-space view — everything the user can see, in one list. */}
        <button
          type="button"
          onClick={() => onSelectList(null)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-fast ease-standard',
            activeListId === null
              ? 'bg-selected font-medium text-foreground'
              : 'text-muted-foreground hover:bg-hover hover:text-foreground',
          )}
        >
          <Inbox className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('tasks.everything')}</span>
        </button>

        {loading ? (
          <div className="space-y-2 px-1 pt-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}
          </div>
        ) : spaces.length === 0 ? (
          <p className="px-2 pt-6 text-center text-xs text-muted-foreground">
            {t('tasks.no-spaces')}
          </p>
        ) : (
          spaces.map(space => {
            const isCollapsed = collapsed.has(space.id);

            return (
              <div key={space.id} className="pt-2">
                <div className="group flex items-center gap-1 rounded-md px-1 py-1 hover:bg-hover">
                  <button
                    type="button"
                    onClick={() => toggle(space.id)}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  >
                    {isCollapsed
                      ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: space.color }}
                    />
                    <span className="truncate text-sm font-medium text-foreground">{space.name}</span>
                  </button>

                  {/* Actions stay hidden until hover so the tree reads calmly. */}
                  <div className="flex items-center opacity-0 transition-opacity duration-fast group-hover:opacity-100 focus-within:opacity-100">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon-sm" onClick={() => onCreateList(space)}>
                          <Plus />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('tasks.new-list')}</TooltipContent>
                    </Tooltip>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm"><MoreHorizontal /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditSpace(space)}>
                          <Pencil className="mr-2 h-4 w-4" />{t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onArchiveSpace(space)}>
                          <Archive className="mr-2 h-4 w-4" />{t('tasks.archive')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDeleteSpace(space)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />{t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="mt-0.5 space-y-0.5 pl-4">
                    {space.lists.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => onCreateList(space)}
                        className="w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-hover hover:text-foreground"
                      >
                        + {t('tasks.new-list')}
                      </button>
                    ) : (
                      space.lists.map(list => (
                        <div
                          key={list.id}
                          className={cn(
                            'group/list flex items-center gap-1 rounded-md pr-1 transition-colors duration-fast ease-standard',
                            activeListId === list.id ? 'bg-selected' : 'hover:bg-hover',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectList(list)}
                            className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left"
                          >
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: list.color }}
                            />
                            <span
                              className={cn(
                                'truncate text-sm',
                                activeListId === list.id
                                  ? 'font-medium text-foreground'
                                  : 'text-muted-foreground',
                              )}
                            >
                              {list.name}
                            </span>
                            {!!list.open_tasks_count && (
                              <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                                {list.open_tasks_count}
                              </span>
                            )}
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="opacity-0 transition-opacity duration-fast group-hover/list:opacity-100 focus:opacity-100"
                              >
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditList(list)}>
                                <Pencil className="mr-2 h-4 w-4" />{t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onArchiveList(list)}>
                                <Archive className="mr-2 h-4 w-4" />{t('tasks.archive')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDeleteList(list)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />{t('common.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>
    </aside>
  );
};

export default TaskSpaceSidebar;
