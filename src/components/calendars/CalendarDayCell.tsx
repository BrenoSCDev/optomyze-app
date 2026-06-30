/**
 * CALENDAR DAY CELL
 *
 * A single day in the month/week grid. Redesigned for stronger visual
 * hierarchy: a filled "today" marker, a clearer selected state, a
 * density-dot row indicating event mix, and an overflow control that
 * opens the expanded day dialog instead of a plain "+N more" label.
 */

import React from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { CalendarItem, getAccentColor } from './calendarUtils';
import { EventChip } from './EventChip';

interface CalendarDayCellProps {
  day: Date;
  items: CalendarItem[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  variant: 'month' | 'week';
  itemLimit: number;
  onSelectDate: (date: Date) => void;
  onShowMore: (date: Date) => void;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  day,
  items,
  isCurrentMonth,
  isSelected,
  isToday,
  variant,
  itemLimit,
  onSelectDate,
  onShowMore,
}) => {
  const { t } = useLanguage();
  const cellMinH = variant === 'week' ? 'min-h-[170px] sm:min-h-[230px]' : 'min-h-[92px] sm:min-h-[120px]';
  const visibleItems = items.slice(0, itemLimit);
  const overflowCount = items.length - itemLimit;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectDate(day)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelectDate(day);
      }}
      className={cn(
        'flex flex-col rounded-lg text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        cellMinH,
        isCurrentMonth ? 'bg-muted/40 hover:bg-muted/70' : 'bg-transparent opacity-40',
        isSelected && 'ring-2 ring-primary bg-primary/10',
        isToday && !isSelected && 'ring-1 ring-primary/50'
      )}
    >
      <div className="flex items-center justify-between px-1.5 sm:px-2 pt-1.5 sm:pt-2">
        <span
          className={cn(
            'flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full text-sm font-semibold transition-colors',
            isToday
              ? 'bg-primary text-primary-foreground shadow-sm'
              : isCurrentMonth
                ? 'text-foreground'
                : 'text-muted-foreground'
          )}
        >
          {format(day, 'd')}
        </span>
      </div>

      <div className="flex-1 px-1.5 sm:px-2 pb-1 mt-1 space-y-0.5 sm:space-y-1 overflow-hidden">
        {visibleItems.map((item) => (
          <EventChip key={item.id} item={item} variant={variant} onSelect={() => onSelectDate(day)} />
        ))}
        {overflowCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowMore(day);
            }}
            className="w-full text-left text-[10px] sm:text-xs font-semibold text-primary hover:underline px-1"
          >
            +{overflowCount} {t('calendar.more')}
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex items-center gap-0.5 px-1.5 sm:px-2 pb-1.5 sm:pb-2">
          {items.slice(0, 6).map((item) => (
            <span
              key={item.id}
              className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: getAccentColor(item) }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarDayCell;
