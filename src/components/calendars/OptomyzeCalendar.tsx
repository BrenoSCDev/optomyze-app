/**
 * OPTOMYZE CALENDAR COMPONENT
 * 
 * Displays a full calendar view with events and appointments
 * Connected to /api/events for real data with full CRUD support
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, User, MapPin, CheckSquare, CalendarDays, AlertCircle, Loader2, Edit2, Trash2, FileText, ExternalLink, RefreshCw, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent
} from '@/hooks/useCalendarEvents';
import { CalendarTask, CalendarEvent, CalendarAppointment } from '@/services/calendarApi';
import { EventFormModal, EventFormData } from './EventFormModal';
import { DeleteEventDialog } from './DeleteEventDialog';
import LeadPreviewModal from '@/components/leads/LeadPreviewModal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, startOfWeek, endOfWeek, parseISO, isAfter, addDays } from 'date-fns';

type CalendarViewMode = 'month' | 'week' | 'day';

// Color mapping for event types
const eventTypeColors: Record<string, string> = {
  call: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40',
  meeting: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/40',
  internal: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40',
  deadline: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40',
  reminder: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/40',
  other: 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/40',
};

// Color mapping for task priorities
const taskPriorityColors: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40',
  high: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/40',
  medium: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/40',
  low: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40',
};

// Color mapping for task statuses
const taskStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/40',
  in_progress: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40',
  completed: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40',
  cancelled: 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/40',
};

// Color mapping for appointment statuses
const appointmentStatusColors: Record<string, string> = {
  scheduled: 'bg-teal-500/20 text-teal-700 dark:text-teal-400 border-teal-500/40',
  completed: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40',
  cancelled: 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/40',
  no_show: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40',
};

// Unified calendar item type
interface CalendarItem {
  id: string;
  originalId: number;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  type: 'task' | 'event' | 'appointment';
  subType: string;
  allDay?: boolean;
  priority?: string;
  status?: string;
  attendee?: string;
  location?: string;
  hasReminder: boolean;
  leadName?: string;
  leadId?: number;
  funnelId?: number;
  originalEvent?: CalendarEvent;
  // Appointments
  appointmentTypeColor?: string;
  timezone?: string;
}

const OptomyzeCalendar: React.FC = () => {
  const { t } = useLanguage();
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

  const { data, isLoading, error, refetch, isFetching } = useCalendarEvents();
  const createEventMutation = useCreateCalendarEvent();
  const updateEventMutation = useUpdateCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();

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
        leadName: task.lead ? `${task.lead.first_name} ${task.lead.last_name}` : undefined,
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
        hasReminder: false,
        leadName: appt.lead ? `${appt.lead.first_name} ${appt.lead.last_name}` : undefined,
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
    if (viewMode === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy');
    if (viewMode === 'week') {
      const wStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const wEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(wStart, 'MMM d')} - ${format(wEnd, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  }, [currentDate, viewMode]);

  const getItemsForDate = (date: Date): CalendarItem[] => {
    return calendarItems.filter(item => isSameDay(item.date, date));
  };

  // Get upcoming items (next 7 days)
  const upcomingItems = useMemo(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);
    
    return calendarItems
      .filter(item => {
        const itemDate = item.date;
        return (isAfter(itemDate, now) || isSameDay(itemDate, now));
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 4);
  }, [calendarItems]);

  const selectedDateItems = selectedDate ? getItemsForDate(selectedDate) : [];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get color for item based on type
  const getItemColor = (item: CalendarItem) => {
    if (item.type === 'task') {
      return taskPriorityColors[item.priority || 'medium'] || taskPriorityColors.medium;
    }
    if (item.type === 'appointment') {
      return appointmentStatusColors[item.subType] || appointmentStatusColors.scheduled;
    }
    return eventTypeColors[item.subType] || eventTypeColors.other;
  };

  // Format time display
  const formatTime = (date: Date, allDay?: boolean) => {
    if (allDay) return 'All day';
    return format(date, 'HH:mm');
  };

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
            <Plus className="h-4 w-4 mr-2" />
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
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors capitalize ${
                      viewMode === mode
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {mode}
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
                        {format(day, 'EEEE, MMMM d')}
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
                          <button
                            key={item.id}
                            onClick={() => setSelectedDate(day)}
                            className={`w-full text-left text-sm px-3 py-2 rounded flex items-center gap-2 ${
                              item.type === 'appointment' && item.appointmentTypeColor
                                ? 'bg-muted text-foreground border border-border'
                                : getItemColor(item)
                            }`}
                            style={item.type === 'appointment' && item.appointmentTypeColor
                              ? { borderLeftColor: item.appointmentTypeColor, borderLeftWidth: 3 }
                              : undefined}
                          >
                            {item.type === 'task' ? (
                              <CheckSquare className="h-4 w-4 flex-shrink-0" />
                            ) : item.type === 'appointment' ? (
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0 inline-block"
                                style={{ backgroundColor: item.appointmentTypeColor || '#14b8a6' }}
                              />
                            ) : (
                              <CalendarDays className="h-4 w-4 flex-shrink-0" />
                            )}
                            <span className="font-medium truncate">{item.title}</span>
                            <span className="ml-auto text-xs opacity-80">{formatTime(item.date, item.allDay)}</span>
                          </button>
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
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const cellMinH = viewMode === 'week' ? 'min-h-[160px] sm:min-h-[220px]' : 'min-h-[60px] sm:min-h-[80px]';
                const itemLimit = viewMode === 'week' ? 6 : 2;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      ${cellMinH} p-1.5 sm:p-2 rounded-lg text-left transition-all
                      ${isCurrentMonth ? 'bg-muted/40 hover:bg-muted/70' : 'bg-transparent opacity-40'}
                      ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''}
                      ${isToday ? 'border border-primary/50' : ''}
                    `}
                  >
                    <span className={`
                      text-sm font-medium
                      ${isToday ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-0.5 sm:space-y-1">
                      {dayItems.slice(0, itemLimit).map(item => (
                        <div
                          key={item.id}
                          className={`text-[10px] sm:text-xs px-1 py-0.5 rounded truncate flex items-center gap-0.5 sm:gap-1 ${
                            item.type === 'appointment' && item.appointmentTypeColor
                              ? 'bg-muted text-foreground border border-border'
                              : getItemColor(item)
                          }`}
                          style={item.type === 'appointment' && item.appointmentTypeColor
                            ? { borderLeftColor: item.appointmentTypeColor, borderLeftWidth: 3 }
                            : undefined}
                        >
                          {item.type === 'task' ? (
                            <CheckSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                          ) : item.type === 'appointment' ? (
                            <span
                              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 inline-block"
                              style={{ backgroundColor: item.appointmentTypeColor || '#14b8a6' }}
                            />
                          ) : (
                            <CalendarDays className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                          )}
                          <span className="truncate hidden sm:inline">{item.title}</span>
                          <span className="truncate sm:hidden">{item.title.charAt(0)}</span>
                        </div>
                      ))}
                      {dayItems.length > itemLimit && (
                        <div className="text-xs text-muted-foreground">
                          +{dayItems.length - itemLimit} {t('calendar.more')}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        </motion.div>

        {/* Selected Day Events */}
        <motion.div 
          className="glass-card p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : t('calendar.select-date')}
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
            <div className="space-y-4">
              {selectedDateItems.map(item => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border hover:scale-[1.02] transition-transform ${
                    item.type === 'appointment' && item.appointmentTypeColor
                      ? 'bg-muted/40 border-border'
                      : getItemColor(item)
                  }`}
                  style={item.type === 'appointment' && item.appointmentTypeColor
                    ? { borderLeftColor: item.appointmentTypeColor, borderLeftWidth: 4 }
                    : undefined}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {item.type === 'task' ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : item.type === 'appointment' ? (
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0 inline-block"
                          style={{ backgroundColor: item.appointmentTypeColor || '#14b8a6' }}
                        />
                      ) : (
                        <CalendarDays className="h-4 w-4" />
                      )}
                      <h4 className="font-medium text-foreground">{item.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={item.type === 'appointment'
                          ? 'text-xs capitalize border-border text-muted-foreground'
                          : getItemColor(item)}
                        style={item.type === 'appointment' && item.appointmentTypeColor
                          ? { borderColor: item.appointmentTypeColor + '66', color: item.appointmentTypeColor }
                          : undefined}
                      >
                        {item.type === 'task' ? 'Task' : item.subType.replace('_', ' ')}
                      </Badge>
                      {item.type === 'event' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(item);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(item);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <div className="mt-2 flex items-start gap-2 text-sm text-foreground/80">
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <p className="line-clamp-2">{item.description}</p>
                    </div>
                  )}

                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTime(item.date, item.allDay)}
                        {item.endDate && !item.allDay && ` - ${format(item.endDate, 'HH:mm')}`}
                      </span>
                    </div>
                    {item.attendee && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{item.attendee}</span>
                      </div>
                    )}
                    {item.leadName && item.leadId && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Lead: </span>
                        {item.leadId ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewLeadId(String(item.leadId));
                            }}
                            className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 transition-colors"
                          >
                            {item.leadName}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        ) : (
                          <span>{item.leadName}</span>
                        )}
                      </div>
                    )}
                    {item.timezone && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>{item.timezone}</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{item.location}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.priority && (
                        <Badge variant="outline" className={`text-xs capitalize border ${taskPriorityColors[item.priority] || ''}`}>
                          {item.priority} priority
                        </Badge>
                      )}
                      {item.status && item.type !== 'appointment' && (
                        <Badge variant="outline" className={`text-xs capitalize border ${taskStatusColors[item.status] || ''}`}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      )}
                      {item.hasReminder && (
                        <Badge variant="outline" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Reminder
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
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
              <div
                key={item.id}
                onClick={() => {
                  setCurrentDate(item.date);
                  setSelectedDate(item.date);
                }}
                className={`p-4 rounded-lg border hover:scale-[1.02] transition-transform cursor-pointer ${
                  item.type === 'appointment' && item.appointmentTypeColor
                    ? 'bg-muted/40 border-border'
                    : getItemColor(item)
                }`}
                style={item.type === 'appointment' && item.appointmentTypeColor
                  ? { borderLeftColor: item.appointmentTypeColor, borderLeftWidth: 4 }
                  : undefined}
              >
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  {item.type === 'task' ? (
                    <CheckSquare className="h-3 w-3" />
                  ) : item.type === 'appointment' ? (
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: item.appointmentTypeColor || '#14b8a6' }}
                    />
                  ) : (
                    <CalendarDays className="h-3 w-3" />
                  )}
                  <span>{format(item.date, 'MMM d, HH:mm')}</span>
                </div>
                <h4 className="font-medium text-foreground text-sm">{item.title}</h4>
                <div className="flex flex-col gap-0.5 mt-1">
                  {item.attendee && (
                    <p className="text-xs text-muted-foreground">{item.attendee}</p>
                  )}
                  {item.leadName && item.leadId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewLeadId(String(item.leadId));
                      }}
                      className="text-xs text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 transition-colors"
                    >
                      {item.leadName}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                  {item.timezone && (
                    <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
                      <Globe className="h-3 w-3" />{item.timezone}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className="text-xs mt-2"
                  style={item.type === 'appointment' && item.appointmentTypeColor
                    ? { borderColor: item.appointmentTypeColor + '66', color: item.appointmentTypeColor }
                    : undefined}
                >
                  {item.type === 'task' ? 'Task' : item.type === 'appointment' ? item.subType.replace('_', ' ') : 'Event'}
                </Badge>
              </div>
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
    </div>
  );
};

export default OptomyzeCalendar;
