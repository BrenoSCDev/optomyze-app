/**
 * Shared phone number helpers - country (DDI) codes, input masks, and
 * utilities for combining/splitting a DDI + local number into a single
 * stored phone string (e.g. "+5511999999999").
 */

export interface DdiOption {
  value: string;
  label: string;
  country: string;
  flag: string;
}

export const ddiOptions: DdiOption[] = [
  { value: "+1", label: "+1", country: "United States", flag: "🇺🇸" },
  { value: "+1", label: "+1", country: "Canada", flag: "🇨🇦" },
  { value: "+44", label: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { value: "+353", label: "+353", country: "Ireland", flag: "🇮🇪" },
  { value: "+33", label: "+33", country: "France", flag: "🇫🇷" },
  { value: "+34", label: "+34", country: "Spain", flag: "🇪🇸" },
  { value: "+49", label: "+49", country: "Germany", flag: "🇩🇪" },
  { value: "+41", label: "+41", country: "Switzerland", flag: "🇨🇭" },
  { value: "+351", label: "+351", country: "Portugal", flag: "🇵🇹" },
  { value: "+47", label: "+47", country: "Norway", flag: "🇳🇴" },
  { value: "+39", label: "+39", country: "Italy", flag: "🇮🇹" },
  { value: "+7", label: "+7", country: "Russia", flag: "🇷🇺" },
  { value: "+55", label: "+55", country: "Brazil", flag: "🇧🇷" },
  { value: "+54", label: "+54", country: "Argentina", flag: "🇦🇷" }
];

export const phoneMasks: Record<string, string> = {
  "+1": "(999) 999-9999",
  "+44": "9999 999 9999",
  "+353": "99 999 9999",
  "+33": "99 99 99 99 99",
  "+34": "999 999 999",
  "+49": "999 999 9999",
  "+41": "99 999 99 99",
  "+351": "999 999 999",
  "+47": "999 99 999",
  "+39": "999 999 9999",
  "+7": "999 999-99-99",
  "+55": "(99) 99999-9999",
  "+54": "99 9999-9999"
};

export const DEFAULT_DDI = "+55";

const uniqueDdiCodes = Array.from(new Set(ddiOptions.map((option) => option.value))).sort(
  (a, b) => b.length - a.length
);

/**
 * Splits a stored phone string (e.g. "+5511999999999") into its DDI code
 * and local number. Falls back to DEFAULT_DDI for legacy numbers stored
 * without a leading "+" country code.
 */
export function splitPhoneNumber(phone?: string | null): { ddi: string; localNumber: string } {
  if (!phone) {
    return { ddi: DEFAULT_DDI, localNumber: '' };
  }

  const trimmed = phone.trim();

  if (trimmed.startsWith('+')) {
    for (const code of uniqueDdiCodes) {
      if (trimmed.startsWith(code)) {
        return { ddi: code, localNumber: trimmed.slice(code.length).replace(/\D/g, '') };
      }
    }
  }

  return { ddi: DEFAULT_DDI, localNumber: trimmed.replace(/\D/g, '') };
}

/**
 * Combines a DDI code and a (possibly masked) local number into a single
 * phone string with only digits after the "+", ready to be sent to the backend.
 * Returns an empty string if no local number digits were entered.
 */
export function combinePhoneNumber(ddi: string, localNumber: string): string {
  const digits = (localNumber || '').replace(/\D/g, '');
  return digits ? `${ddi}${digits}` : '';
}
