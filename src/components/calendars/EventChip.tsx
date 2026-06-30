/**
 * EVENT CHIP
 *
 * Compact item rendered inside a calendar day cell (month/week grid) or
 * as a row in the single-day view. Hovering reveals a richer preview
 * popover without leaving the grid; clicking selects the day.
 */

import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { CheckSquare, CalendarDays, Clock, User, FileText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarItem, getItemColor, getAccentColor, formatTime, formatDuration } from './calendarUtils';
import { StatusBadge } from './StatusBadge';
import { MiniAvatar } from './MiniAvatar';

interface EventChipProps {
  item: CalendarItem;
  variant: 'month' | 'week' | 'day';
  onSelect: () => void;
}

const TypeGlyph: React.FC<{ item: CalendarItem; className?: string }> = ({ item, className }) => {
  if (item.type === 'task') return <CheckSquare className={className} />;
  if (item.type === 'appointment') {
    return (
      <span
        className="rounded-full inline-block shrink-0"
        style={{ backgroundColor: getAccentColor(item), width: 8, height: 8 }}
      />
    );
  }
  return <CalendarDays className={className} />;
};

export const EventChip: React.FC<EventChipProps> = ({ item, variant, onSelect }) => {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const openPreview = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const accentColor = getAccentColor(item);
  const colorClasses = getItemColor(item);
  const duration = formatDuration(item.date, item.endDate);
  const isDay = variant === 'day';
  const isMonth = variant === 'month';

  const statusBadge = item.type === 'appointment'
    ? <StatusBadge kind="appointment-status" value={item.status} className="text-[10px] px-1.5 py-0" />
    : item.type === 'task'
      ? <StatusBadge kind="task-priority" value={item.priority} className="text-[10px] px-1.5 py-0" />
      : <StatusBadge kind="event-type" value={item.subType} className="text-[10px] px-1.5 py-0" />;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={openPreview}
          onMouseLeave={scheduleClose}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={cn(
            'flex items-center gap-1 sm:gap-1.5 rounded border-l-2 cursor-pointer transition-colors',
            colorClasses,
            isDay
              ? 'px-2.5 py-1.5 text-sm w-full'
              : isMonth
                ? 'px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs'
                : 'px-1.5 py-1 text-xs'
          )}
          style={{ borderLeftColor: accentColor }}
        >
          <TypeGlyph item={item} className={isDay ? 'h-3.5 w-3.5 shrink-0' : 'h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0'} />
          <span className={cn('truncate font-medium', isMonth ? 'hidden sm:inline' : '')}>{item.title}</span>
          {isMonth && <span className="truncate font-medium sm:hidden">{item.title.charAt(0)}</span>}
          {(isDay || variant === 'week') && (
            <span className="ml-auto text-[10px] opacity-70 shrink-0">{formatTime(item.date, item.allDay)}</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        onMouseEnter={openPreview}
        onMouseLeave={scheduleClose}
        className="w-72 p-3 space-y-2"
        side="right"
        align="start"
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm text-foreground leading-snug">{item.title}</h4>
          {statusBadge}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span>
            {formatTime(item.date, item.allDay)}
            {item.endDate && !item.allDay && ` – ${format(item.endDate, 'HH:mm')}`}
          </span>
          {duration && <span className="text-muted-foreground/70">· {duration}</span>}
        </div>

        {item.leadName && (
          <div className="flex items-center gap-1.5 text-xs">
            <MiniAvatar name={item.leadName} id={item.leadId} />
            <span className="text-foreground">{item.leadName}</span>
          </div>
        )}

        {item.attendee && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3 shrink-0" />
            <span>{item.attendee}</span>
          </div>
        )}

        {item.description && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <FileText className="h-3 w-3 mt-0.5 shrink-0" />
            <p className="line-clamp-2">{item.description}</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default EventChip;
