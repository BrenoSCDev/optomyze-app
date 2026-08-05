/**
 * PUBLIC BOOKING PAGE
 *
 * What a prospect sees at /book/:slug. Deliberately outside the CRM shell — no
 * sidebar, no auth, no app chrome — while still using the design system's
 * tokens so a booked meeting feels like it came from the same product.
 *
 * Four steps on one route: pick a date, pick a time, fill the form, done. The
 * step lives in component state rather than the URL because a half-finished
 * booking is not something anyone should be able to bookmark or share.
 *
 * Every colour comes from the page's own branding, applied as inline styles
 * rather than classes — the values are arbitrary hex from a database, which
 * Tailwind cannot compile ahead of time.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Globe, Loader2,
  Moon, Sun,
} from 'lucide-react';
import optomyzeLogo from '@/assets/optomyze.png';
import optomyzeLogoLight from '@/assets/optomyze-light.png';
import {
  BookingConfirmation, BookingField, PublicBookingPage, publicBookingService, resolveMediaUrl,
} from '@/services/bookingApi';

/* ---------- date helpers, local to keep the page dependency-free ---------- */

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
const addMonths = (d: Date, n: number) => { const c = new Date(d); c.setMonth(c.getMonth() + n); return c; };
const startOfWeek = (d: Date) => addDays(startOfDay(d), -d.getDay());
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const isSameDay = (a: Date, b: Date) => iso(a) === iso(b);

type Step = 'date' | 'form' | 'done';
type Theme = 'light' | 'dark';

/**
 * The visitor's own colour scheme.
 *
 * Deliberately separate from the CRM's theme, which is a server-backed user
 * preference — a prospect has no account to store one against. It lives in
 * localStorage under its own key, falls back to the operating system setting,
 * and `ThemeProvider` stands down on public routes so the two never fight.
 */
const THEME_KEY = 'optomyze_booking_theme';

const readTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch { /* private mode — fall through to the OS preference */ }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const PublicBooking = () => {
  const { slug = '' } = useParams();

  const [page, setPage] = useState<PublicBookingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [days, setDays] = useState<Record<string, string[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [step, setStep] = useState<Step>('date');
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    // The same `dark` class the CRM's design tokens key off, so every token on
    // this page resolves without a parallel palette.
    document.documentElement.classList.toggle('dark', theme === 'dark');

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch { /* the choice just won't outlive the tab */ }
  }, [theme]);

  /* ---------- load the page ---------- */

  useEffect(() => {
    let cancelled = false;

    publicBookingService.page(slug)
      .then(data => { if (!cancelled) setPage(data); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug]);

  /* ---------- load a month of availability at a time ---------- */

  const gridDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    return Array.from({ length: 42 }, (_, i) => addDays(startOfWeek(first), i));
  }, [cursor]);

  useEffect(() => {
    if (!page) return;

    let cancelled = false;
    setLoadingSlots(true);

    // The whole visible grid in one request, so closed days are greyed out
    // immediately instead of being discovered one click at a time.
    publicBookingService.availability(slug, iso(gridDays[0]), iso(gridDays[gridDays.length - 1]))
      .then(data => { if (!cancelled) setDays(data.days); })
      .catch(() => { if (!cancelled) setDays({}); })
      .finally(() => { if (!cancelled) setLoadingSlots(false); });

    return () => { cancelled = true; };
  }, [page, slug, gridDays]);

  const slotsFor = useCallback((d: Date) => days[iso(d)] ?? [], [days]);

  /* ---------- submit ---------- */

  const submit = async () => {
    if (!selectedDate || !selectedTime) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await publicBookingService.book(
        slug,
        `${iso(selectedDate)} ${selectedTime}:00`,
        answers
      );
      setConfirmation(result);
      setStep('done');
    } catch (err: any) {
      const status = err?.response?.status;
      setError(
        status === 409
          ? 'That time was just taken. Please pick another slot.'
          : err?.response?.data?.message || 'Something went wrong. Please try again.'
      );
      // A taken slot means the grid is stale — send them back to pick again.
      if (status === 409) {
        setStep('date');
        setSelectedTime(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- states ---------- */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">This booking page isn't available</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The link may have been changed or the page may no longer be accepting bookings.
        </p>
      </div>
    );
  }

  const accent = page.branding.button_color || page.branding.primary_color;
  const fields = page.fields;
  const today = startOfDay(new Date());

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <header className="relative mb-6 text-center">
          {/* Visitor-side theme switch. Absolute so it never pushes the
              company's branding off centre. */}
          <button
            type="button"
            onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="absolute right-0 top-0 rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {page.branding.show_logo && (page.company.logo || page.company.name) && (
            <div className="mb-4 flex flex-col items-center">
              {page.company.logo ? (
                /* Signed by the API because the logo lives on the private
                   disk, and resolved against the API host because the
                   signature is relative — see resolveMediaUrl.

                   The logo carries the company's identity on its own, so no
                   name is printed beneath it. */
                <img
                  src={resolveMediaUrl(page.company.logo) ?? ''}
                  alt={page.company.name ?? ''}
                  className="h-24 w-auto max-w-[320px] object-contain sm:h-28"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                /* Only when there is no logo — otherwise the page would carry
                   nothing identifying whose booking it is. */
                page.company.name && (
                  <p className="text-sm font-medium text-muted-foreground">{page.company.name}</p>
                )
              )}
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{page.title}</h1>
          {page.subtitle && <p className="mt-1 text-base text-muted-foreground">{page.subtitle}</p>}
          {page.description && (
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {page.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {page.schedule.duration_minutes} min
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              {page.schedule.timezone}
            </span>
          </div>
        </header>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          {error && (
            <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          {/* ---- Step 1: date and time ---- */}
          {step === 'date' && (
            <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setCursor(addMonths(cursor, -1))}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold capitalize text-foreground">
                    {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setCursor(addMonths(cursor, 1))}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: 7 }, (_, i) => (
                    <span key={i} className="pb-1 text-[11px] font-medium uppercase text-muted-foreground">
                      {addDays(startOfWeek(new Date()), i).toLocaleDateString(undefined, { weekday: 'narrow' })}
                    </span>
                  ))}

                  {gridDays.map(day => {
                    const available = slotsFor(day).length > 0;
                    const outsideMonth = day.getMonth() !== cursor.getMonth();
                    const selected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <button
                        key={iso(day)}
                        type="button"
                        disabled={!available}
                        onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                        style={selected ? { backgroundColor: accent, color: '#fff' } : undefined}
                        className={[
                          'aspect-square rounded-lg text-sm transition-colors',
                          outsideMonth ? 'opacity-40' : '',
                          !available
                            ? 'cursor-not-allowed text-muted-foreground/50'
                            : selected
                              ? 'font-semibold'
                              : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                          isSameDay(day, today) && !selected ? 'ring-1 ring-border-strong' : '',
                        ].join(' ')}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>

                {loadingSlots && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading availability…
                  </p>
                )}
              </div>

              {/* Times for the chosen day */}
              <div className="sm:w-56">
                {selectedDate ? (
                  <>
                    <p className="mb-2 text-sm font-medium text-foreground">
                      {selectedDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-1">
                      {slotsFor(selectedDate).map(time => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => { setSelectedTime(time); setStep('form'); }}
                          style={{ borderColor: accent, color: accent }}
                          className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                        >
                          {time}
                        </button>
                      ))}
                      {slotsFor(selectedDate).length === 0 && (
                        <p className="text-sm text-muted-foreground">No times available.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Pick a date to see available times.</p>
                )}
              </div>
            </div>
          )}

          {/* ---- Step 2: the form ---- */}
          {step === 'form' && selectedDate && selectedTime && (
            <form
              onSubmit={e => { e.preventDefault(); void submit(); }}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={() => setStep('date')}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} at {selectedTime}
              </button>

              {fields.map(field => (
                <BookingFormField
                  key={field.key}
                  field={field}
                  value={answers[field.key]}
                  onChange={value => setAnswers(prev => ({ ...prev, [field.key]: value }))}
                />
              ))}

              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: accent }}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm booking
              </button>
            </form>
          )}

          {/* ---- Step 3: confirmation ---- */}
          {step === 'done' && confirmation && (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12" style={{ color: accent }} />
              <h2 className="text-lg font-semibold text-foreground">{confirmation.confirmation_title}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {confirmation.confirmation_message}
              </p>

              <div className="mx-auto mt-5 inline-flex flex-col gap-1 rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm">
                <span className="font-medium text-foreground">
                  {new Date(confirmation.starts_at).toLocaleString(undefined, {
                    weekday: 'long', day: 'numeric', month: 'long',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                <span className="text-xs text-muted-foreground">{confirmation.timezone}</span>
              </div>
            </div>
          )}
        </div>

        {/* Always shown, and not configurable: the booking page is served by
            Optomyze and says so. Same full lockup the embedded widgets use —
            the white one reads on dark surfaces, the dark one on light. The
            asset carries the wordmark, so there is no separate text. */}
        <a
          href="https://optomyze.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-opacity hover:opacity-80"
        >
          <span>Powered by</span>
          <img
            src={theme === 'dark' ? optomyzeLogo : optomyzeLogoLight}
            alt="Optomyze"
            className="h-6 w-auto shrink-0"
          />
        </a>
      </div>
    </div>
  );
};

/**
 * One configured field.
 *
 * The server validates against its own stored definitions, so what happens
 * here is convenience only — `required` is mirrored onto the input so the
 * browser catches the common case before a round trip.
 */
const BookingFormField = ({
  field, value, onChange,
}: {
  field: BookingField;
  value: unknown;
  onChange: (value: unknown) => void;
}) => {
  const base =
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground ' +
    'placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring';

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {field.label}
        {field.required && <span className="ml-0.5 text-destructive">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          required={field.required}
          rows={3}
          className={`${base} resize-none`}
        />
      ) : field.type === 'select' ? (
        <select
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          required={field.required}
          className={base}
        >
          <option value="">—</option>
          {(field.options ?? []).map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : field.type === 'radio' ? (
        <div className="space-y-1.5">
          {(field.options ?? []).map(option => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name={field.key}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                required={field.required}
              />
              {option.label}
            </label>
          ))}
        </div>
      ) : field.type === 'checkbox' ? (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => onChange(e.target.checked)}
            required={field.required}
          />
          {field.placeholder || field.label}
        </label>
      ) : (
        <input
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.key === 'email' ? 'email' : 'text'}
          value={(value as string) ?? ''}
          onChange={e => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={field.placeholder ?? ''}
          required={field.required}
          className={base}
        />
      )}

      {field.help_text && <p className="text-xs text-muted-foreground">{field.help_text}</p>}
    </div>
  );
};

export default PublicBooking;
