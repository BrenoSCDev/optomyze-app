/**
 * CALENDAR MANAGER
 *
 * Every calendar the company owns, with the actions that apply to each. A
 * sheet rather than a page: managing calendars is something you do beside the
 * grid, and closing it should put you straight back where you were.
 *
 * Deleting explains where the appointments go. That matters — a calendar looks
 * like a container of bookings, so "delete" reads as destructive until the
 * dialog says the contents move to the default.
 */

import { useState } from 'react';
import { Archive, ArchiveRestore, CalendarDays, ListChecks, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCalendars } from '@/contexts/CalendarsContext';
import { Calendar, calendarService } from '@/services/calendarApi';
import CalendarFormDialog from './CalendarFormDialog';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarManagerSheet: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { calendars, reload, update, makeDefault, remove } = useCalendars();

  const [editing, setEditing] = useState<Calendar | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Calendar | null>(null);
  const [busy, setBusy] = useState(false);
  const [archived, setArchived] = useState<Calendar[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const loadArchived = async () => {
    const all = await calendarService.list(true).catch(() => []);
    setArchived(all.filter(c => !c.is_active));
    setShowArchived(true);
  };

  const setActive = async (calendar: Calendar, isActive: boolean) => {
    try {
      setBusy(true);
      await update(calendar.id, { is_active: isActive });
      toast.success(isActive ? t('calendars.restored') : t('calendars.archived-toast'));
      if (showArchived) await loadArchived();
      else await reload();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('calendars.save-failed'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      setBusy(true);
      await remove(deleting.id);
      toast.success(t('calendars.deleted'));
      setDeleting(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('calendars.delete-failed'));
    } finally {
      setBusy(false);
    }
  };

  const rows = showArchived ? [...calendars, ...archived] : calendars;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('calendars.manage')}</SheetTitle>
            <SheetDescription>{t('calendars.manage-description')}</SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex items-center justify-between gap-2">
            <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" />
              {t('calendars.create')}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => (showArchived ? setShowArchived(false) : void loadArchived())}
            >
              {showArchived ? t('calendars.hide-archived') : t('calendars.show-archived')}
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {rows.map(calendar => (
              <div
                key={calendar.id}
                className={cn(
                  'rounded-lg border border-border bg-card p-3',
                  !calendar.is_active && 'opacity-60'
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: calendar.color }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{calendar.name}</span>
                      {calendar.is_default && (
                        <Badge variant="outline" className="text-[10px]">{t('calendars.default')}</Badge>
                      )}
                      {!calendar.is_active && (
                        <Badge variant="outline" className="text-[10px]">{t('calendars.archived')}</Badge>
                      )}
                    </div>

                    {calendar.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{calendar.description}</p>
                    )}

                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {calendar.appointments_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ListChecks className="h-3 w-3" />
                        {calendar.tasks_count ?? 0}
                      </span>
                      <span>{t(`calendars.visibility.${calendar.visibility}`)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {!calendar.is_default && calendar.is_active && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            disabled={busy}
                            onClick={() => void makeDefault(calendar.id).then(() => toast.success(t('calendars.default-set')))}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('calendars.make-default')}</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => { setEditing(calendar); setFormOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('common.edit')}</TooltipContent>
                    </Tooltip>

                    {/* The default is the fallback every unfiled record lands
                        on, so it can be neither archived nor deleted. */}
                    {!calendar.is_default && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8"
                              disabled={busy}
                              onClick={() => void setActive(calendar, !calendar.is_active)}
                            >
                              {calendar.is_active
                                ? <Archive className="h-4 w-4" />
                                : <ArchiveRestore className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {calendar.is_active ? t('calendars.archive') : t('calendars.restore')}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleting(calendar)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('common.delete')}</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <CalendarFormDialog
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        calendar={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('calendars.delete-title')}</AlertDialogTitle>
            {/* Says where the contents go — the whole point of the safeguard. */}
            <AlertDialogDescription>{t('calendars.delete-confirmation')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CalendarManagerSheet;
