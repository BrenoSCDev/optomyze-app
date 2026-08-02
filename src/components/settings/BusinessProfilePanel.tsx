/**
 * BUSINESS PROFILE
 *
 * Lets an admin/manager edit their own company's details and logo.
 *
 * Commercial fields (subscription plan, product module) and the internal
 * settings JSON are intentionally absent — the API doesn't return them and
 * won't accept them, so there is nothing to render here.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, Check, ImagePlus, Loader2, Search, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePrivateFile } from '@/hooks/usePrivateFile';
import { TIMEZONES, timezoneCityLabel, timezoneOffsetLabel } from '@/lib/timezones';
import { cn } from '@/lib/utils';
import {
  BusinessProfile,
  BusinessProfilePayload,
  deleteBusinessLogo,
  fetchBusinessProfile,
  updateBusinessProfile,
  uploadBusinessLogo,
} from '@/services/businessProfileApi';

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // matches the API's max:2048

const BusinessProfilePanel: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAgent = user?.role?.toLowerCase() === 'agent';

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [form, setForm] = useState<BusinessProfilePayload>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tzSearch, setTzSearch] = useState('');
  const [tzOpen, setTzOpen] = useState(false);
  const tzRef = useRef<HTMLDivElement>(null);

  const logoUrl = usePrivateFile(profile?.logo_path);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchBusinessProfile();
      setProfile(data);
      setForm({
        name: data.name ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        website: data.website ?? '',
        timezone: data.timezone ?? '',
      });
    } catch {
      toast.error(t('business-profile.load-failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!tzOpen) return;
    const onDown = (e: MouseEvent) => {
      if (tzRef.current && !tzRef.current.contains(e.target as Node)) setTzOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [tzOpen]);

  const visibleTimezones = TIMEZONES.filter(tz =>
    tz.toLowerCase().includes(tzSearch.trim().toLowerCase())
  ).slice(0, 200);

  const setField = (key: keyof BusinessProfilePayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast.error(t('business-profile.name-required'));
      return;
    }
    try {
      setSaving(true);
      const updated = await updateBusinessProfile({
        name: form.name?.trim(),
        email: form.email?.trim(),
        phone: form.phone?.trim() || null,
        website: form.website?.trim() || null,
        timezone: form.timezone || null,
      } as BusinessProfilePayload);
      setProfile(updated);
      toast.success(t('business-profile.saved'));
    } catch (err: any) {
      // Surface the field error the API returns (e.g. duplicate email)
      const apiError = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0] as string
        : t('business-profile.save-failed');
      toast.error(apiError);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;

    if (file.size > MAX_LOGO_BYTES) {
      toast.error(t('business-profile.logo-too-large'));
      return;
    }

    try {
      setLogoBusy(true);
      setProfile(await uploadBusinessLogo(file));
      toast.success(t('business-profile.logo-updated'));
    } catch {
      toast.error(t('business-profile.logo-failed'));
    } finally {
      setLogoBusy(false);
    }
  };

  const handleLogoRemove = async () => {
    try {
      setLogoBusy(true);
      setProfile(await deleteBusinessLogo());
      toast.success(t('business-profile.logo-removed'));
    } catch {
      toast.error(t('business-profile.logo-failed'));
    } finally {
      setLogoBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('business-profile.title')}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('business-profile.description')}</p>
        </div>
      </div>

      {/* Logo */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">{t('business-profile.logo')}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('business-profile.logo-hint')}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-2">
            {logoUrl ? (
              <img src={logoUrl} alt={profile?.name ?? ''} className="h-full w-full object-contain" />
            ) : (
              <Building2 className="h-7 w-7 text-muted-foreground" />
            )}
          </div>

          {!isAgent && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoPick}
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} loading={logoBusy}>
                {!logoBusy && <ImagePlus />}
                {profile?.logo_path ? t('business-profile.replace-logo') : t('business-profile.upload-logo')}
              </Button>
              {profile?.logo_path && (
                <Button variant="ghost-destructive" size="sm" onClick={handleLogoRemove} disabled={logoBusy}>
                  <Trash2 />
                  {t('common.remove')}
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Company details */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">{t('business-profile.details')}</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bp-name">{t('business-profile.name')}</Label>
            <Input id="bp-name" value={form.name ?? ''} onChange={setField('name')} disabled={isAgent} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bp-email">{t('business-profile.email')}</Label>
            <Input id="bp-email" type="email" value={form.email ?? ''} onChange={setField('email')} disabled={isAgent} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bp-phone">{t('business-profile.phone')}</Label>
            <Input id="bp-phone" value={form.phone ?? ''} onChange={setField('phone')} disabled={isAgent} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bp-website">{t('business-profile.website')}</Label>
            <Input id="bp-website" placeholder="https://" value={form.website ?? ''} onChange={setField('website')} disabled={isAgent} />
          </div>

          {/* Searchable picker rather than a plain select: the full IANA list
              runs to several hundred entries. */}
          <div className="space-y-1.5 sm:col-span-2" ref={tzRef}>
            <Label htmlFor="bp-timezone">{t('business-profile.timezone')}</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="bp-timezone"
                className="pl-8"
                autoComplete="off"
                disabled={isAgent}
                placeholder={t('business-profile.timezone-placeholder')}
                value={tzOpen ? tzSearch : (form.timezone || '')}
                onFocus={() => { if (!isAgent) { setTzSearch(''); setTzOpen(true); } }}
                onChange={(e) => { setTzSearch(e.target.value); setTzOpen(true); }}
              />
              {form.timezone && !tzOpen && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {timezoneOffsetLabel(form.timezone)}
                </span>
              )}

              {tzOpen && (
                <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-elevation-lg">
                  {visibleTimezones.map((tz) => (
                    <button
                      key={tz}
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, timezone: tz }));
                        setTzOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors duration-fast ease-standard hover:bg-surface-3',
                        form.timezone === tz && 'bg-surface-3'
                      )}
                    >
                      <span className="min-w-0 truncate">
                        <span className="text-foreground">{timezoneCityLabel(tz)}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{tz}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        {timezoneOffsetLabel(tz)}
                        {form.timezone === tz && <Check className="h-3.5 w-3.5 text-primary" />}
                      </span>
                    </button>
                  ))}
                  {visibleTimezones.length === 0 && (
                    <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                      {t('business-profile.timezone-none')}
                    </p>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t('business-profile.timezone-hint')}</p>
          </div>
        </div>

        {isAgent ? (
          <p className="mt-4 text-xs text-muted-foreground">{t('business-profile.read-only')}</p>
        ) : (
          <div className="mt-5 flex justify-end">
            <Button onClick={handleSave} loading={saving}>
              {!saving && <Save />}
              {t('common.save')}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default BusinessProfilePanel;
