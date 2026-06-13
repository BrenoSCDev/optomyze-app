/**
 * Meta-branded visual theme for the Meta Ads dashboard. Static records with
 * literal Tailwind arbitrary-value classes (mirroring `BRAND_STYLES` in
 * `IntegrationsApps.tsx`) so the JIT compiler can discover every class -
 * dynamically constructed class strings would be missed by the scanner.
 */

/** Meta's brand blue and the cyan accent used across its product surfaces. */
export const META_BLUE = '#0081FB';
export const META_CYAN = '#00C4FF';

/** Hex palette for charts - Meta blue/cyan lead, complementary accents follow. */
export const META_CHART_COLORS = {
  blue: '#0081FB',
  cyan: '#00C4FF',
  violet: '#8B5CF6',
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
} as const;

/** Re-exported for convenience so Meta Ads sections share one accent system with `KPICard`. */
export type { KpiAccent } from '@/components/kpiAccents';
export { KPI_ACCENTS } from '@/components/kpiAccents';

/** Subtle Meta-blue tinted gradient for section headers and hero panels. */
export const META_HEADER_GRADIENT = 'bg-[linear-gradient(135deg,rgba(0,129,251,0.08),rgba(0,196,255,0.02))]';

/** Branded hover border used on interactive Meta-themed panels. */
export const META_HOVER_BORDER = 'hover:border-[#0081FB]/30';
