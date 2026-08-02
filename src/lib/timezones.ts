/**
 * TIMEZONES
 *
 * Shared IANA timezone list. Prefers the full set the browser knows about so
 * a company anywhere can be represented; falls back to a curated list on
 * engines without `Intl.supportedValuesOf` (pre-2022 Safari/Firefox).
 */

/** Curated fallback — the timezones our customers actually sit in. */
const COMMON_TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
  'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'America/Buenos_Aires',
  'America/Mexico_City', 'America/Bogota', 'America/Lima',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Warsaw', 'Europe/Istanbul',
  'Europe/Moscow', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Australia/Sydney', 'Pacific/Auckland', 'UTC',
];

function loadTimezones(): string[] {
  try {
    const supported = (Intl as { supportedValuesOf?: (k: string) => string[] })
      .supportedValuesOf?.('timeZone');
    if (supported?.length) return supported;
  } catch { /* fall through to the curated list */ }
  return COMMON_TIMEZONES;
}

export const TIMEZONES: string[] = loadTimezones();

/**
 * Current UTC offset for a zone, e.g. "GMT-3". Rendered beside the name so
 * the list is scannable without knowing every IANA identifier by heart.
 */
export function timezoneOffsetLabel(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
      .formatToParts(new Date());
    return parts.find(p => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

/** Human-friendly name: "America/Sao_Paulo" -> "Sao Paulo". */
export function timezoneCityLabel(timeZone: string): string {
  const city = timeZone.split('/').pop() ?? timeZone;
  return city.replace(/_/g, ' ');
}
