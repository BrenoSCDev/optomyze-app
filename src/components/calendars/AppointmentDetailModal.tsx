/**
 * APPOINTMENT DETAIL
 *
 * What opens when someone clicks an appointment: the booking as it stands,
 * the actions that apply to it, and the discussion around it — mirroring the
 * task detail view so both scheduling surfaces read the same way.
 *
 * Opening straight into the edit form, which is what used to happen, made a
 * glance cost a modal full of inputs and risked a stray keystroke changing a
 * confirmed booking. Editing is now one deliberate click away.
 *
 * Status changes persist immediately rather than behind a Save button: they
 * are single, decisive acts ("they cancelled"), not part of a longer edit.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Ban, CalendarClock, Check, CheckCircle2, Clock, Loader2, Pencil, Trash2, User as UserIcon, UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { Appointment, deleteAppointment, updateAppointment } from '@/services/appointmentApi';
import NotesThread from '@/components/notes/NotesThread';
import UserAvatar from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import { leadDisplayName } from '@/lib/leadName';

type Status = Appointment['status'];

/**
 * The statuses offered as one-click actions, in the order they occur.
 *
 * `draft` is absent on purpose: a booking moves *out* of draft by being
 * confirmed, and nothing is served by letting someone push it back.
 */
const STATUS_ACTIONS: { status: Status; icon: React.ElementType; tone: string }[] = [
  { status: 'scheduled', icon: Check,        tone: 'text-primary' },
  { status: 'completed', icon: CheckCircle2, tone: 'text-success' },
  { status: 'cancelled', icon: Ban,          tone: 'text-destructive' },
  { status: 'no_show',   icon: UserX,        tone: 'text-destructive' },
];

const STATUS_TONE: Record<Status, string> = {
  draft:     'bg-surface-2 text-muted-foreground border-border',
  scheduled: 'bg-primary/10 text-primary border-primary/30',
  completed: 'bg-success-soft text-success border-success/30',
  cancelled: 'bg-destructive-soft text-destructive border-destructive/30',
  no_show:   'bg-destructive-soft text-destructive border-destructive/30',
};

/**
 * The API sends wall-clock time in the appointment's own timezone, so the
 * components are read literally rather than letting Date shift them into the
 * browser's zone — same reasoning as the calendar grid.
 */
const parseWallClock = (iso: string): Date => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : new Date(iso);
};

interface Props {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  /** Fired with the updated record so the grid behind stays in step. */
  onSaved: (appointment: Appointment) => void;
  onDeleted: (id: number) => void;
  /** Hands the appointment to the edit form. */
  onEdit: (appointment: Appointment) => void;
  /**
   * Opens the contact behind the booking. Handled by the calendar rather than
   * here so the lead view is a sibling of this modal, not nested inside it —
   * two stacked dialogs fight over the focus trap.
   */
  onOpenLead: (leadId: number) => void;
}

const AppointmentDetailModal: React.FC<Props> = ({
  open, appointment, onClose, onSaved, onDeleted, onEdit, onOpenLead,
}) => {
  const { t, language } = useLanguage();
  const locale = language || undefined;

  // Local working copy: status changes should show instantly without the
  // parent having to round-trip the whole list.
  const [current, setCurrent] = useState<Appointment | null>(appointment);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setCurrent(appointment); }, [appointment]);

  const setStatus = useCallback(async (status: Status) => {
    if (!current || current.status === status) return;

    setSaving(true);
    try {
      const saved = await updateAppointment(current.id, { status });
      setCurrent(saved);
      onSaved(saved);
      toast.success(t('appointment-detail.status-updated'));
    } catch {
      toast.error(t('appointment-detail.status-failed'));
    } finally {
      setSaving(false);
    }
  }, [current, onSaved, t]);

  const handleDelete = async () => {
    if (!current) return;
    setDeleting(true);
    try {
      await deleteAppointment(current.id);
      onDeleted(current.id);
      setConfirmDelete(false);
      onClose();
      toast.success(t('calendar.appointment.deleted'));
    } catch {
      toast.error(t('calendar.appointment.delete-failed'));
    } finally {
      setDeleting(false);
    }
  };

  const start = current ? parseWallClock(current.scheduled_at) : null;
  const end = current?.end_at ? parseWallClock(current.end_at) : null;

  const lead = current?.lead ?? null;
  const leadName = lead ? leadDisplayName(lead, t('appointment-detail.contact')) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={o => !o && onClose()}>
        <DialogContent className="flex h-[min(88vh,52rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
          {!current ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <>
              <DialogHeader className="shrink-0 border-b border-border px-5 py-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Badge variant="outline" className={cn('text-[11px]', STATUS_TONE[current.status])}>
                    {t(`appointments.status-${current.status.replace('_', '-')}`)}
                  </Badge>

                  {/* pr-7 clears the Dialog's own close button, which is
                      absolutely positioned at right-4. */}
                  <div className="ml-auto flex items-center gap-1 pr-7">
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    <Button variant="ghost" size="sm" onClick={() => onEdit(current)}>
                      <Pencil className="h-4 w-4" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <DialogTitle className="pt-1 text-left text-lg">{current.title}</DialogTitle>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {/* Facts */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Fact icon={Clock} label={t('appointment-detail.when')}>
                    <span className="text-foreground">
                      {start?.toLocaleDateString(locale, {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </span>
                    <span className="block text-muted-foreground">
                      {start?.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                      {end && ` – ${end.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`}
                      {current.timezone && ` · ${current.timezone}`}
                    </span>
                  </Fact>

                  {current.appointment_type && (
                    <Fact icon={CalendarClock} label={t('appointment-detail.type')}>
                      <span className="inline-flex items-center gap-1.5 text-foreground">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: current.appointment_type.color ?? '#94a3b8' }}
                        />
                        {current.appointment_type.name}
                      </span>
                    </Fact>
                  )}

                  {lead && (
                    <Fact icon={UserIcon} label={t('appointment-detail.contact')}>
                      {/* The contact is the reason the booking exists, so it is
                          the way through to them rather than a dead label. */}
                      <button
                        type="button"
                        onClick={() => onOpenLead(lead.id)}
                        className="group flex items-center gap-2 text-left"
                      >
                        <UserAvatar
                          name={leadName ?? ''}
                          profilePicPath={lead.profile_pic_url ?? null}
                          className="h-6 w-6 text-[10px]"
                        />
                        <span className="text-foreground underline-offset-2 group-hover:text-primary group-hover:underline">
                          {leadName}
                        </span>
                      </button>
                    </Fact>
                  )}

                  {current.user && (
                    <Fact icon={UserIcon} label={t('appointment-detail.owner')}>
                      <span className="flex items-center gap-2">
                        <UserAvatar
                          name={current.user.name}
                          profilePicPath={(current.user as { profile_pic?: string | null }).profile_pic}
                          className="h-6 w-6 text-[10px]"
                        />
                        <span className="text-foreground">{current.user.name}</span>
                      </span>
                    </Fact>
                  )}
                </div>

                {current.notes && (
                  <div className="mt-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t('appointment-detail.notes')}
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-foreground">{current.notes}</p>
                  </div>
                )}

                {/* Status actions */}
                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('appointment-detail.status')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ACTIONS.map(({ status, icon: Icon, tone }) => {
                      const active = current.status === status;

                      return (
                        <Button
                          key={status}
                          variant={active ? 'secondary' : 'outline'}
                          size="sm"
                          disabled={saving || active}
                          onClick={() => void setStatus(status)}
                          className="gap-1.5"
                        >
                          <Icon className={cn('h-4 w-4', !active && tone)} />
                          {/* A draft becomes "confirmed" rather than merely
                              "scheduled" — that is the act being performed. */}
                          {status === 'scheduled' && current.status === 'draft'
                            ? t('appointment-detail.confirm')
                            : t(`appointments.status-${status.replace('_', '-')}`)}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Discussion — the same threaded notes leads and deals use,
                    so a reply here behaves exactly as it does there. */}
                <div className="mt-6 border-t border-border pt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('appointment-detail.comments')}
                  </p>
                  <NotesThread type="appointment" id={current.id} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={o => !o && setConfirmDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('calendar.appointment.delete-title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('calendar.appointment.delete-description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/** One labelled fact in the header grid. */
const Fact: React.FC<{
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}> = ({ icon: Icon, label, children }) => (
  <div className="rounded-lg border border-border bg-surface-2/50 p-3">
    <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </p>
    <div className="text-sm">{children}</div>
  </div>
);

export default AppointmentDetailModal;
