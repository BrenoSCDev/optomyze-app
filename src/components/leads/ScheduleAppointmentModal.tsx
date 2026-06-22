import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X, Package, Search } from 'lucide-react';
import { AppointmentType } from '@/services/appointmentTypeApi';
import { Appointment, AppointmentProduct, CreateAppointmentPayload, createAppointment, updateAppointment } from '@/services/appointmentApi';
import { Product, getProducts } from '@/services/productApi';
import { useCompanyTimezone } from '@/hooks/useCompanyTimezone';
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
  try {
    // Normalize space-format ("2026-03-30 10:30:00") to ISO before parsing
    return format(parseISO(iso.replace(' ', 'T')), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return iso.replace(' ', 'T').substring(0, 16);
  }
};

const ScheduleAppointmentModal = ({ isOpen, onClose, leadId, leadTimezone, appointmentTypes, appointment, onSaved }: Props) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const isEdit = !!appointment;
  const companyTimezone = useCompanyTimezone();
  const defaultTimezone = leadTimezone || companyTimezone || 'America/New_York';

  const [typeId, setTypeId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [showTimezoneResults, setShowTimezoneResults] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'completed' | 'cancelled' | 'no_show'>('draft');
  const [saving, setSaving] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState<AppointmentProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (appointment) {
      setTypeId(appointment.appointment_type_id?.toString() ?? '');
      setTitle(appointment.title);
      setScheduledAt(toDatetimeLocal(appointment.scheduled_at));
      setEndAt(appointment.end_at ? toDatetimeLocal(appointment.end_at) : '');
      setTimezone(appointment.timezone || defaultTimezone);
      setNotes(appointment.notes ?? '');
      setStatus(appointment.status);
      setSelectedProducts(appointment.products ?? []);
    } else {
      setTypeId(appointmentTypes.find(t => t.is_active)?.id.toString() ?? '');
      setTitle('');
      // Default to tomorrow at 10:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setScheduledAt(format(tomorrow, "yyyy-MM-dd'T'HH:mm"));
      setEndAt('');
      setTimezone(defaultTimezone);
      setNotes('');
      setStatus('draft');
      setSelectedProducts([]);
    }
    setTimezoneSearch('');
    setShowTimezoneResults(false);
    setProductSearch('');
    setSearchResults([]);
    setShowResults(false);
  }, [appointment, isOpen, defaultTimezone, appointmentTypes]);

  const handleProductSearch = useCallback((query: string) => {
    setProductSearch(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await getProducts({ search: query, is_active: true, per_page: 8 });
        const alreadySelected = new Set(selectedProducts.map(p => p.id));
        setSearchResults(res.data.filter(p => !alreadySelected.has(p.id)));
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [selectedProducts]);

  const addProduct = (product: Product) => {
    setSelectedProducts(prev => [...prev, {
      id: product.id,
      name: product.name,
      sku: product.sku,
      base_price: String(product.base_price),
      type: product.type,
    }]);
    setProductSearch('');
    setSearchResults([]);
    setShowResults(false);
  };

  const removeProduct = (id: number) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== id));
  };

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
        scheduled_at: scheduledAt,  // wall-clock time in the appointment's timezone, no UTC conversion
        end_at: endAt || undefined,
        timezone,
        notes: notes.trim() || undefined,
        status,
        lead_timezone: timezone,
        product_ids: selectedProducts.map(p => p.id),
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

          {/* Timezone (searchable) */}
          <div className="space-y-1">
            <Label>{t('appointments.timezone')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={showTimezoneResults ? timezoneSearch : timezone}
                onChange={e => { setTimezoneSearch(e.target.value); setShowTimezoneResults(true); }}
                onFocus={() => { setTimezoneSearch(''); setShowTimezoneResults(true); }}
                onBlur={() => setTimeout(() => setShowTimezoneResults(false), 150)}
              />
              {showTimezoneResults && (
                <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                  {TIMEZONES.filter(tz => tz.toLowerCase().includes(timezoneSearch.toLowerCase())).map(tz => (
                    <button
                      key={tz}
                      type="button"
                      onMouseDown={() => { setTimezone(tz); setShowTimezoneResults(false); }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-accent"
                    >
                      {tz}
                    </button>
                  ))}
                  {TIMEZONES.filter(tz => tz.toLowerCase().includes(timezoneSearch.toLowerCase())).length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">{t('appointments.no-timezone-match')}</div>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t('appointments.timezone-hint')}</p>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>{t('appointments.status')}</Label>
            <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t('appointments.status-draft')}</SelectItem>
                <SelectItem value="scheduled">{t('appointments.status-scheduled')}</SelectItem>
                <SelectItem value="completed">{t('appointments.status-completed')}</SelectItem>
                <SelectItem value="cancelled">{t('appointments.status-cancelled')}</SelectItem>
                <SelectItem value="no_show">{t('appointments.status-no-show')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label>{t('appointments.notes')}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('appointments.notes-placeholder')} rows={3} className="resize-none" />
          </div>

          {/* Products */}
          <div className="space-y-2">
            <Label>Products</Label>

            {/* Selected product chips */}
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedProducts.map(p => (
                  <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1 font-medium">
                    <Package className="w-3 h-3" />
                    {p.name}
                    <button type="button" onClick={() => removeProduct(p.id)} className="ml-0.5 hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search input with dropdown */}
            <div className="relative">
              <Input
                value={productSearch}
                onChange={e => handleProductSearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="Search products..."
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={() => addProduct(p)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent text-left"
                    >
                      <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.sku} · ${Number(p.base_price).toFixed(2)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showResults && !searchLoading && searchResults.length === 0 && productSearch.trim() && (
                <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md px-3 py-2 text-sm text-muted-foreground">
                  No products found.
                </div>
              )}
            </div>
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
