/**
 * LEAD NAME FORMATTING
 *
 * A contact's last name is optional, and so is the first — the chat webhooks
 * create contacts from a phone number alone. Building a display name with a
 * template literal therefore puts the literal text "null" on screen, which is
 * what `Ana null` in the header search was.
 *
 * Joining the parts that actually exist is the whole fix; this lives in one
 * place so the next screen that shows a contact name gets it right for free.
 */

interface NameParts {
  first_name?: string | null;
  last_name?: string | null;
}

/**
 * The contact's name, with nothing invented and nothing shown that isn't there.
 *
 * `fallback` is what to show when a contact has no name at all. Callers that
 * have something better to identify it with — a phone number, an id — should
 * pass it; the default keeps the UI from rendering an empty string.
 */
export const leadDisplayName = (
  lead: NameParts | null | undefined,
  fallback = ''
): string => {
  if (!lead) return fallback;

  return [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || fallback;
};
