/**
 * CALENDAR
 *
 * The CRM's scheduling workspace. Appointments are the only entity shown —
 * the parallel "Events" concept has been removed.
 *
 * Layout is deliberately bare: no page header and no day sidebar, so the grid
 * itself owns the full content area. All management happens in
 * AppointmentModal, so the user never navigates away to edit a booking.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckSquare, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Appointment, getCompanyAppointments } from '@/services/appointmentApi';
import { AppointmentType, getAppointmentTypes } from '@/services/appointmentTypeApi';
import AppointmentModal from './AppointmentModal';
import AppointmentDetailModal from './AppointmentDetailModal';
import LeadPreviewModal from '@/components/leads/LeadPreviewModal';
import CalendarSwitcher from './CalendarSwitcher';
import { useCalendars } from '@/contexts/CalendarsContext';
import { getEcho } from '@/services/echo';
import { useAuth } from '@/contexts/AuthContext';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import {
  WorkspaceTask, fetchTaskCalendar, isTaskDone, isTaskOverdue,
} from '@/services/taskWorkspaceApi';

type View = 'month' | 'week' | 'day';

const HOUR_HEIGHT = 48; // px per hour in week/day views
const DAY_START = 0;
const DAY_END = 24;

/* ---------- date helpers (local, no external dependency) ---------- */

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
const addMonths = (d: Date, n: number) => { const c = new Date(d); c.setMonth(c.getMonth() + n); return c; };
const startOfWeek = (d: Date) => addDays(startOfDay(d), -d.getDay());
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * The API sends wall-clock time in the appointment's own timezone, so the
 * components are read literally rather than letting Date shift them into the
 * browser's zone — same reasoning as extractTime() in lib/utils.
 */
const parseWallClock = (iso: string): Date => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : new Date(iso);
};

const minutesInto = (d: Date) => d.getHours() * 60 + d.getMinutes();

const toInputValue = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` +
  `T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const OptomyzeCalendar: React.FC = () => {
  const { t, language } = useLanguage();
  const locale = language || undefined;

  // Which calendar is being viewed. Everything on the grid — appointments and
  // tasks alike — is scoped to it.
  const { selected: activeCalendar, selectedIds } = useCalendars();
  const { user } = useAuth();

  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState<Date>(() => startOfDay(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [slotStart, setSlotStart] = useState<string | null>(null);

  // Clicking an appointment opens the read-only view; editing is a deliberate
  // step from there, so a glance can never change a confirmed booking.
  const [detail, setDetail] = useState<Appointment | null>(null);
  // The contact behind a booking, opened from the detail view. Held here so the
  // two modals are siblings — nesting the lead view inside the appointment
  // dialog puts two focus traps on screen at once.
  const [leadPreviewId, setLeadPreviewId] = useState<string | null>(null);

  // Tasks share the grid with appointments. On by default because "what is on
  // today" is the question this page exists to answer, but dismissable for
  // anyone who wants the booking schedule alone.
  const [showTasks, setShowTasks] = useState(true);
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);
  /** Bumped after an edit in the task modal to force the range refetch. */
  const [taskReloadKey, setTaskReloadKey] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [list, typeList] = await Promise.all([
        getCompanyAppointments(selectedIds),
        getAppointmentTypes().catch(() => [] as AppointmentType[]),
      ]);
      setAppointments(list);
      setTypes(typeList);
    } catch {
      toast.error(t('calendar.load-failed'));
    } finally {
      setLoading(false);
    }
    // Refetches when the active calendar changes, which is what makes the
    // switch feel like a filter rather than a page load.
  }, [t, selectedIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  /* ---------- visible range ---------- */

  const days = useMemo(() => {
    if (view === 'day') return [cursor];
    if (view === 'week') return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i));
    // Month is padded to whole weeks so the grid is always rectangular.
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [view, cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const d = parseWallClock(a.scheduled_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key);
      if (list) list.push(a); else map.set(key, [a]);
    }
    for (const list of map.values()) {
      list.sort((x, y) => parseWallClock(x.scheduled_at).getTime() - parseWallClock(y.scheduled_at).getTime());
    }
    return map;
  }, [appointments]);

  const dayAppointments = useCallback(
    (d: Date) => byDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [],
    [byDay]
  );

  /* ---------- tasks overlaid on the same grid ---------- */

  // Keyed to the visible range rather than fetching everything, and padded a
  // week either side so the days bleeding in from adjacent months are filled.
  useEffect(() => {
    if (!showTasks) { setTasks([]); return; }

    const first = days[0];
    const last = days[days.length - 1];
    if (!first || !last) return;

    let cancelled = false;
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    fetchTaskCalendar(iso(addDays(first, -1)), iso(addDays(last, 1)), {}, activeCalendar?.id ?? null)
      .then(list => { if (!cancelled) setTasks(list); })
      .catch(() => { if (!cancelled) setTasks([]); });

    return () => { cancelled = true; };
  }, [showTasks, days, taskReloadKey, activeCalendar?.id]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, WorkspaceTask[]>();

    for (const task of tasks) {
      if (!task.due_date) continue;
      const d = parseWallClock(task.due_date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key);
      if (list) list.push(task); else map.set(key, [task]);
    }

    // Urgent first, so what surfaces above the "+n more" cut is the work that
    // actually matters.
    const rank = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
    for (const list of map.values()) list.sort((a, b) => rank[a.priority] - rank[b.priority]);

    return map;
  }, [tasks]);

  const dayTasks = useCallback(
    (d: Date) => tasksByDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [],
    [tasksByDay]
  );

  /* ---------- navigation ---------- */

  const step = (dir: -1 | 1) => {
    setCursor(prev =>
      view === 'month' ? addMonths(prev, dir)
        : view === 'week' ? addDays(prev, 7 * dir)
          : addDays(prev, dir)
    );
  };

  const rangeLabel = useMemo(() => {
    if (view === 'day') {
      return cursor.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (view === 'week') {
      const s = startOfWeek(cursor);
      const e = addDays(s, 6);
      const sameMonth = s.getMonth() === e.getMonth();
      return `${s.toLocaleDateString(locale, { day: 'numeric', month: sameMonth ? undefined : 'short' })} – ${e.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return cursor.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }, [view, cursor, locale]);

  /* ---------- modal plumbing ---------- */

  const openNew = (start?: Date) => {
    setEditing(null);
    setSlotStart(start ? toInputValue(start) : null);
    setModalOpen(true);
  };

  const openExisting = (a: Appointment) => {
    setDetail(a);
  };

  /** From the detail view into the edit form, without losing the record. */
  const openEditor = (a: Appointment) => {
    setDetail(null);
    setEditing(a);
    setSlotStart(null);
    setModalOpen(true);
  };

  const handleSaved = (saved: Appointment) => {
    setDetail(prev => (prev && prev.id === saved.id ? saved : prev));
    setAppointments(prev =>
      prev.some(a => a.id === saved.id)
        ? prev.map(a => (a.id === saved.id ? saved : a))
        : [...prev, saved]
    );
  };

  const handleDeleted = (id: number) => setAppointments(prev => prev.filter(a => a.id !== id));

  /**
   * LIVE FEED
   *
   * Appointments arrive from more places than this screen: the lead panel, the
   * public booking page, the API, automations. Without this the grid was a
   * snapshot from page load, and a booking taken while someone watched the
   * calendar simply did not appear until they refreshed.
   *
   * Subscribed per company and filtered to the calendar on screen, so a
   * booking on another calendar does not silently appear on this one. The
   * effect deliberately depends only on the company and the active calendar —
   * not on the appointment list — so a re-render never churns the subscription.
   */
  useEffect(() => {
    const companyId = (user as { company_id?: number } | null)?.company_id;
    if (!companyId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`appointments.${companyId}`);

    const belongsHere = (calendarId?: number | null) => {
      // No calendar selected yet means the board is showing everything.
      if (!activeCalendar) return true;
      // An appointment from a path that predates calendars has no id; showing
      // it is better than dropping it, and the server files it on the default.
      if (calendarId == null) return true;

      return Number(calendarId) === Number(activeCalendar.id);
    };

    channel.listen('.appointment.live', (event: any) => {
      if (event?.action === 'deleted') {
        handleDeleted(Number(event.id));
        return;
      }

      const incoming = event?.appointment as Appointment | undefined;
      if (!incoming) return;

      if (!belongsHere(incoming.calendar_id)) {
        // It may have just been *moved* off this calendar, so drop any copy
        // we are still holding.
        handleDeleted(Number(incoming.id));
        return;
      }

      handleSaved(incoming);
    });

    return () => {
      // Only stop listening — the channel itself is left joined, matching how
      // the inbox handles its shared channel. Leaving would break any future
      // subscriber that joined the same one.
      channel.stopListening('.appointment.live');
    };
    // handleSaved/handleDeleted are plain setState updaters and stable enough;
    // adding them here would resubscribe on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeCalendar?.id]);

  /* ---------- rendering ---------- */

  const weekdayNames = useMemo(() => {
    const base = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, i) => addDays(base, i).toLocaleDateString(locale, { weekday: 'short' }));
  }, [locale]);

  const statusTone = (a: Appointment) => {
    switch (a.status) {
      case 'completed': return 'border-l-success bg-success-soft/60 text-foreground';
      case 'cancelled':
      case 'no_show': return 'border-l-destructive bg-destructive-soft/50 text-muted-foreground line-through';
      case 'draft': return 'border-l-border-strong bg-surface-2 text-muted-foreground';
      default: return 'border-l-primary bg-surface-2 text-foreground';
    }
  };

  const timeLabel = (a: Appointment) =>
    parseWallClock(a.scheduled_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  const today = startOfDay(new Date());

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar — the only chrome; there is deliberately no page header. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        {/* First in the toolbar: which calendar you are on frames everything
            else the grid shows. */}
        <CalendarSwitcher />

        <Button variant="outline" size="sm" onClick={() => setCursor(startOfDay(new Date()))}>
          {t('calendar.today')}
        </Button>
        <div className="flex items-center">
          <Button variant="ghost" size="icon-sm" aria-label={t('calendar.previous')} onClick={() => step(-1)}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={t('calendar.next')} onClick={() => step(1)}>
            <ChevronRight />
          </Button>
        </div>

        <h2 className="min-w-0 truncate text-sm font-semibold capitalize text-foreground sm:text-base">
          {rangeLabel}
        </h2>

        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={showTasks ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowTasks(v => !v)}
            aria-pressed={showTasks}
          >
            <CheckSquare />
            <span className="hidden sm:inline">{t('calendar.show-tasks')}</span>
          </Button>

          <div className="flex overflow-hidden rounded-md border border-input-border">
            {(['day', 'week', 'month'] as View[]).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors duration-fast ease-standard',
                  view === v
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                )}
              >
                {t(`calendar.view.${v}`)}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => openNew()}>
            <Plus />
            <span className="hidden sm:inline">{t('calendar.new-appointment')}</span>
          </Button>
        </div>
      </div>

      {view === 'month' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="grid grid-cols-7 border-b border-border bg-table-header">
            {weekdayNames.map(name => (
              <div key={name} className="px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-table-header-foreground">
                {name}
              </div>
            ))}
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 overflow-auto">
            {days.map((d, i) => {
              const inMonth = d.getMonth() === cursor.getMonth();
              const list = dayAppointments(d);
              const openSlot = () => openNew(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0));
              return (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={openSlot}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSlot(); }
                  }}
                  className={cn(
                    'flex min-h-[92px] cursor-pointer flex-col gap-0.5 border-b border-r border-border p-1 transition-colors duration-fast ease-standard hover:bg-surface-2',
                    !inMonth && 'bg-surface-1/40'
                  )}
                >
                  <span className={cn(
                    'mb-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center self-start rounded-full text-[11px] tabular-nums',
                    isSameDay(d, today)
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : inMonth ? 'text-muted-foreground' : 'text-muted-foreground/50'
                  )}>
                    {d.getDate()}
                  </span>
                  {list.slice(0, 3).map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openExisting(a); }}
                      title={a.title}
                      className={cn(
                        'w-full truncate rounded-sm border-l-2 px-1.5 py-0.5 text-left text-[11px] leading-tight transition-colors duration-fast ease-standard hover:bg-surface-3',
                        statusTone(a)
                      )}
                    >
                      <span className="mr-1 tabular-nums opacity-70">{timeLabel(a)}</span>
                      {a.title}
                    </button>
                  ))}
                  {/* Tasks share the cell, visually distinct from bookings:
                      a dashed left edge rather than a solid status bar. */}
                  {dayTasks(d).slice(0, Math.max(0, 3 - Math.min(list.length, 3))).map(task => (
                    <button
                      key={`task-${task.id}`}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setOpenTaskId(task.id); }}
                      title={task.title}
                      className={cn(
                        'flex w-full items-center gap-1 truncate rounded-sm border-l-2 border-dashed px-1.5 py-0.5 text-left text-[11px] leading-tight transition-colors duration-fast ease-standard hover:bg-surface-3',
                        isTaskOverdue(task)
                          ? 'border-l-destructive bg-destructive-soft/40 text-destructive'
                          : 'border-l-info bg-surface-2 text-foreground',
                        isTaskDone(task) && 'text-muted-foreground line-through'
                      )}
                    >
                      <CheckSquare className="h-3 w-3 shrink-0 opacity-70" />
                      <span className="truncate">{task.title}</span>
                    </button>
                  ))}

                  {(() => {
                    const hidden = Math.max(0, list.length + dayTasks(d).length - 3);
                    return hidden > 0 ? (
                      <span className="px-1 text-[10px] text-muted-foreground">
                        +{hidden} {t('calendar.more')}
                      </span>
                    ) : null;
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex border-b border-border bg-table-header">
            <div className="w-14 shrink-0 border-r border-border" />
            {days.map((d, i) => (
              <div key={i} className="flex-1 px-2 py-1.5 text-center">
                <div className="text-[11px] uppercase tracking-wide text-table-header-foreground">
                  {d.toLocaleDateString(locale, { weekday: 'short' })}
                </div>
                <div className={cn(
                  'mx-auto mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums',
                  isSameDay(d, today) ? 'bg-primary font-semibold text-primary-foreground' : 'text-foreground'
                )}>
                  {d.getDate()}
                </div>

                {/* Tasks sit above the hour grid rather than inside it: a due
                    date is a deadline for the day, not a booking at 00:00. */}
                {dayTasks(d).length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {dayTasks(d).slice(0, 2).map(task => (
                      <button
                        key={`task-${task.id}`}
                        type="button"
                        onClick={() => setOpenTaskId(task.id)}
                        title={task.title}
                        className={cn(
                          'flex w-full items-center gap-1 truncate rounded-sm border-l-2 border-dashed px-1 py-0.5 text-left text-[10px] leading-tight transition-colors duration-fast ease-standard hover:bg-surface-3',
                          isTaskOverdue(task)
                            ? 'border-l-destructive bg-destructive-soft/40 text-destructive'
                            : 'border-l-info bg-surface-2 text-foreground',
                          isTaskDone(task) && 'text-muted-foreground line-through'
                        )}
                      >
                        <CheckSquare className="h-2.5 w-2.5 shrink-0 opacity-70" />
                        <span className="truncate">{task.title}</span>
                      </button>
                    ))}
                    {dayTasks(d).length > 2 && (
                      <span className="block text-[10px] text-muted-foreground">
                        +{dayTasks(d).length - 2} {t('calendar.more')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 overflow-auto">
            <div className="w-14 shrink-0 border-r border-border">
              {Array.from({ length: DAY_END - DAY_START }, (_, h) => (
                <div key={h} style={{ height: HOUR_HEIGHT }} className="relative">
                  <span className="absolute -top-2 right-1 text-[10px] tabular-nums text-muted-foreground">
                    {String(DAY_START + h).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {days.map((d, di) => (
              <div key={di} className="relative flex-1 border-r border-border">
                {Array.from({ length: DAY_END - DAY_START }, (_, h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => openNew(new Date(d.getFullYear(), d.getMonth(), d.getDate(), DAY_START + h, 0))}
                    style={{ height: HOUR_HEIGHT }}
                    className="block w-full border-b border-border/60 transition-colors duration-fast ease-standard hover:bg-surface-2"
                    aria-label={`${d.toLocaleDateString(locale)} ${DAY_START + h}:00`}
                  />
                ))}

                {dayAppointments(d).map(a => {
                  const s = parseWallClock(a.scheduled_at);
                  const e = a.end_at ? parseWallClock(a.end_at) : new Date(s.getTime() + 60 * 60 * 1000);
                  const top = (minutesInto(s) / 60) * HOUR_HEIGHT;
                  const height = Math.max(18, ((minutesInto(e) - minutesInto(s)) / 60) * HOUR_HEIGHT);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={(ev) => { ev.stopPropagation(); openExisting(a); }}
                      style={{ top, height }}
                      title={a.title}
                      className={cn(
                        'absolute inset-x-1 overflow-hidden rounded-sm border-l-2 px-1.5 py-0.5 text-left text-[11px] leading-tight shadow-elevation-sm transition-colors duration-fast ease-standard hover:bg-surface-3',
                        statusTone(a)
                      )}
                    >
                      <div className="truncate font-medium">{a.title}</div>
                      <div className="truncate tabular-nums opacity-70">{timeLabel(a)}</div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <AppointmentDetailModal
        open={!!detail}
        appointment={detail}
        onClose={() => setDetail(null)}
        onSaved={handleSaved}
        onDeleted={id => { handleDeleted(id); setDetail(null); }}
        onEdit={openEditor}
        onOpenLead={leadId => {
          // The appointment closes on the way through: coming back to it after
          // reading the contact is one click on the booking again, and leaving
          // it open behind a full lead view only competes for attention.
          setDetail(null);
          setLeadPreviewId(String(leadId));
        }}
      />

      <LeadPreviewModal
        isOpen={!!leadPreviewId}
        onClose={() => setLeadPreviewId(null)}
        leadId={leadPreviewId}
      />

      <AppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        appointment={editing}
        initialStart={slotStart}
        appointmentTypes={types}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />

      {/* Opening a task from the calendar gives the full task view rather than
          navigating away to the Tasks module. */}
      <TaskDetailModal
        open={openTaskId !== null}
        taskId={openTaskId}
        onClose={() => setOpenTaskId(null)}
        onSaved={() => setTaskReloadKey(k => k + 1)}
        onDeleted={id => setTasks(prev => prev.filter(task => task.id !== id))}
      />
    </div>
  );
};

export default OptomyzeCalendar;
