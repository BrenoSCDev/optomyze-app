import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AppointmentType } from '@/services/appointmentTypeApi';
import { Appointment, CreateAppointmentPayload, createAppointment, updateAppointment } from '@/services/appointmentApi';
import { format, addMinutes, parseISO } from 'date-fns';

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
  'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'America/Buenos_Aires',
  'America/Mexico_City', 'America/Bogota', 'America/Lima',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Warsaw', 'Europe/Istanbul',
  'Europe/Moscow', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Australia/Sydney', 'Pacific/Auckland', 'UTC',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  leadTimezone?: string | null;
  appointmentTypes: AppointmentType[];
  appointment?: Appointment | null;
  onSaved: (appointment: Appointment) => void;
}

const toDatetimeLocal = (iso: string) => {
  try { return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm"); } catch { return ''; }
};

const ScheduleAppointmentModal = ({ isOpen, onClose, leadId, leadTimezone, appointmentTypes, appointment, onSaved }: Props) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const isEdit = !!appointment;

  const [typeId, setTypeId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [timezone, setTimezone] = useState(leadTimezone || 'America/New_York');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'scheduled' | 'completed' | 'cancelled' | 'no_show'>('scheduled');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointment) {
      setTypeId(appointment.appointment_type_id?.toString() ?? '');
      setTitle(appointment.title);
      setScheduledAt(toDatetimeLocal(appointment.scheduled_at));
      setEndAt(appointment.end_at ? toDatetimeLocal(appointment.end_at) : '');
      setTimezone(appointment.timezone || leadTimezone || 'America/New_York');
      setNotes(appointment.notes ?? '');
      setStatus(appointment.status);
    } else {
      setTypeId(appointmentTypes.find(t => t.is_active)?.id.toString() ?? '');
      setTitle('');
      // Default to tomorrow at 10:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setScheduledAt(format(tomorrow, "yyyy-MM-dd'T'HH:mm"));
      setEndAt('');
      setTimezone(leadTimezone || 'America/New_York');
      setNotes('');
      setStatus('scheduled');
    }
  }, [appointment, isOpen, leadTimezone, appointmentTypes]);

  // Auto-calculate end_at when type changes
  const handleTypeChange = (val: string) => {
    setTypeId(val === 'none' ? '' : val);
    if (scheduledAt && val && val !== 'none') {
      const type = appointmentTypes.find(t => t.id.toString() === val);
      if (type && scheduledAt) {
        try {
          const start = new Date(scheduledAt);
          const end = addMinutes(start, type.duration_minutes);
          setEndAt(format(end, "yyyy-MM-dd'T'HH:mm"));
        } catch {}
      }
    }
  };

  const handleScheduledChange = (val: string) => {
    setScheduledAt(val);
    if (val && typeId) {
      const type = appointmentTypes.find(t => t.id.toString() === typeId);
      if (type) {
        try {
          const start = new Date(val);
          const end = addMinutes(start, type.duration_minutes);
          setEndAt(format(end, "yyyy-MM-dd'T'HH:mm"));
        } catch {}
      }
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !scheduledAt) {
      toast({ title: t('common.error'), description: t('appointments.validation-required'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: CreateAppointmentPayload = {
        lead_id: leadId,
        appointment_type_id: typeId ? Number(typeId) : null,
        title: title.trim(),
        scheduled_at: new Date(scheduledAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : undefined,
        timezone,
        notes: notes.trim() || undefined,
        status,
        lead_timezone: timezone,
      };
      const result = isEdit
        ? await updateAppointment(appointment!.id, payload)
        : await createAppointment(payload);
      toast({ title: t('common.success'), description: isEdit ? t('appointments.updated') : t('appointments.created') });
      onSaved(result);
      onClose();
    } catch {
      toast({ title: t('common.error'), description: t('appointments.save-error'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('appointments.edit-title') : t('appointments.schedule-title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Appointment Type */}
          <div className="space-y-1">
            <Label>{t('appointments.type')}</Label>
            <Select value={typeId || 'none'} onValueChange={handleTypeChange}>
              <SelectTrigger><SelectValue placeholder={t('appointments.select-type')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('appointments.no-type')}</SelectItem>
                {appointmentTypes.filter(t => t.is_active).map(type => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: type.color }} />
                      {type.name} ({type.duration_minutes} min)
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label>{t('appointments.title')} *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('appointments.title-placeholder')} />
          </div>

          {/* Date/Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('appointments.scheduled-at')} *</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={e => handleScheduledChange(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('appointments.end-at')}</Label>
              <Input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} />
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-1">
            <Label>{t('appointments.timezone')}</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-60">
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t('appointments.timezone-hint')}</p>
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div className="space-y-1">
              <Label>{t('appointments.status')}</Label>
              <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">{t('appointments.status-scheduled')}</SelectItem>
                  <SelectItem value="completed">{t('appointments.status-completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('appointments.status-cancelled')}</SelectItem>
                  <SelectItem value="no_show">{t('appointments.status-no-show')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label>{t('appointments.notes')}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('appointments.notes-placeholder')} rows={3} className="resize-none" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.saving')}</> : isEdit ? t('common.update') : t('appointments.schedule-btn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleAppointmentModal;
