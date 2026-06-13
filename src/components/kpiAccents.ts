/**
 * Branded accent palette for KPI icon badges, highlight rings, and hover
 * glows. Static record with literal Tailwind arbitrary-value classes so the
 * JIT compiler can discover every class.
 */
export type KpiAccent = 'blue' | 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose';

interface KpiAccentStyle {
  iconBg: string;
  iconColor: string;
  border: string;
  ring: string;
  glow: string;
}

export const KPI_ACCENTS: Record<KpiAccent, KpiAccentStyle> = {
  blue: {
    iconBg: 'bg-[#0081FB]/10',
    iconColor: 'text-[#0081FB]',
    border: 'border-[#0081FB]/20',
    ring: 'ring-[#0081FB]/40',
    glow: 'hover:shadow-[0_12px_30px_-14px_rgba(0,129,251,0.45)]',
  },
  cyan: {
    iconBg: 'bg-[#00C4FF]/10',
    iconColor: 'text-[#00C4FF]',
    border: 'border-[#00C4FF]/20',
    ring: 'ring-[#00C4FF]/40',
    glow: 'hover:shadow-[0_12px_30px_-14px_rgba(0,196,255,0.45)]',
  },
  violet: {
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
    border: 'border-violet-400/20',
    ring: 'ring-violet-400/40',
    glow: 'hover:shadow-[0_12px_30px_-14px_rgba(139,92,246,0.45)]',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    border: 'border-emerald-400/20',
    ring: 'ring-emerald-400/40',
    glow: 'hover:shadow-[0_12px_30px_-14px_rgba(16,185,129,0.45)]',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    border: 'border-amber-400/20',
    ring: 'ring-amber-400/40',
    glow: 'hover:shadow-[0_12px_30px_-14px_rgba(245,158,11,0.45)]',
  },
  rose: {
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    border: 'border-rose-400/20',
    ring: 'ring-rose-400/40',
    glow: 'hover:shadow-[0_12px_30px_-14px_rgba(244,63,94,0.45)]',
  },
};
