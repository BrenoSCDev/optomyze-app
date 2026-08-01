/**
 * OPTOMYZE CALENDAR COMPONENT
 *
 * Displays a full calendar view with events and appointments
 * Connected to /api/events for real data with full CRUD support
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getEcho } from '@/services/echo';
import {
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent
} from '@/hooks/useCalendarEvents';
import { CalendarTask, CalendarEvent, CalendarAppointment, CalendarEventsResponse } from '@/services/calendarApi';
import { Appointment, updateAppointment } from '@/services/appointmentApi';
import { EventFormModal, EventFormData } from './EventFormModal';
import { DeleteEventDialog } from './DeleteEventDialog';
import { DayDetailsDialog } from './DayDetailsDialog';
import { CalendarDayCell } from './CalendarDayCell';
import { EventChip } from './EventChip';
import { AgendaEventCard } from './AgendaEventCard';
import { CalendarItem } from './calendarUtils';
import LeadPreviewModal from '@/components/leads/LeadPreviewModal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, startOfWeek, endOfWeek, parseISO, isAfter, addDays } from 'date-fns';
import { enUS, ptBR, de, es, type Locale } from 'date-fns/locale';
import type { Language } from '@/contexts/LanguageContext';

type CalendarViewMode = 'month' | 'week' | 'day';

const VIEW_MODE_LABEL_KEYS: Record<CalendarViewMode, string> = {
  month: 'calendar.view-month',
  week: 'calendar.view-week',
  day: 'calendar.view-day',
};

const DATE_FNS_LOCALES: Record<Language, Locale> = {
  'en': enUS,
  'pt-BR': ptBR,
  'de': de,
  'es': es,
};

const OptomyzeCalendar: React.FC = () => {
  const { t, language } = useLanguage();
  const dateLocale = DATE_FNS_LOCALES[language] ?? enUS;
  const { user } = useAuth() as { user: { id: number; company_id: number } | null };
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Lead preview modal state
  const [previewLeadId, setPreviewLeadId] = useState<string | null>(null);

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<CalendarEvent | null>(null);
  const [selectedEventForDelete, setSelectedEventForDelete] = useState<CalendarItem | null>(null);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<number | null>(null);

  // Expanded day view (triggered by "+N more" in the month/week grid)
  const [dayDetailsDate, setDayDetailsDate] = useState<Date | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useCalendarEvents();
  const createEventMutation = useCreateCalendarEvent();
  const updateEventMutation = useUpdateCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();

  // Live appointment updates via private appointments.{company_id} channel
  useEffect(() => {
    if (!user?.company_id) return;
    const echo = getEcho();
    if (!echo) return;

    const channelName = `appointments.${user.company_id}`;
    const channel = echo.private(channelName);

    channel.listen('.appointment.live', (payload: any) => {
      queryClient.setQueryData<CalendarEventsResponse>(['calendarEvents'], (old) => {
        if (!old) return old;

        if (payload.action === 'created') {
          const exists = old.appointments.some((a) => a.id === payload.appointment.id);
          if (exists) return old;
          return { ...old, appointments: [...old.appointments, payload.appointment as CalendarAppointment] };
        }

        if (payload.action === 'updated') {
          return {
            ...old,
            appointments: old.appointments.map((a) =>
              a.id === payload.appointment.id ? (payload.appointment as CalendarAppointment) : a
            ),
          };
        }

        if (payload.action === 'deleted') {
          return {
            ...old,
            appointments: old.appointments.filter((a) => a.id !== payload.id),
          };
        }

        return old;
      });
    });

    return () => {
      echo.leave(channelName);
    };
  }, [user?.company_id, queryClient]);

  // Helper to parse dates correctly (handles date-only strings without timezone shift)
  const parseDateSafe = (dateString: string): Date => {
    if (!dateString) return new Date();

    // If it's a date-only string (YYYY-MM-DD), parse it as local date at noon to avoid any DST issues
    if (dateString.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0);
    }

    // For datetime strings, check if it has timezone info
    // If it's a datetime without timezone (e.g., "2025-01-14 10:00:00"), parse as local
    if (dateString.includes(' ') && !dateString.includes('T') && !dateString.includes('Z')) {
      const [datePart, timePart] = dateString.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours = 0, minutes = 0, seconds = 0] = (timePart || '').split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    // Otherwise use parseISO for full ISO datetime strings
    return parseISO(dateString);
  };

  // Transform API data to unified calendar items
  const calendarItems = useMemo<CalendarItem[]>(() => {
    if (!data) return [];

    const items: CalendarItem[] = [];

    // Transform tasks
    data.tasks.forEach((task: CalendarTask) => {
      items.push({
        id: `task-${task.id}`,
        originalId: task.id,
        title: task.title,
        description: task.description || '',
        date: parseDateSafe(task.due_date),
        type: 'task',
        subType: task.priority,
        priority: task.priority,
        status: task.status,
        hasReminder: task.reminder === 1,
        attendee: task.assignee?.name,
        leadName: task.lead ? `${task.lead.first_name} ${task.lead.last_name || ''}`.trim() : undefined,
        leadId: task.lead?.id,
        funnelId: task.lead?.funnel_id,
      });
    });

    // Transform events
    data.events.forEach((event: CalendarEvent) => {
      items.push({
        id: `event-${event.id}`,
        originalId: event.id,
        title: event.title,
        description: event.description || '',
        date: parseISO(event.start_at),
        endDate: event.end_at ? parseISO(event.end_at) : undefined,
        type: 'event',
        subType: event.type,
        allDay: event.all_day,
        hasReminder: event.reminder === 1,
        originalEvent: event,
      });
    });

    // Transform appointments
    data.appointments?.forEach((appt: CalendarAppointment) => {
      items.push({
        id: `appointment-${appt.id}`,
        originalId: appt.id,
        title: appt.title,
        description: appt.notes || '',
        date: parseDateSafe(appt.scheduled_at),
        endDate: appt.end_at ? parseDateSafe(appt.end_at) : undefined,
        type: 'appointment',
        subType: appt.status,
        status: appt.status,
        hasReminder: false,
        attendee: appt.user?.name,
        leadName: appt.lead ? `${appt.lead.first_name} ${appt.lead.last_name || ''}`.trim() : undefined,
        leadId: appt.lead?.id,
        funnelId: appt.lead?.funnel_id,
        appointmentTypeColor: appt.appointment_type?.color,
        timezone: appt.timezone,
      });
    });

    return items;
  }, [data]);

  // Event handlers for CRUD
  const handleCreateEvent = () => {
    setSelectedEventForEdit(null);
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (item: CalendarItem) => {
    if (item.type === 'event' && item.originalEvent) {
      setSelectedEventForEdit(item.originalEvent);
      setIsEventModalOpen(true);
    }
  };

  const handleDeleteEvent = (item: CalendarItem) => {
    setSelectedEventForDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleAppointmentStatusChange = async (item: CalendarItem, status: Appointment['status']) => {
    setUpdatingAppointmentId(item.originalId);
    try {
      await updateAppointment(item.originalId, { status });
      // No manual cache update needed — AppointmentController::update()
      // broadcasts AppointmentLiveUpdate, already handled by the listener above.
    } catch {
      // Toast pattern matches the rest of this component's quiet failure handling.
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const handleEventFormSubmit = async (formData: EventFormData) => {
    const payload = {
      title: formData.title,
      description: formData.description || '',
      type: formData.type,
      start_at: formData.start_at,
      end_at: formData.end_at || undefined,
      all_day: formData.all_day,
      reminder: formData.reminder,
    };

    if (selectedEventForEdit) {
      await updateEventMutation.mutateAsync({
        eventId: selectedEventForEdit.id,
        payload,
      });
    } else {
      await createEventMutation.mutateAsync(payload);
    }
    setIsEventModalOpen(false);
    setSelectedEventForEdit(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedEventForDelete && selectedEventForDelete.type === 'event') {
      await deleteEventMutation.mutateAsync(selectedEventForDelete.originalId);
      setIsDeleteDialogOpen(false);
      setSelectedEventForDelete(null);
    }
  };

  // Compute days to render based on view mode
  const calendarDays = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate];
    }
    if (viewMode === 'week') {
      const wStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const wEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: wStart, end: wEnd });
    }
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate, viewMode]);

  const goToPrevious = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, -1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };
  const goToNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const headerLabel = useMemo(() => {
    if (viewMode === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy', { locale: dateLocale });
    if (viewMode === 'week') {
      const wStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const wEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(wStart, 'MMM d', { locale: dateLocale })} - ${format(wEnd, 'MMM d, yyyy', { locale: dateLocale })}`;
    }
    return format(currentDate, 'MMMM yyyy', { locale: dateLocale });
  }, [currentDate, viewMode, dateLocale]);

  const getItemsForDate = (date: Date): CalendarItem[] => {
    return calendarItems.filter(item => isSameDay(item.date, date));
  };

  // Get upcoming items (next 7 days)
  const upcomingItems = useMemo(() => {
    const now = new Date();

    return calendarItems
      .filter(item => {
        const itemDate = item.date;
        return (isAfter(itemDate, now) || isSameDay(itemDate, now));
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 4);
  }, [calendarItems]);

  const selectedDateItems = selectedDate ? getItemsForDate(selectedDate) : [];
  const dayDetailsItems = dayDetailsDate ? getItemsForDate(dayDetailsDate) : [];

  const weekDays = useMemo(() => {
    const refSunday = startOfWeek(new Date(), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: refSunday, end: addDays(refSunday, 6) })
      .map((d) => format(d, 'EEE', { locale: dateLocale }));
  }, [dateLocale]);

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load calendar events</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <Calendar className="h-7 w-7 sm:h-8 sm:w-8 text-primary shrink-0" />
            {t('calendar.optomyze.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t('calendar.optomyze.description')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="bg-primary hover:bg-primary/80" onClick={handleCreateEvent}>
            <Plus className="h-4 w-4" />
            {t('calendar.new-event')}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <motion.div
          className="lg:col-span-2 glass-card p-3 sm:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {headerLabel}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {/* View mode switcher */}
              <div className="inline-flex rounded-md border border-border bg-muted/30 p-0.5">
                {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      viewMode === mode
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t(VIEW_MODE_LABEL_KEYS[mode])}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={goToToday}>
                {t('calendar.today')}
              </Button>
              <Button variant="ghost" size="icon" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Week Days Header (only for month/week) */}
          {viewMode !== 'day' && (
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
          )}

          {/* Calendar Days */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === 'day' ? (
            // Day view: single full-width column
            <div>
              {(() => {
                const day = calendarDays[0];
                const dayItems = getItemsForDate(day);
                const isToday = isSameDay(day, new Date());
                return (
                  <div className={`rounded-lg border ${isToday ? 'border-primary/50' : 'border-border'} bg-muted/30 p-4 min-h-[400px]`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-lg font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                        {format(day, 'EEEE, MMMM d', { locale: dateLocale })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dayItems.length} {dayItems.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    {dayItems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        {t('calendar.no-events')}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dayItems.map(item => (
                          <EventChip key={item.id} item={item} variant="day" onSelect={() => setSelectedDate(day)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayItems = getItemsForDate(day);
                const isCurrentMonth = viewMode === 'week' ? true : isSameMonth(day, currentDate);
                const isSelected = !!(selectedDate && isSameDay(day, selectedDate));
                const isToday = isSameDay(day, new Date());
                const itemLimit = viewMode === 'week' ? 6 : 3;

                return (
                  <CalendarDayCell
                    key={index}
                    day={day}
                    items={dayItems}
                    isCurrentMonth={isCurrentMonth}
                    isSelected={isSelected}
                    isToday={isToday}
                    variant={viewMode === 'week' ? 'week' : 'month'}
                    itemLimit={itemLimit}
                    onSelectDate={setSelectedDate}
                    onShowMore={setDayDetailsDate}
                  />
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Selected Day Events */}
        <motion.div
          className="glass-card p-6 lg:self-start flex flex-col max-h-[calc(100vh-220px)]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 shrink-0">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d', { locale: dateLocale }) : t('calendar.select-date')}
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedDateItems.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">{t('calendar.no-events')}</p>
              <p className="text-muted-foreground/70 text-xs mt-1">{t('calendar.no-events-description')}</p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-1 -mr-1">
              {selectedDateItems.map(item => (
                <AgendaEventCard
                  key={item.id}
                  item={item}
                  variant="full"
                  isUpdating={updatingAppointmentId === item.originalId}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                  onStatusChange={handleAppointmentStatusChange}
                  onPreviewLead={(leadId) => setPreviewLeadId(leadId)}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Upcoming Events Summary */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">{t('calendar.upcoming-events')}</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : upcomingItems.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No upcoming events or tasks</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingItems.map(item => (
              <AgendaEventCard
                key={item.id}
                item={item}
                variant="compact"
                dateLocale={dateLocale}
                onClick={(it) => {
                  setCurrentDate(it.date);
                  setSelectedDate(it.date);
                }}
                onPreviewLead={(leadId) => setPreviewLeadId(leadId)}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Event Form Modal */}
      <EventFormModal
        open={isEventModalOpen}
        onOpenChange={setIsEventModalOpen}
        onSubmit={handleEventFormSubmit}
        event={selectedEventForEdit}
        isLoading={createEventMutation.isPending || updateEventMutation.isPending}
        defaultDate={selectedDate || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteEventDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        eventTitle={selectedEventForDelete?.title || ''}
        isLoading={deleteEventMutation.isPending}
      />

      {/* Expanded Day View (triggered by "+N more") */}
      <DayDetailsDialog
        open={dayDetailsDate !== null}
        onOpenChange={(open) => { if (!open) setDayDetailsDate(null); }}
        date={dayDetailsDate}
        items={dayDetailsItems}
        dateLocale={dateLocale}
        updatingItemId={updatingAppointmentId}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onStatusChange={handleAppointmentStatusChange}
        onPreviewLead={(leadId) => setPreviewLeadId(leadId)}
      />

      {/* Lead Preview Modal */}
      <LeadPreviewModal
        isOpen={previewLeadId !== null}
        onClose={() => setPreviewLeadId(null)}
        leadId={previewLeadId}
      />
    </div>
  );
};

export default OptomyzeCalendar;
