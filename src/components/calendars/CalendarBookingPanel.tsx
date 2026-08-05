/**
 * BOOKING CONFIGURATION
 *
 * Everything about a calendar's public page, reached from the calendar manager
 * rather than a settings area — the point of the Calendar module owning this is
 * that nobody has to leave the screen they are scheduling on.
 *
 * Four tabs, in the order someone actually works through them: turn it on and
 * get the link, decide when you are bookable, decide what you ask for, then
 * decide what it looks like. Saving is explicit — a booking page is public, and
 * autosaving half-typed copy onto a live URL would be the wrong default.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Check, Copy, ExternalLink, Loader2, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar } from '@/services/calendarApi';
import { WidgetOptions, fetchWidgetOptions } from '@/services/widgetApi';
import { AppointmentType, getAppointmentTypes } from '@/services/appointmentTypeApi';
import {
  BookingField, BookingSettings, bookingConfigService, bookingPageUrl,
} from '@/services/bookingApi';
import { cn } from '@/lib/utils';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/**
 * Radix Select cannot hold an empty string as an item value, so "nothing
 * chosen" needs a sentinel — the same trick the widget builder uses.
 */
const NONE = '__none__';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  calendar: Calendar | null;
}

const CalendarBookingPanel: React.FC<Props> = ({ isOpen, onClose, calendar }) => {
  const { t } = useLanguage();

  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Funnels, stages and users come from the widget options endpoint — the
  // booking page maps a lead exactly the way a form widget does, so it reads
  // the same list rather than growing a parallel one.
  const [options, setOptions] = useState<WidgetOptions | null>(null);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    void fetchWidgetOptions().then(setOptions).catch(() => setOptions(null));
    void getAppointmentTypes().then(setAppointmentTypes).catch(() => setAppointmentTypes([]));
  }, [isOpen]);

  const load = useCallback(async () => {
    if (!calendar) return;
    setLoading(true);
    try {
      setSettings(await bookingConfigService.get(calendar.id));
    } catch {
      toast.error(t('booking.load-failed'));
    } finally {
      setLoading(false);
    }
  }, [calendar, t]);

  useEffect(() => {
    if (isOpen) void load();
  }, [isOpen, load]);

  /** Local edit; nothing reaches the public page until Save. */
  const patch = (changes: Partial<BookingSettings>) =>
    setSettings(prev => (prev ? { ...prev, ...changes } : prev));

  const save = async () => {
    if (!calendar || !settings) return;
    setSaving(true);
    try {
      const saved = await bookingConfigService.update(calendar.id, settings);
      setSettings(saved);
      toast.success(t('booking.saved'));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('booking.save-failed'));
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    if (!calendar) return;
    try {
      setSettings(await bookingConfigService.regenerateSlug(calendar.id));
      toast.success(t('booking.link-regenerated'));
    } catch {
      toast.error(t('booking.save-failed'));
    }
  };

  const copyLink = () => {
    if (!settings?.public_slug) return;
    void navigator.clipboard.writeText(bookingPageUrl(settings.public_slug)).then(() => {
      setCopied(true);
      toast.success(t('booking.link-copied'));
      setTimeout(() => setCopied(false), 1600);
    });
  };

  /** Toggling a weekday between closed and a default 9–5 window. */
  const toggleDay = (day: string, enabled: boolean) => {
    const hours = { ...(settings?.working_hours ?? {}) };
    hours[day] = enabled ? [{ start: '09:00', end: '17:00' }] : [];
    patch({ working_hours: hours });
  };

  const setWindow = (day: string, key: 'start' | 'end', value: string) => {
    const hours = { ...(settings?.working_hours ?? {}) };
    const windows = [...(hours[day] ?? [{ start: '09:00', end: '17:00' }])];
    windows[0] = { ...windows[0], [key]: value };
    hours[day] = windows;
    patch({ working_hours: hours });
  };

  /** Booking defaults are a JSON blob; patch a key without losing the rest. */
  const setDefault = (changes: Record<string, unknown>) =>
    patch({ booking_defaults: { ...(settings?.booking_defaults ?? {}), ...changes } });

  const defaults = settings?.booking_defaults ?? {};
  const selectedFunnel = options?.funnels.find(f => f.id === defaults.funnel_id) ?? null;
  const assignmentMode = defaults.assignment_mode ?? 'queue';

  const setField = (index: number, changes: Partial<BookingField>) => {
    const fields = [...(settings?.form_fields ?? [])];
    fields[index] = { ...fields[index], ...changes };
    patch({ form_fields: fields });
  };

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t('booking.title')}</SheetTitle>
          <SheetDescription>
            {t('booking.description').replace('{calendar}', calendar?.name ?? '')}
          </SheetDescription>
        </SheetHeader>

        {loading || !settings ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Tabs defaultValue="share" className="mt-4">
              <TabsList className="h-9">
                <TabsTrigger value="share" className="text-xs">{t('booking.tab-share')}</TabsTrigger>
                <TabsTrigger value="schedule" className="text-xs">{t('booking.tab-schedule')}</TabsTrigger>
                <TabsTrigger value="form" className="text-xs">{t('booking.tab-form')}</TabsTrigger>
                <TabsTrigger value="crm" className="text-xs">{t('booking.tab-crm')}</TabsTrigger>
                <TabsTrigger value="branding" className="text-xs">{t('booking.tab-branding')}</TabsTrigger>
              </TabsList>

              {/* ---- Share ---- */}
              <TabsContent value="share" className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium text-foreground">{t('booking.publish')}</p>
                    <p className="text-xs text-muted-foreground">{t('booking.publish-hint')}</p>
                  </div>
                  <Switch
                    checked={settings.is_published}
                    onCheckedChange={value => patch({ is_published: value })}
                  />
                </div>

                {settings.public_slug ? (
                  <div className="space-y-2">
                    <Label>{t('booking.public-url')}</Label>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={bookingPageUrl(settings.public_slug)} className="font-mono text-xs" />
                      <Button variant="outline" size="icon" onClick={copyLink} title={t('booking.copy-link')}>
                        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(bookingPageUrl(settings.public_slug!), '_blank')}
                        title={t('booking.preview')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Regenerating is destructive to links already shared. */}
                    <Button variant="ghost" size="sm" onClick={regenerate} className="text-xs">
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t('booking.regenerate')}
                    </Button>
                    <p className="text-xs text-muted-foreground">{t('booking.regenerate-hint')}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('booking.no-link-yet')}</p>
                )}
              </TabsContent>

              {/* ---- Scheduling rules ---- */}
              <TabsContent value="schedule" className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>{t('booking.availability-mode')}</Label>
                  <Select
                    value={settings.availability_mode}
                    onValueChange={value => patch({ availability_mode: value as 'smart' | 'open' })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[90]">
                      <SelectItem value="smart">{t('booking.mode-smart')}</SelectItem>
                      <SelectItem value="open">{t('booking.mode-open')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {settings.availability_mode === 'smart'
                      ? t('booking.mode-smart-hint')
                      : t('booking.mode-open-hint')}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField
                    label={t('booking.duration')} value={settings.slot_duration_minutes}
                    onChange={v => patch({ slot_duration_minutes: v })}
                  />
                  <NumberField
                    label={t('booking.increment')} value={settings.slot_increment_minutes}
                    onChange={v => patch({ slot_increment_minutes: v })}
                  />
                  <NumberField
                    label={t('booking.buffer-before')} value={settings.buffer_before_minutes}
                    onChange={v => patch({ buffer_before_minutes: v })}
                  />
                  <NumberField
                    label={t('booking.buffer-after')} value={settings.buffer_after_minutes}
                    onChange={v => patch({ buffer_after_minutes: v })}
                  />
                  <NumberField
                    label={t('booking.min-notice')} value={settings.min_notice_minutes}
                    onChange={v => patch({ min_notice_minutes: v })}
                  />
                  <NumberField
                    label={t('booking.max-advance')} value={settings.max_days_in_advance}
                    onChange={v => patch({ max_days_in_advance: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('booking.working-hours')}</Label>
                  {DAYS.map(day => {
                    const windows = settings.working_hours?.[day] ?? [];
                    const open = windows.length > 0;

                    return (
                      <div key={day} className="flex items-center gap-2">
                        <Switch checked={open} onCheckedChange={v => toggleDay(day, v)} />
                        <span className="w-10 text-xs uppercase text-muted-foreground">
                          {t(`booking.day.${day}`)}
                        </span>
                        <Input
                          type="time" disabled={!open}
                          value={windows[0]?.start ?? '09:00'}
                          onChange={e => setWindow(day, 'start', e.target.value)}
                          className="h-8 w-28 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <Input
                          type="time" disabled={!open}
                          value={windows[0]?.end ?? '17:00'}
                          onChange={e => setWindow(day, 'end', e.target.value)}
                          className="h-8 w-28 text-xs"
                        />
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* ---- Form ---- */}
              <TabsContent value="form" className="mt-4 space-y-3">
                <p className="text-xs text-muted-foreground">{t('booking.form-hint')}</p>

                {(settings.form_fields ?? []).map((field, index) => (
                  <div key={field.key} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <Input
                        value={field.label}
                        onChange={e => setField(index, { label: e.target.value })}
                        className="h-8 text-sm"
                      />
                      <div className="flex shrink-0 items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Switch
                            checked={!!field.required}
                            onCheckedChange={v => setField(index, { required: v })}
                          />
                          {t('booking.field-required')}
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Switch
                            checked={field.enabled !== false}
                            onCheckedChange={v => setField(index, { enabled: v })}
                          />
                          {t('booking.field-enabled')}
                        </label>
                      </div>
                    </div>
                    <Input
                      value={field.placeholder ?? ''}
                      onChange={e => setField(index, { placeholder: e.target.value })}
                      placeholder={t('booking.field-placeholder')}
                      className="mt-2 h-8 text-xs"
                    />
                  </div>
                ))}
              </TabsContent>

              {/* ---- CRM mapping ---- */}
              <TabsContent value="crm" className="mt-4 space-y-4">
                <p className="text-xs text-muted-foreground">{t('booking.crm-hint')}</p>

                <div className="space-y-1.5">
                  <Label>{t('booking.crm-funnel')}</Label>
                  <Select
                    value={defaults.funnel_id ? String(defaults.funnel_id) : NONE}
                    onValueChange={value =>
                      // Clearing the funnel clears the stage with it — a stage
                      // only means anything inside its own funnel.
                      setDefault({
                        funnel_id: value === NONE ? null : Number(value),
                        stage_id: null,
                      })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[90]">
                      <SelectItem value={NONE}>{t('booking.crm-no-funnel')}</SelectItem>
                      {(options?.funnels ?? []).map(funnel => (
                        <SelectItem key={funnel.id} value={String(funnel.id)}>{funnel.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t('booking.crm-no-funnel-hint')}</p>
                </div>

                <div className="space-y-1.5">
                  <Label>{t('booking.crm-stage')}</Label>
                  <Select
                    value={defaults.stage_id ? String(defaults.stage_id) : ''}
                    disabled={!selectedFunnel}
                    onValueChange={value => setDefault({ stage_id: Number(value) })}
                  >
                    <SelectTrigger><SelectValue placeholder={t('booking.crm-select-stage')} /></SelectTrigger>
                    <SelectContent className="z-[90]">
                      {(selectedFunnel?.stages ?? []).map(stage => (
                        <SelectItem key={stage.id} value={String(stage.id)}>{stage.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>{t('booking.crm-assignment')}</Label>
                  <Select
                    value={assignmentMode}
                    onValueChange={value => setDefault({
                      assignment_mode: value,
                      // A mode that is not "user" has no user to remember.
                      ...(value === 'user' ? {} : { assigned_user_id: null }),
                    })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[90]">
                      <SelectItem value="queue">{t('booking.crm-assign-queue')}</SelectItem>
                      <SelectItem value="user">{t('booking.crm-assign-user')}</SelectItem>
                      <SelectItem value="unassigned">{t('booking.crm-assign-none')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {assignmentMode === 'queue' ? t('booking.crm-assign-queue-hint')
                      : assignmentMode === 'user' ? t('booking.crm-assign-user-hint')
                        : t('booking.crm-assign-none-hint')}
                  </p>
                </div>

                {assignmentMode === 'user' && (
                  <div className="space-y-1.5">
                    <Label>{t('booking.crm-owner')}</Label>
                    <Select
                      value={defaults.assigned_user_id ? String(defaults.assigned_user_id) : ''}
                      onValueChange={value => setDefault({ assigned_user_id: Number(value) })}
                    >
                      <SelectTrigger><SelectValue placeholder={t('booking.crm-select-owner')} /></SelectTrigger>
                      <SelectContent className="z-[90]">
                        {(options?.users ?? []).map(user => (
                          <SelectItem key={user.id} value={String(user.id)}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>{t('booking.crm-appointment-type')}</Label>
                  <Select
                    value={defaults.appointment_type_id ? String(defaults.appointment_type_id) : NONE}
                    onValueChange={value => setDefault({
                      appointment_type_id: value === NONE ? null : Number(value),
                    })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[90]">
                      <SelectItem value={NONE}>{t('booking.crm-no-type')}</SelectItem>
                      {appointmentTypes.map(type => (
                        <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* ---- Branding and copy ---- */}
              <TabsContent value="branding" className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>{t('booking.page-title')}</Label>
                  <Input
                    value={settings.title ?? ''}
                    onChange={e => patch({ title: e.target.value })}
                    placeholder={calendar?.name}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('booking.page-subtitle')}</Label>
                  <Input
                    value={settings.subtitle ?? ''}
                    onChange={e => patch({ subtitle: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('booking.page-description')}</Label>
                  <Textarea
                    value={settings.description ?? ''}
                    onChange={e => patch({ description: e.target.value })}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t('booking.button-color')}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.branding?.button_color ?? calendar?.color ?? '#3B82F6'}
                      onChange={e => patch({ branding: { ...(settings.branding ?? {}), button_color: e.target.value } })}
                      className="h-9 w-14 cursor-pointer rounded border border-border bg-transparent"
                    />
                    <span className="text-xs text-muted-foreground">
                      {settings.branding?.button_color ?? calendar?.color ?? '#3B82F6'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>{t('booking.confirmation-title')}</Label>
                  <Input
                    value={settings.confirmation_title ?? ''}
                    onChange={e => patch({ confirmation_title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('booking.confirmation-message')}</Label>
                  <Textarea
                    value={settings.confirmation_message ?? ''}
                    onChange={e => patch({ confirmation_message: e.target.value })}
                    rows={3}
                    className="resize-none"
                  />
                </div>

              </TabsContent>
            </Tabs>

            <div className={cn('mt-6 flex items-center justify-end gap-2 border-t border-border pt-4')}>
              <Button variant="outline" onClick={onClose} disabled={saving}>{t('common.cancel')}</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

/** Minutes/days input. Empty is coerced to 0 so the field can be cleared. */
const NumberField = ({
  label, value, onChange,
}: { label: string; value: number; onChange: (value: number) => void }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    <Input
      type="number"
      min={0}
      value={value}
      onChange={e => onChange(Number(e.target.value) || 0)}
      className="h-8"
    />
  </div>
);

export default CalendarBookingPanel;
