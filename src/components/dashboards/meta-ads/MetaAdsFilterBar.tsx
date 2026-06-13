import React, { useState } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { META_ADS_DATE_RANGE_OPTIONS } from './registry';
import type { MetaAdsDateRangeValue } from '@/services/metaAdsApi';

interface MetaAdsFilterBarProps {
  dateRange: MetaAdsDateRangeValue;
  onDateRangeChange: (value: MetaAdsDateRangeValue) => void;
  customDateFrom: Date | null;
  customDateTo: Date | null;
  onCustomDateChange: (from: Date | null, to: Date | null) => void;
}

const MetaAdsFilterBar: React.FC<MetaAdsFilterBarProps> = ({
  dateRange,
  onDateRangeChange,
  customDateFrom,
  customDateTo,
  onCustomDateChange,
}) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>({
    from: customDateFrom ?? undefined,
    to: customDateTo ?? undefined,
  });

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // Reset the draft to the last applied range whenever the popover opens
      setDraftRange({ from: customDateFrom ?? undefined, to: customDateTo ?? undefined });
    }
    setOpen(next);
  };

  const handleApply = () => {
    onCustomDateChange(draftRange?.from ?? null, draftRange?.to ?? null);
    setOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-[#0081FB]" />
        <Select value={dateRange} onValueChange={(v) => onDateRangeChange(v as MetaAdsDateRangeValue)}>
          <SelectTrigger className="w-[160px] h-9 glass-card text-sm transition-colors hover:border-[#0081FB]/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {META_ADS_DATE_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {dateRange === 'custom' && (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 glass-card text-sm font-normal transition-colors hover:border-[#0081FB]/40">
              {customDateFrom
                ? `${format(customDateFrom, 'MMM d, yyyy')}${customDateTo ? ` - ${format(customDateTo, 'MMM d, yyyy')}` : ''}`
                : t('activity.filter.pick-dates')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={draftRange}
              onSelect={setDraftRange}
            />
            <div className="flex justify-end p-3 border-t border-border">
              <Button
                size="sm"
                disabled={!draftRange?.from || !draftRange?.to}
                onClick={handleApply}
                className="bg-[#0081FB] hover:bg-[#0081FB]/90 text-white"
              >
                {t('meta.filter.apply')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default MetaAdsFilterBar;
