/**
 * WHATSAPP ACCOUNT HELPERS
 *
 * Shared by every panel that shows a connected WhatsApp account.
 *
 * The backend still calls these things instances — that is the Evolution API's
 * vocabulary and the column names built on it, and renaming them would be churn
 * for no gain. Everything a customer reads says "account", and this is where
 * the two meet.
 */

/** The status values the API can return for an account. */
export type AccountStatus = 'created' | 'qrcode' | 'connected' | 'disconnected' | 'error';

/**
 * Turn a stored status into something worth reading.
 *
 * Evolution's own names went straight into the badge — a freshly provisioned
 * account read "created", which says what happened on our side and nothing
 * about whether the customer's number is actually receiving messages.
 */
export const accountStatusLabel = (
  t: (key: string) => string,
  status?: string | null
): string => t(`integrations.panel.account.status-${status || 'created'}`) || status || '';
