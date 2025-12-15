/**
 * OPTOMYZE CALENDAR COMPONENT
 * 
 * Displays a full calendar view with events and appointments
 * Features mock data for now, to be connected to API later
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

// Mock events data
const mockEvents = [
  {
    id: 1,
    title: 'Sales Call - John Doe',
    date: new Date(2025, 11, 16, 10, 0),
    endDate: new Date(2025, 11, 16, 11, 0),
    type: 'call',
    attendee: 'John Doe',
    location: 'Zoom Meeting'
  },
  {
    id: 2,
    title: 'Product Demo',
    date: new Date(2025, 11, 17, 14, 0),
    endDate: new Date(2025, 11, 17, 15, 30),
    type: 'meeting',
    attendee: 'Acme Corp',
    location: 'Google Meet'
  },
  {
    id: 3,
    title: 'Follow-up Call',
    date: new Date(2025, 11, 18, 9, 0),
    endDate: new Date(2025, 11, 18, 9, 30),
    type: 'call',
    attendee: 'Sarah Wilson',
    location: 'Phone'
  },
  {
    id: 4,
    title: 'Team Standup',
    date: new Date(2025, 11, 15, 9, 0),
    endDate: new Date(2025, 11, 15, 9, 30),
    type: 'internal',
    attendee: 'Sales Team',
    location: 'Office'
  },
  {
    id: 5,
    title: 'Client Onboarding',
    date: new Date(2025, 11, 19, 11, 0),
    endDate: new Date(2025, 11, 19, 12, 0),
    type: 'meeting',
    attendee: 'NewTech Inc',
    location: 'On-site'
  },
  {
    id: 6,
    title: 'Quarterly Review',
    date: new Date(2025, 11, 20, 15, 0),
    endDate: new Date(2025, 11, 20, 17, 0),
    type: 'internal',
    attendee: 'Management',
    location: 'Conference Room A'
  },
  {
    id: 7,
    title: 'Discovery Call - TechStart',
    date: new Date(2025, 11, 22, 10, 0),
    endDate: new Date(2025, 11, 22, 10, 45),
    type: 'call',
    attendee: 'TechStart LLC',
    location: 'Zoom Meeting'
  },
];

const eventTypeColors: Record<string, string> = {
  call: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  meeting: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  internal: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const OptomyzeCalendar: React.FC = () => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

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

  const getEventsForDate = (date: Date) => {
    return mockEvents.filter(event => isSameDay(event.date, date));
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
        <Button className="bg-primary hover:bg-primary/80">
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
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
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
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${eventTypeColors[event.type]}`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - 2} {t('calendar.more')}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
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

          {selectedDateEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{t('calendar.no-events')}</p>
              <p className="text-gray-500 text-xs mt-1">{t('calendar.no-events-description')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateEvents.map(event => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border ${eventTypeColors[event.type]} cursor-pointer hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-white">{event.title}</h4>
                    <Badge variant="outline" className={eventTypeColors[event.type]}>
                      {event.type}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(event.date, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{event.attendee}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockEvents.slice(0, 4).map(event => (
            <div
              key={event.id}
              className={`p-4 rounded-lg border ${eventTypeColors[event.type]} hover:scale-[1.02] transition-transform cursor-pointer`}
            >
              <p className="text-xs text-gray-400 mb-1">
                {format(event.date, 'MMM d, HH:mm')}
              </p>
              <h4 className="font-medium text-white text-sm">{event.title}</h4>
              <p className="text-xs text-gray-400 mt-1">{event.attendee}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default OptomyzeCalendar;
