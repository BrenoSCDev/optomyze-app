/**
 * CALENDAR SWITCHER
 *
 * The active-calendar control in the Calendar toolbar. Switching is a local
 * state change plus a refetch, so it is effectively instant — the grid keeps
 * its position and only the contents change.
 *
 * Management lives behind the same control rather than on a settings page:
 * creating and editing calendars is something people do while looking at one.
 */

import { useState } from 'react';
import { Check, ChevronDown, Plus, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCalendars } from '@/contexts/CalendarsContext';
import { cn } from '@/lib/utils';
import CalendarManagerSheet from './CalendarManagerSheet';
import CalendarFormDialog from './CalendarFormDialog';

const CalendarSwitcher = () => {
  const { t } = useLanguage();
  const { calendars, selected, select } = useCalendars();
  const [managerOpen, setManagerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="max-w-[16rem] gap-2">
            {/* The colour dot is the at-a-glance "which calendar am I on". */}
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: selected?.color ?? 'hsl(var(--muted-foreground))' }}
            />
            <span className="truncate">{selected?.name ?? t('calendars.all')}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64 bg-background border-border z-[80]">
          <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('calendars.label')}
          </DropdownMenuLabel>

          {calendars.map(calendar => (
            <DropdownMenuItem
              key={calendar.id}
              onClick={() => select(calendar.id)}
              className="cursor-pointer gap-2"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: calendar.color }}
              />
              <span className="min-w-0 flex-1 truncate">{calendar.name}</span>
              {calendar.is_default && (
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t('calendars.default')}
                </span>
              )}
              <Check
                className={cn(
                  'h-4 w-4 shrink-0',
                  selected?.id === calendar.id ? 'opacity-100 text-primary' : 'opacity-0'
                )}
              />
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem className="cursor-pointer" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('calendars.create')}
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => setManagerOpen(true)}>
            <Settings2 className="h-4 w-4" />
            {t('calendars.manage')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CalendarFormDialog isOpen={createOpen} onClose={() => setCreateOpen(false)} calendar={null} />
      <CalendarManagerSheet isOpen={managerOpen} onClose={() => setManagerOpen(false)} />
    </>
  );
};

export default CalendarSwitcher;
