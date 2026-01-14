/**
 * OPTOMYZE CALENDAR COMPONENT
 * 
 * Displays a full calendar view with events and appointments
 * Connected to /api/events for real data with full CRUD support
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, User, MapPin, CheckSquare, CalendarDays, AlertCircle, Loader2, Edit2, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useCalendarEvents, 
  useCreateCalendarEvent, 
  useUpdateCalendarEvent, 
  useDeleteCalendarEvent 
} from '@/hooks/useCalendarEvents';
import { CalendarTask, CalendarEvent } from '@/services/calendarApi';
import { EventFormModal, EventFormData } from './EventFormModal';
import { DeleteEventDialog } from './DeleteEventDialog';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, isAfter, addDays } from 'date-fns';

// Color mapping for event types
const eventTypeColors: Record<string, string> = {
  call: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  meeting: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  internal: 'bg-green-500/20 text-green-400 border-green-500/30',
  deadline: 'bg-red-500/20 text-red-400 border-red-500/30',
  reminder: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

// Color mapping for task priorities
const taskPriorityColors: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

// Unified calendar item type
interface CalendarItem {
  id: string;
  originalId: number;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  type: 'task' | 'event';
  subType: string;
  allDay?: boolean;
  priority?: string;
  status?: string;
  attendee?: string;
  location?: string;
  hasReminder: boolean;
  leadName?: string;
  originalEvent?: CalendarEvent;
}

const OptomyzeCalendar: React.FC = () => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<CalendarEvent | null>(null);
  const [selectedEventForDelete, setSelectedEventForDelete] = useState<CalendarItem | null>(null);

  const { data, isLoading, error } = useCalendarEvents();
  const createEventMutation = useCreateCalendarEvent();
  const updateEventMutation = useUpdateCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();

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
        date: parseISO(task.due_date),
        type: 'task',
        subType: task.priority,
        priority: task.priority,
        status: task.status,
        hasReminder: task.reminder === 1,
        attendee: task.assignee?.name,
        leadName: task.lead ? `${task.lead.first_name} ${task.lead.last_name}` : undefined,
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

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
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            {t('calendar.optomyze.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('calendar.optomyze.description')}
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/80" onClick={handleCreateEvent}>
          <Plus className="h-4 w-4 mr-2" />
          {t('calendar.new-event')}
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <motion.div 
          className="lg:col-span-2 glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                {t('calendar.today')}
              </Button>
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayItems = getItemsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-[80px] p-2 rounded-lg text-left transition-all
                      ${isCurrentMonth ? 'bg-white/5 hover:bg-white/10' : 'bg-transparent opacity-40'}
                      ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''}
                      ${isToday ? 'border border-primary/50' : ''}
                    `}
                  >
                    <span className={`
                      text-sm font-medium
                      ${isToday ? 'text-primary' : isCurrentMonth ? 'text-white' : 'text-gray-500'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayItems.slice(0, 2).map(item => (
                        <div
                          key={item.id}
                          className={`text-xs px-1 py-0.5 rounded truncate flex items-center gap-1 ${getItemColor(item)}`}
                        >
                          {item.type === 'task' ? (
                            <CheckSquare className="h-3 w-3 flex-shrink-0" />
                          ) : (
                            <CalendarDays className="h-3 w-3 flex-shrink-0" />
                          )}
                          <span className="truncate">{item.title}</span>
                        </div>
                      ))}
                      {dayItems.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayItems.length - 2} {t('calendar.more')}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Selected Day Events */}
        <motion.div 
          className="glass-card p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : t('calendar.select-date')}
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedDateItems.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{t('calendar.no-events')}</p>
              <p className="text-gray-500 text-xs mt-1">{t('calendar.no-events-description')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateItems.map(item => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border ${getItemColor(item)} hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {item.type === 'task' ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <CalendarDays className="h-4 w-4" />
                      )}
                      <h4 className="font-medium text-white">{item.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getItemColor(item)}>
                        {item.type === 'task' ? 'Task' : item.subType}
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
                    <div className="mt-2 flex items-start gap-2 text-sm text-gray-300">
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                      <p className="line-clamp-2">{item.description}</p>
                    </div>
                  )}
                  
                  <div className="mt-3 space-y-2 text-sm text-gray-400">
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
                    {item.leadName && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Lead: {item.leadName}</span>
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
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.priority} priority
                        </Badge>
                      )}
                      {item.status && (
                        <Badge variant="outline" className="text-xs capitalize">
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
        <h3 className="text-lg font-semibold text-white mb-4">{t('calendar.upcoming-events')}</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : upcomingItems.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No upcoming events or tasks</p>
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
                className={`p-4 rounded-lg border ${getItemColor(item)} hover:scale-[1.02] transition-transform cursor-pointer`}
              >
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  {item.type === 'task' ? (
                    <CheckSquare className="h-3 w-3" />
                  ) : (
                    <CalendarDays className="h-3 w-3" />
                  )}
                  <span>{format(item.date, 'MMM d, HH:mm')}</span>
                </div>
                <h4 className="font-medium text-white text-sm">{item.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {item.attendee && (
                    <p className="text-xs text-gray-400">{item.attendee}</p>
                  )}
                  {item.leadName && (
                    <p className="text-xs text-gray-400">{item.leadName}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs mt-2">
                  {item.type === 'task' ? 'Task' : 'Event'}
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
