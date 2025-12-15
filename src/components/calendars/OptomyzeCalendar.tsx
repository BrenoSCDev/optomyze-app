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

// Mock events data - spread across December 2025 and January 2026
const mockEvents = [
  // December 2025
  {
    id: 1,
    title: 'Team Kickoff Meeting',
    date: new Date(2025, 11, 1, 9, 0),
    endDate: new Date(2025, 11, 1, 10, 0),
    type: 'internal',
    attendee: 'All Teams',
    location: 'Main Conference Room'
  },
  {
    id: 2,
    title: 'Client Discovery Call',
    date: new Date(2025, 11, 2, 14, 0),
    endDate: new Date(2025, 11, 2, 15, 0),
    type: 'call',
    attendee: 'BlueTech Inc',
    location: 'Zoom Meeting'
  },
  {
    id: 3,
    title: 'Product Demo - Enterprise',
    date: new Date(2025, 11, 3, 11, 0),
    endDate: new Date(2025, 11, 3, 12, 30),
    type: 'meeting',
    attendee: 'GlobalCorp',
    location: 'Google Meet'
  },
  {
    id: 4,
    title: 'Sales Pipeline Review',
    date: new Date(2025, 11, 4, 10, 0),
    endDate: new Date(2025, 11, 4, 11, 0),
    type: 'internal',
    attendee: 'Sales Team',
    location: 'Office'
  },
  {
    id: 5,
    title: 'Follow-up Call - Sarah',
    date: new Date(2025, 11, 5, 9, 30),
    endDate: new Date(2025, 11, 5, 10, 0),
    type: 'call',
    attendee: 'Sarah Wilson',
    location: 'Phone'
  },
  {
    id: 6,
    title: 'Contract Negotiation',
    date: new Date(2025, 11, 5, 15, 0),
    endDate: new Date(2025, 11, 5, 16, 30),
    type: 'meeting',
    attendee: 'TechStart LLC',
    location: 'Client Office'
  },
  {
    id: 7,
    title: 'Weekly Standup',
    date: new Date(2025, 11, 8, 9, 0),
    endDate: new Date(2025, 11, 8, 9, 30),
    type: 'internal',
    attendee: 'Dev Team',
    location: 'Office'
  },
  {
    id: 8,
    title: 'Investor Presentation',
    date: new Date(2025, 11, 9, 14, 0),
    endDate: new Date(2025, 11, 9, 16, 0),
    type: 'meeting',
    attendee: 'VC Partners',
    location: 'Board Room'
  },
  {
    id: 9,
    title: 'New Lead Intro Call',
    date: new Date(2025, 11, 10, 10, 0),
    endDate: new Date(2025, 11, 10, 10, 45),
    type: 'call',
    attendee: 'DataFlow Systems',
    location: 'Zoom Meeting'
  },
  {
    id: 10,
    title: 'Training Session',
    date: new Date(2025, 11, 10, 14, 0),
    endDate: new Date(2025, 11, 10, 16, 0),
    type: 'internal',
    attendee: 'New Hires',
    location: 'Training Room'
  },
  {
    id: 11,
    title: 'Partnership Discussion',
    date: new Date(2025, 11, 11, 11, 0),
    endDate: new Date(2025, 11, 11, 12, 0),
    type: 'meeting',
    attendee: 'PartnerCo',
    location: 'Google Meet'
  },
  {
    id: 12,
    title: 'Client Onboarding',
    date: new Date(2025, 11, 12, 9, 0),
    endDate: new Date(2025, 11, 12, 11, 0),
    type: 'meeting',
    attendee: 'NewClient Inc',
    location: 'On-site'
  },
  {
    id: 13,
    title: 'Sales Call - John',
    date: new Date(2025, 11, 15, 10, 0),
    endDate: new Date(2025, 11, 15, 11, 0),
    type: 'call',
    attendee: 'John Doe',
    location: 'Zoom Meeting'
  },
  {
    id: 14,
    title: 'Team Lunch',
    date: new Date(2025, 11, 15, 12, 0),
    endDate: new Date(2025, 11, 15, 13, 30),
    type: 'internal',
    attendee: 'All Staff',
    location: 'Restaurant'
  },
  {
    id: 15,
    title: 'Product Demo',
    date: new Date(2025, 11, 16, 14, 0),
    endDate: new Date(2025, 11, 16, 15, 30),
    type: 'meeting',
    attendee: 'Acme Corp',
    location: 'Google Meet'
  },
  {
    id: 16,
    title: 'Support Call',
    date: new Date(2025, 11, 16, 16, 0),
    endDate: new Date(2025, 11, 16, 16, 30),
    type: 'call',
    attendee: 'Existing Client',
    location: 'Phone'
  },
  {
    id: 17,
    title: 'Strategy Meeting',
    date: new Date(2025, 11, 17, 9, 0),
    endDate: new Date(2025, 11, 17, 11, 0),
    type: 'internal',
    attendee: 'Leadership',
    location: 'Board Room'
  },
  {
    id: 18,
    title: 'Follow-up Call',
    date: new Date(2025, 11, 18, 9, 0),
    endDate: new Date(2025, 11, 18, 9, 30),
    type: 'call',
    attendee: 'Sarah Wilson',
    location: 'Phone'
  },
  {
    id: 19,
    title: 'Client Presentation',
    date: new Date(2025, 11, 18, 14, 0),
    endDate: new Date(2025, 11, 18, 15, 30),
    type: 'meeting',
    attendee: 'BigCorp',
    location: 'Client HQ'
  },
  {
    id: 20,
    title: 'Sprint Planning',
    date: new Date(2025, 11, 19, 10, 0),
    endDate: new Date(2025, 11, 19, 12, 0),
    type: 'internal',
    attendee: 'Dev Team',
    location: 'Office'
  },
  {
    id: 21,
    title: 'Quarterly Review',
    date: new Date(2025, 11, 20, 15, 0),
    endDate: new Date(2025, 11, 20, 17, 0),
    type: 'internal',
    attendee: 'Management',
    location: 'Conference Room A'
  },
  {
    id: 22,
    title: 'Discovery Call',
    date: new Date(2025, 11, 22, 10, 0),
    endDate: new Date(2025, 11, 22, 10, 45),
    type: 'call',
    attendee: 'TechStart LLC',
    location: 'Zoom Meeting'
  },
  {
    id: 23,
    title: 'Contract Signing',
    date: new Date(2025, 11, 22, 14, 0),
    endDate: new Date(2025, 11, 22, 15, 0),
    type: 'meeting',
    attendee: 'MegaCorp',
    location: 'Legal Office'
  },
  {
    id: 24,
    title: 'Year-End Review',
    date: new Date(2025, 11, 23, 9, 0),
    endDate: new Date(2025, 11, 23, 12, 0),
    type: 'internal',
    attendee: 'All Departments',
    location: 'Main Hall'
  },
  {
    id: 25,
    title: 'Holiday Party',
    date: new Date(2025, 11, 24, 18, 0),
    endDate: new Date(2025, 11, 24, 22, 0),
    type: 'internal',
    attendee: 'Company Wide',
    location: 'Event Center'
  },
  {
    id: 26,
    title: 'New Year Planning',
    date: new Date(2025, 11, 29, 10, 0),
    endDate: new Date(2025, 11, 29, 12, 0),
    type: 'internal',
    attendee: 'Leadership',
    location: 'Board Room'
  },
  {
    id: 27,
    title: 'Client Check-in',
    date: new Date(2025, 11, 30, 11, 0),
    endDate: new Date(2025, 11, 30, 11, 30),
    type: 'call',
    attendee: 'Key Accounts',
    location: 'Phone'
  },
  {
    id: 28,
    title: 'Q1 Kickoff Prep',
    date: new Date(2025, 11, 31, 9, 0),
    endDate: new Date(2025, 11, 31, 11, 0),
    type: 'internal',
    attendee: 'Sales Team',
    location: 'Office'
  },
  // January 2026
  {
    id: 29,
    title: 'New Year Kickoff',
    date: new Date(2026, 0, 2, 9, 0),
    endDate: new Date(2026, 0, 2, 11, 0),
    type: 'internal',
    attendee: 'All Staff',
    location: 'Main Hall'
  },
  {
    id: 30,
    title: 'Q1 Goals Meeting',
    date: new Date(2026, 0, 3, 14, 0),
    endDate: new Date(2026, 0, 3, 16, 0),
    type: 'internal',
    attendee: 'Department Heads',
    location: 'Board Room'
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
