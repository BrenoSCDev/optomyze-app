/**
 * Shared label formatting helpers.
 *
 * Converts raw backend enum/snake_case values (e.g. source_platform,
 * source_type) into user-facing labels (e.g. "WhatsApp Business").
 */

// Words that need a specific capitalization instead of simple Title Case.
const LABEL_OVERRIDES: Record<string, string> = {
  whatsapp: 'WhatsApp',
  dm: 'DM',
  sms: 'SMS',
  api: 'API',
  url: 'URL',
  id: 'ID',
  ai: 'AI',
  crm: 'CRM',
  sdk: 'SDK',
  ddi: 'DDI',
  ddd: 'DDD',
  faq: 'FAQ',
  n8n: 'n8n',
};

/**
 * Formats a snake_case / kebab-case / spaced enum value into a readable
 * label, e.g. "whatsapp_business" -> "WhatsApp Business",
 * "instagram_dm" -> "Instagram DM".
 */
export function formatEnumLabel(value?: string | null): string {
  if (!value) return '';

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      return LABEL_OVERRIDES[lower] ?? lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}
