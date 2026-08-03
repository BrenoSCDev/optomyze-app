/**
 * CALENDAR FORM
 *
 * Create and edit, in one dialog — the fields are identical and splitting them
 * would mean two places to update when calendars gain settings.
 *
 * Only the fields that do something today are shown. Visibility and type are
 * stored and honoured by the API; external sync and booking are deliberately
 * surfaced as disabled affordances so the shape of what is coming is visible
 * without pretending it works.
 */

import { useEffect, useState } from 'react';
import { CalendarClock, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCalendars } from '@/contexts/CalendarsContext';
import { Calendar, CalendarType, CalendarVisibility } from '@/services/calendarApi';
import { cn } from '@/lib/utils';

/** Matched to the palette funnels and tags already draw from. */
const COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#14B8A6', '#6B7280',
];

const TYPES: CalendarType[] = ['company', 'team', 'user', 'resource', 'custom'];
const VISIBILITIES: CalendarVisibility[] = ['company', 'team', 'private'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Null creates; a calendar edits it. */
  calendar: Calendar | null;
}

const CalendarFormDialog: React.FC<Props> = ({ isOpen, onClose, calendar }) => {
  const { t } = useLanguage();
  const { create, update } = useCalendars();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [type, setType] = useState<CalendarType>('custom');
  const [visibility, setVisibility] = useState<CalendarVisibility>('company');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(calendar?.name ?? '');
    setDescription(calendar?.description ?? '');
    setColor(calendar?.color ?? COLORS[0]);
    setType(calendar?.type ?? 'custom');
    setVisibility(calendar?.visibility ?? 'company');
  }, [isOpen, calendar]);

  const submit = async () => {
    if (!name.trim()) return;

    try {
      setSaving(true);
      const payload = { name: name.trim(), description: description.trim() || null, color, type, visibility };

      if (calendar) {
        await update(calendar.id, payload);
        toast.success(t('calendars.updated'));
      } else {
        await create(payload);
        toast.success(t('calendars.created'));
      }
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('calendars.save-failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{calendar ? t('calendars.edit') : t('calendars.create')}</DialogTitle>
          <DialogDescription>{t('calendars.form-description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="calendar-name">{t('calendars.field-name')}</Label>
            <Input
              id="calendar-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('calendars.name-placeholder')}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="calendar-description">{t('calendars.field-description')}</Label>
            <Textarea
              id="calendar-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('calendars.field-color')}</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  aria-label={option}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-transform',
                    color === option ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: option }}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('calendars.field-type')}</Label>
              <Select value={type} onValueChange={v => setType(v as CalendarType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[90]">
                  {TYPES.map(option => (
                    <SelectItem key={option} value={option}>{t(`calendars.type.${option}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t('calendars.field-visibility')}</Label>
              <Select value={visibility} onValueChange={v => setVisibility(v as CalendarVisibility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[90]">
                  {VISIBILITIES.map(option => (
                    <SelectItem key={option} value={option}>{t(`calendars.visibility.${option}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shown, not pretended: both are stored per calendar on the API and
              have no UI yet. Better to say so than to hide the roadmap. */}
          <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              {t('calendars.sync-coming-soon')}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              {t('calendars.booking-coming-soon')}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t('common.cancel')}</Button>
          <Button onClick={submit} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarFormDialog;
