/**
 * APPOINTMENT MODAL
 *
 * The calendar's single create/view/edit/delete surface. Clicking an
 * appointment or an empty slot opens this rather than navigating away, so the
 * user never leaves the calendar to manage their schedule.
 *
 * A lead is optional — an internal meeting or a focus block has nobody
 * attached — so the lead picker is an opt-in extra, not a required field.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Loader2, Trash2, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCalendars } from '@/contexts/CalendarsContext';
import {
  Appointment, createAppointment, deleteAppointment, updateAppointment,
} from '@/services/appointmentApi';
import { AppointmentType } from '@/services/appointmentTypeApi';

const STATUSES: Appointment['status'][] = ['draft', 'scheduled', 'completed', 'cancelled', 'no_show'];

/** `2026-08-01T14:30:00Z` -> `2026-08-01T14:30` for datetime-local inputs. */
const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : '';
};

const fromLocalInput = (value: string): string => (value ? value.replace('T', ' ') + ':00' : '');

interface Props {
  open: boolean;
  onClose: () => void;
  /** Existing appointment to view/edit; null when creating. */
  appointment: Appointment | null;
  /** Prefilled start for slot-click creation. */
  initialStart?: string | null;
  appointmentTypes: AppointmentType[];
  onSaved: (appointment: Appointment) => void;
  onDeleted: (id: number) => void;
}

const AppointmentModal: React.FC<Props> = ({
  open, onClose, appointment, initialStart, appointmentTypes, onSaved, onDeleted,
}) => {
  const { t } = useLanguage();
  const { selected: activeCalendar } = useCalendars();
  const isEditing = !!appointment;

  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [typeId, setTypeId] = useState<string>('none');
  const [status, setStatus] = useState<Appointment['status']>('scheduled');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset whenever the modal opens for a different record.
  useEffect(() => {
    if (!open) return;
    setTitle(appointment?.title ?? '');
    setStart(toLocalInput(appointment?.scheduled_at ?? initialStart ?? ''));
    setEnd(toLocalInput(appointment?.end_at ?? ''));
    setTypeId(appointment?.appointment_type_id ? String(appointment.appointment_type_id) : 'none');
    setStatus(appointment?.status ?? 'scheduled');
    setNotes(appointment?.notes ?? '');
  }, [open, appointment, initialStart]);

  const leadName = useMemo(() => {
    const lead = appointment?.lead;
    return lead ? `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim() : null;
  }, [appointment]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t('calendar.appointment.title-required'));
      return;
    }
    if (!start) {
      toast.error(t('calendar.appointment.start-required'));
      return;
    }
    if (end && end < start) {
      toast.error(t('calendar.appointment.end-before-start'));
      return;
    }

    const payload = {
      title: title.trim(),
      scheduled_at: fromLocalInput(start),
      end_at: end ? fromLocalInput(end) : undefined,
      appointment_type_id: typeId === 'none' ? null : Number(typeId),
      status,
      notes: notes.trim() || undefined,
      // New bookings land on the calendar being viewed — booking into the
      // calendar you are looking at is the only behaviour that isn't a
      // surprise. Editing leaves the existing calendar alone.
      ...(isEditing ? {} : { calendar_id: activeCalendar?.id ?? null }),
    };

    try {
      setSaving(true);
      const saved = isEditing
        ? await updateAppointment(appointment!.id, payload)
        : await createAppointment(payload);
      onSaved(saved);
      toast.success(isEditing ? t('calendar.appointment.updated') : t('calendar.appointment.created'));
      onClose();
    } catch (err: any) {
      const apiError = err?.response?.data?.errors
        ? (Object.values(err.response.data.errors).flat()[0] as string)
        : t('calendar.appointment.save-failed');
      toast.error(apiError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;
    try {
      setDeleting(true);
      await deleteAppointment(appointment.id);
      onDeleted(appointment.id);
      toast.success(t('calendar.appointment.deleted'));
      setConfirmDelete(false);
      onClose();
    } catch {
      toast.error(t('calendar.appointment.delete-failed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {isEditing ? t('calendar.appointment.edit') : t('calendar.appointment.new')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ap-title">{t('calendar.appointment.title')}</Label>
              <Input
                id="ap-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('calendar.appointment.title-placeholder')}
                autoFocus
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ap-start">{t('calendar.appointment.start')}</Label>
                <Input id="ap-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ap-end">{t('calendar.appointment.end')}</Label>
                <Input id="ap-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('calendar.appointment.type')}</Label>
                <Select value={typeId} onValueChange={setTypeId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('calendar.appointment.no-type')}</SelectItem>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('calendar.appointment.status')}</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Appointment['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{t(`appointments.status-${s.replace('_', '-')}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ap-notes">{t('calendar.appointment.notes')}</Label>
              <textarea
                id="ap-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input-border bg-input-bg px-3 py-2 text-sm text-foreground placeholder:text-input-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              />
            </div>

            {/* Read-only: the lead link is set from the lead's own screen.
                Absent for the many appointments that have no lead at all. */}
            {leadName && (
              <div className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-2 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{t('calendar.appointment.linked-lead')}</span>
                <span className="font-medium text-foreground">{leadName}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {isEditing ? (
              <Button variant="ghost-destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 />
                {t('common.delete')}
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
              <Button onClick={handleSave} loading={saving}>{t('common.save')}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('calendar.appointment.delete-title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('calendar.appointment.delete-description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AppointmentModal;
