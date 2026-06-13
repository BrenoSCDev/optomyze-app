import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Animation entrance delay, in seconds. */
  delay?: number;
  /** Slide-in direction for the entrance animation. */
  direction?: 'up' | 'left' | 'right';
  /** Optional control rendered at the top-right of the header (e.g. tabs, legend). */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const DIRECTION_OFFSETS: Record<NonNullable<SectionCardProps['direction']>, { x: number; y: number }> = {
  up: { x: 0, y: 50 },
  left: { x: -50, y: 0 },
  right: { x: 50, y: 0 },
};

/**
 * Shared section wrapper for the Meta Ads dashboard: a `chart-container`
 * card with a Meta-branded icon badge, title/subtitle header, and a
 * staggered entrance animation. Keeps charts, tables, and insight panels
 * visually consistent.
 */
const SectionCard = ({ title, subtitle, icon, delay = 0, direction = 'up', action, className, children }: SectionCardProps) => {
  const offset = DIRECTION_OFFSETS[direction];

  return (
    <motion.div
      className={cn('chart-container', className)}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0081FB]/10 text-[#0081FB] shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground leading-tight truncate">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </motion.div>
  );
};

export default SectionCard;
