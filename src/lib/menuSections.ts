/**
 * Order of the first sidebar group.
 *
 * This used to be user-customisable and persisted in localStorage
 * (MenuOrderContext, plus a "Customize menu order" panel). That was removed:
 * a drag-reordered menu made every support conversation and screenshot
 * ambiguous, and it was the one preference nobody could see but the user.
 *
 * Note `reports` is the section labelled "Activity" (nav.reports); the id is
 * kept because it is referenced across the sidebar, the header and the menu
 * search index.
 */
export const MENU_SECTION_ORDER = [
  'dashboard',
  'funnels',
  'reports',
  'products',
  'organization',
  'integrations',
  'aiAgents',
  'api',
] as const;

export type MenuSectionId = typeof MENU_SECTION_ORDER[number];
