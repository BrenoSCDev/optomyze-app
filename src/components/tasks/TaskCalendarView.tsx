/**
 * CALENDAR VIEW
 *
 * A month grid of tasks by due date. Deliberately month-only: tasks carry a
 * due *date*, not a time slot, so the hour-by-hour layout the main Calendar
 * uses for appointments would just render a column of items at midnight.
 *
 * Date helpers mirror OptomyzeCalendar's so the two grids stay visually
 * identical, including reading wall-clock time literally.
 */

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { PriorityFlag } from './TaskBits';
import { WorkspaceTask, isTaskDone, isTaskOverdue } from '@/services/taskWorkspaceApi';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
const startOfWeek = (d: Date) => addDays(startOfDay(d), -d.getDay());
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Read the date components literally rather than shifting into the browser zone. */
const parseWallClock = (iso: string): Date => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(iso);
};

const MAX_PER_DAY = 3;

interface Props {
  tasks: WorkspaceTask[];
  loading: boolean;
  cursor: Date;
  onCursorChange: (date: Date) => void;
  onOpenTask: (task: WorkspaceTask) => void;
  onCreateOnDay: (date: Date) => void;
}

const TaskCalendarView: React.FC<Props> = ({
  tasks, loading, cursor, onCursorChange, onOpenTask, onCreateOnDay,
}) => {
  const { t, language } = useLanguage();
  const locale = language || undefined;

  // Padded to whole weeks so the grid is always rectangular.
  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const gridEnd = addDays(startOfWeek(last), 6);
    const count = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86_400_000) + 1;

    return Array.from({ length: count }, (_, i) => addDays(gridStart, i));
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, WorkspaceTask[]>();

    tasks.forEach(task => {
      if (!task.due_date) return;
      const key = startOfDay(parseWallClock(task.due_date)).toDateString();
      const bucket = map.get(key) ?? [];
      bucket.push(task);
      map.set(key, bucket);
    });

    // Urgent-first within a day, so the important thing is never the one hidden
    // behind "+2 more".
    const rank = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
    map.forEach(list => list.sort((a, b) => rank[a.priority] - rank[b.priority]));

    return map;
  }, [tasks]);

  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, i) =>
      addDays(startOfWeek(new Date()), i).toLocaleDateString(locale, { weekday: 'short' })),
    [locale],
  );

  const today = startOfDay(new Date());

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-4 py-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onCursorChange(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onCursorChange(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          <ChevronRight />
        </Button>
        <h2 className="ml-1 text-sm font-semibold text-foreground">
          {cursor.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => onCursorChange(startOfDay(new Date()))}
        >
          {t('calendar.today')}
        </Button>
      </header>

      <div className="grid grid-cols-7 border-b border-border">
        {weekdays.map(day => (
          <div key={day} className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid flex-1 grid-cols-7 gap-px bg-border">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="bg-surface p-2"><Skeleton className="h-4 w-6" /></div>
          ))}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 gap-px overflow-y-auto bg-border">
          {days.map(day => {
            const dayTasks = byDay.get(day.toDateString()) ?? [];
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = isSameDay(day, today);
            const shown = dayTasks.slice(0, MAX_PER_DAY);
            const extra = dayTasks.length - shown.length;

            return (
              <div
                key={day.toISOString()}
                onDoubleClick={() => onCreateOnDay(day)}
                className={cn(
                  'group min-h-[6rem] space-y-1 p-1.5 transition-colors duration-fast',
                  inMonth ? 'bg-surface' : 'bg-surface/50',
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                      isToday
                        ? 'bg-primary font-semibold text-primary-foreground'
                        : inMonth ? 'text-foreground' : 'text-muted-foreground/60',
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {shown.map(task => {
                  const done = isTaskDone(task);

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onOpenTask(task)}
                      className={cn(
                        'flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] transition-colors duration-fast',
                        isTaskOverdue(task)
                          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          : 'bg-muted text-foreground hover:bg-hover',
                      )}
                    >
                      <PriorityFlag priority={task.priority} />
                      <span className={cn('truncate', done && 'text-muted-foreground line-through')}>
                        {task.title}
                      </span>
                    </button>
                  );
                })}

                {extra > 0 && (
                  <span className="block px-1 text-[11px] text-muted-foreground">
                    +{extra} {t('calendar.more')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskCalendarView;
