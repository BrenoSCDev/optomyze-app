import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Edit2, Trash2, Clock, Loader2, CheckCircle2, XCircle, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Appointment, getLeadAppointments, deleteAppointment, updateAppointment } from '@/services/appointmentApi';
import { AppointmentType, getAppointmentTypes } from '@/services/appointmentTypeApi';
import ScheduleAppointmentModal from './ScheduleAppointmentModal';
import { format, parseISO, isPast } from 'date-fns';

interface Props {
  leadId: number;
  leadTimezone?: string | null;
}

const statusColors: Record<string, string> = {
  draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-muted text-muted-foreground border-border-strong',
  no_show: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const LeadAppointmentsTab = ({ leadId, leadTimezone }: Props) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [appts, apptTypes] = await Promise.all([
        getLeadAppointments(leadId),
        getAppointmentTypes(),
      ]);
      setAppointments(appts);
      setTypes(apptTypes);
    } catch {
      toast({ title: t('common.error'), description: t('appointments.load-error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [leadId, t, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaved = (appointment: Appointment) => {
    setAppointments(prev => {
      const exists = prev.find(a => a.id === appointment.id);
      if (exists) return prev.map(a => a.id === appointment.id ? appointment : a);
      return [...prev, appointment].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    });
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteAppointment(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
      toast({ title: t('common.success'), description: t('appointments.deleted') });
    } catch {
      toast({ title: t('common.error'), description: t('appointments.delete-error'), variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleQuickStatusChange = async (appt: Appointment, status: Appointment['status']) => {
    setUpdatingId(appt.id);
    try {
      const updated = await updateAppointment(appt.id, { status });
      handleSaved(updated);
    } catch {
      toast({ title: t('common.error'), description: t('appointments.save-error'), variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const upcoming = appointments.filter(a => (a.status === 'scheduled' || a.status === 'draft') && !isPast(parseISO(a.scheduled_at)));
  const past = appointments.filter(a => (a.status !== 'scheduled' && a.status !== 'draft') || isPast(parseISO(a.scheduled_at)));

  const formatDate = (iso: string, tz: string) => {
    try { return format(parseISO(iso), 'MMM d, yyyy h:mm a') + ` (${tz})`; }
    catch { return iso; }
  };

  const renderList = (items: Appointment[]) => (
    <div className="space-y-2">
      {items.map(appt => {
        const type = types.find(t => t.id === appt.appointment_type_id);
        return (
          <div key={appt.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background/50 hover:bg-muted/30 transition-colors">
            <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: type?.color ?? '#64748b' }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground truncate">{appt.title}</p>
                {type && <span className="text-xs text-muted-foreground">({type.name})</span>}
                <Badge className={`text-[10px] px-1.5 py-0 border ${statusColors[appt.status] || ''}`}>
                  {t(`appointments.status-${appt.status.replace('_', '-')}`)}
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatDate(appt.scheduled_at, appt.timezone)}</span>
              </div>
              {appt.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{appt.notes}</p>}

              {/* Quick status actions */}
              {(appt.status === 'draft' || appt.status === 'scheduled') && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {appt.status === 'draft' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[11px]"
                      disabled={updatingId === appt.id}
                      onClick={() => handleQuickStatusChange(appt, 'scheduled')}
                    >
                      <CheckCircle2 className="w-3 h-3" />{t('appointments.confirm-schedule')}
                    </Button>
                  )}
                  {appt.status === 'scheduled' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        disabled={updatingId === appt.id}
                        onClick={() => handleQuickStatusChange(appt, 'completed')}
                      >
                        <CheckCircle2 className="w-3 h-3" />{t('appointments.mark-completed')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        disabled={updatingId === appt.id}
                        onClick={() => handleQuickStatusChange(appt, 'cancelled')}
                      >
                        <XCircle className="w-3 h-3" />{t('appointments.mark-cancelled')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        disabled={updatingId === appt.id}
                        onClick={() => handleQuickStatusChange(appt, 'no_show')}
                      >
                        <UserX className="w-3 h-3" />{t('appointments.mark-no-show')}
                      </Button>
                    </>
                  )}
                  {updatingId === appt.id && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => handleEdit(appt)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(appt.id)}
                disabled={deletingId === appt.id}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                {deletingId === appt.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{t('appointments.tab-title')}</span>
          {appointments.length > 0 && (
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">{appointments.length}</Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => { setEditingAppointment(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" />{t('appointments.schedule-btn')}
        </Button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t('appointments.none')}</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('appointments.upcoming')}</p>
              {renderList(upcoming)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('appointments.past')}</p>
              {renderList(past)}
            </div>
          )}
        </>
      )}

      <ScheduleAppointmentModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAppointment(null); }}
        leadId={leadId}
        leadTimezone={leadTimezone}
        appointmentTypes={types}
        appointment={editingAppointment}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default LeadAppointmentsTab;
