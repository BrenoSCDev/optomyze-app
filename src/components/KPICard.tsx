/**
 * KPI CARD COMPONENT
 * 
 * A reusable glassmorphism card component for displaying Key Performance Indicators.
 * Features:
 * - Animated number counting on mount
 * - Trend indicators with color-coded arrows
 * - Hover effects with scale transformation and glow
 * - Responsive design with consistent spacing
 * - Support for percentage and monetary values
 * 
 * Used throughout all dashboard sections to maintain design consistency.
 */

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { KPI_ACCENTS, type KpiAccent } from '@/components/kpiAccents';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  delay?: number;
  /** Optional currency prefix for animated counter (e.g. "$", "R$", "€"). Detected automatically from value string if omitted. */
  currencyPrefix?: string;
  /** When true, adds a subtle ring to call out a significant change. */
  highlight?: boolean;
  /** Branded accent for the icon badge, highlight ring, and hover glow. Falls back to the default theme styling when omitted. */
  accent?: KpiAccent;
  /** Denser layout with a smaller value - for secondary/supporting metrics. */
  compact?: boolean;
}

/**
 * ANIMATED COUNTER COMPONENT
 * Handles the smooth counting animation for KPI values
 * Supports different formats: percentages, currency, K/M suffixes
 */
const AnimatedCounter = ({ value, delay = 0, currencyPrefix }: { value: string | number, delay?: number, currencyPrefix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const end = numericValue;
      const duration = 1500;
      const increment = end / (duration / 16);
      
      const counter = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(counter);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);
      
      return () => clearInterval(counter);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [numericValue, delay]);
  
  // Percentage values
  if (typeof value === 'string' && value.includes('%')) {
    return <span>{displayValue.toFixed(1)}%</span>;
  }
  
  // Detect currency symbol from the value string or use provided prefix
  const detectedPrefix = currencyPrefix || (typeof value === 'string' ? value.match(/^([^0-9]*)/)?.[1]?.trim() : undefined);
  const isCurrency = detectedPrefix && detectedPrefix.length > 0 && /[^\d\s]/.test(detectedPrefix);
  
  if (isCurrency) {
    return <span>{detectedPrefix}{displayValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
  }
  
  // Large numbers with K/M suffixes
  if (typeof value === 'string' && (value.includes('M') || value.includes('K'))) {
    const suffix = value.includes('M') ? 'M' : 'K';
    return <span>{(displayValue / (suffix === 'M' ? 1000000 : 1000)).toFixed(1)}{suffix}</span>;
  }
  
  return <span>{displayValue.toLocaleString()}</span>;
};

const KPICard = ({ title, value, trend, icon, delay = 0, currencyPrefix, highlight, accent, compact }: KPICardProps) => {
  const accentStyle = accent ? KPI_ACCENTS[accent] : null;

  return (
    <motion.div
      className={cn(
        'kpi-card floating', // Glass card with floating animation
        accentStyle?.glow,
        highlight && (accentStyle ? `ring-1 ${accentStyle.ring}` : 'ring-1 ring-amber-400/50')
      )}
      initial={{ opacity: 0, y: 20 }} // Start slightly below and transparent
      animate={{ opacity: 1, y: 0 }} // Animate to final position
      transition={{ duration: 0.6, delay: delay * 0.1 }} // Staggered entrance
      whileHover={{ scale: 1.05 }} // Gentle scale on hover
    >
      {/* Card Header with title, value, and optional icon */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2 leading-tight truncate" title={title}>{title}</h3>
          <div className={cn('kpi-value', compact ? 'text-lg sm:text-xl lg:text-2xl' : 'text-xl sm:text-2xl lg:text-3xl')}>
            <AnimatedCounter value={value} delay={delay * 100} currencyPrefix={currencyPrefix} />
          </div>
        </div>
        {icon && (
          <div className={cn(
            'rounded-lg border shrink-0 ml-2',
            compact ? 'p-1.5 sm:p-2' : 'p-2 sm:p-3',
            accentStyle ? cn(accentStyle.iconBg, accentStyle.iconColor, accentStyle.border) : 'bg-primary/10 border-primary/20 text-primary'
          )}>
            {icon}
          </div>
        )}
      </div>
      
      {/* Optional trend indicator with color-coded icons */}
      {trend && (
        <div className={`flex items-center gap-1 kpi-trend text-xs sm:text-sm ${trend.isPositive ? 'positive' : 'negative'}`}>
          {trend.isPositive ? (
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
          <span>{trend.value}</span>
        </div>
      )}
    </motion.div>
  );
};

export default KPICard;