import React from 'react';
import { format } from 'date-fns';
import { Filter, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ACTIVITY_FILTER_GROUPS, ACTIVITY_DATE_RANGE_OPTIONS } from './registry';
import type { ActivityDateRangeValue, ActivityFilterValue } from './types';

interface ActivityFilterBarProps {
  group: ActivityFilterValue;
  onGroupChange: (value: ActivityFilterValue) => void;
  dateRange: ActivityDateRangeValue;
  onDateRangeChange: (value: ActivityDateRangeValue) => void;
  customDateFrom: Date | null;
  customDateTo: Date | null;
  onCustomDateChange: (from: Date | null, to: Date | null) => void;
}

const ActivityFilterBar: React.FC<ActivityFilterBarProps> = ({
  group,
  onGroupChange,
  dateRange,
  onDateRangeChange,
  customDateFrom,
  customDateTo,
  onCustomDateChange,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={group} onValueChange={(v) => onGroupChange(v as ActivityFilterValue)}>
          <SelectTrigger className="w-[180px] h-9 glass-card text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {ACTIVITY_FILTER_GROUPS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
        <Select value={dateRange} onValueChange={(v) => onDateRangeChange(v as ActivityDateRangeValue)}>
          <SelectTrigger className="w-[160px] h-9 glass-card text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {ACTIVITY_DATE_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {dateRange === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 glass-card text-sm font-normal">
              {customDateFrom
                ? `${format(customDateFrom, 'MMM d, yyyy')}${customDateTo ? ` - ${format(customDateTo, 'MMM d, yyyy')}` : ''}`
                : t('activity.filter.pick-dates')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={{ from: customDateFrom ?? undefined, to: customDateTo ?? undefined }}
              onSelect={(range) => onCustomDateChange(range?.from ?? null, range?.to ?? null)}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default ActivityFilterBar;
