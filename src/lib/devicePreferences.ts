/**
 * Storage keys that describe the machine, not the account.
 *
 * The distinction matters because signing out — and switching company —
 * clears localStorage wholesale, on the principle that anything cached during
 * a session belongs to that company and must not survive into the next one
 * (see resetSession in services/auth).
 *
 * These few keys are the exception: how much room the menu should take is a
 * property of the screen you are sitting at, so it should outlive both a
 * logout and a company switch. Anything added here must be genuinely free of
 * company data — when in doubt, leave it out and let it be cleared.
 */
export const DEVICE_PREFERENCE_KEYS = {
  /** Sidebar left collapsed to the icon rail. */
  sidebarCollapsed: 'optomyze_sidebar_collapsed',
} as const;

export const DEVICE_PREFERENCE_KEY_LIST: readonly string[] =
  Object.values(DEVICE_PREFERENCE_KEYS);
