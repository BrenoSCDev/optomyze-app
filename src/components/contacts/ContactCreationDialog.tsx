/**
 * CONTACT CREATION DIALOG
 *
 * Creates a contact from the Contacts page.
 *
 * Deliberately not LeadCreationDialog: that one is opened from a funnel board
 * column and requires a stage, because the lead it makes is going onto that
 * board. A contact has no board — pipeline membership is a separate, optional
 * step (the "add to funnel" row action), so nothing here asks for one.
 */

import React, { useEffect, useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import InputMask from 'react-input-mask';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { leadService } from '@/services/leadApi';
import { toast } from 'sonner';
import SourcePlatformIcon from '@/components/leads/SourcePlatformIcon';
import { ddiOptions, phoneMasks, combinePhoneNumber, DEFAULT_DDI } from '@/lib/phone';

/** Same set the create-lead dialog offers; Meta/Google Ads are not sources. */
const PLATFORM_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Website' },
  { value: 'api', label: 'API' },
  { value: 'other', label: 'Other' },
];

const selectClasses =
  'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors';

interface ContactCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful create, so the list can reload. */
  onCreated: () => void;
}

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  ddi: DEFAULT_DDI,
  source_platform: 'other',
};

const ContactCreationDialog: React.FC<ContactCreationDialogProps> = ({ isOpen, onClose, onCreated }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // A dialog kept mounted between opens would otherwise show the previous
  // contact's details.
  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm);
      setErrors({});
    }
  }, [isOpen]);

  const set = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  /**
   * A contact needs a name and at least one way to reach them. Everything
   * else is optional — the point of the Contacts page is that a record can
   * exist before it is complete.
   */
  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!form.first_name.trim()) {
      next.first_name = t('lead.required-field');
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = t('lead.valid-email');
    }

    if (!form.email.trim() && !form.phone.trim()) {
      next.email = t('contacts.create-need-contact');
      next.phone = t('contacts.create-need-contact');
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      const { ddi, phone, ...rest } = form;

      await leadService.createLead({
        ...rest,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim() || null,
        phone: phone.trim() ? combinePhoneNumber(ddi, phone) : null,
        source_type: 'manual',
        // The server takes the company from the session; sent only because
        // the shared validation rules still expect the key.
        company_id: user?.company_id,
      });

      toast.success(t('contacts.create-done'));
      onCreated();
      onClose();
    } catch (error: any) {
      if (error.response?.status === 422) {
        const serverErrors = error.response.data?.errors || {};
        setErrors(Object.fromEntries(
          Object.entries(serverErrors).map(([key, messages]: [string, any]) => [key, messages[0]])
        ));
        return;
      }

      toast.error(t('contacts.create-failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="rounded-lg bg-primary p-2">
              <UserPlus className="h-5 w-5 text-primary-foreground" />
            </span>
            {t('contacts.new')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-first-name">{t('lead.first-name')} *</Label>
              <Input
                id="contact-first-name"
                value={form.first_name}
                onChange={(e) => set('first_name', e.target.value)}
                className={cn(errors.first_name && 'border-destructive')}
                disabled={submitting}
                autoFocus
              />
              {errors.first_name && <p className="text-sm text-destructive">{errors.first_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-last-name">{t('lead.last-name')}</Label>
              <Input
                id="contact-last-name"
                value={form.last_name}
                onChange={(e) => set('last_name', e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">{t('lead.email-address')}</Label>
            <Input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className={cn(errors.email && 'border-destructive')}
              disabled={submitting}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="contact-ddi">{t('lead.country-code')}</Label>
              <select
                id="contact-ddi"
                value={form.ddi}
                onChange={(e) => { set('ddi', e.target.value); set('phone', ''); }}
                className={selectClasses}
                disabled={submitting}
              >
                {ddiOptions.map((option, index) => (
                  <option key={index} value={option.value}>
                    {option.flag} {option.label} ({option.country})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="contact-phone">{t('lead.phone-number')}</Label>
              <InputMask
                id="contact-phone"
                mask={phoneMasks[form.ddi] || '999999999999'}
                value={form.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('phone', e.target.value)}
                disabled={submitting}
                className={cn(
                  'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors',
                  errors.phone && 'border-destructive'
                )}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-source">{t('lead.source-platform')}</Label>
            <Select
              value={form.source_platform}
              onValueChange={(value) => set('source_platform', value)}
              disabled={submitting}
            >
              <SelectTrigger id="contact-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <SourcePlatformIcon source={option.value} className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" />{t('contacts.creating')}</>
                : <><UserPlus className="h-4 w-4" />{t('contacts.create')}</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactCreationDialog;
