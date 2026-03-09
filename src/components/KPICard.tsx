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
}

/**
 * ANIMATED COUNTER COMPONENT
 * Handles the smooth counting animation for KPI values
 * Supports different formats: percentages, currency, K/M suffixes
 */
const AnimatedCounter = ({ value, delay = 0 }: { value: string | number, delay?: number }) => {
  // State for animated counter - starts at 0 and counts up to target value
  const [displayValue, setDisplayValue] = useState(0);
  // Extract numeric value from string (removes currency symbols, etc.)
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
  
  // Animation effect that runs when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const end = numericValue;
      const duration = 1500; // 1.5 seconds animation
      const increment = end / (duration / 16); // 60fps animation
      
      // Counter animation loop running at ~60fps
      const counter = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end); // Ensure we hit exact target value
          clearInterval(counter);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16); // ~60fps (1000ms / 60 = 16.67ms)
      
      return () => clearInterval(counter);
    }, delay); // Staggered animation based on delay prop
    
    return () => clearTimeout(timer);
  }, [numericValue, delay]);
  
  // Format output based on original value type
  
  // Percentage values (e.g., "12.5%")
  if (typeof value === 'string' && value.includes('%')) {
    return <span>{displayValue.toFixed(1)}%</span>;
  }
  
  // Currency values (e.g., "$1,234")
  if (typeof value === 'string' && value.includes('$')) {
    return <span>${displayValue.toLocaleString()}</span>;
  }
  
  // Large numbers with K/M suffixes (e.g., "2.5M", "150K")
  if (typeof value === 'string' && (value.includes('M') || value.includes('K'))) {
    const suffix = value.includes('M') ? 'M' : 'K';
    return <span>{(displayValue / (suffix === 'M' ? 1000000 : 1000)).toFixed(1)}{suffix}</span>;
  }
  
  // Default number formatting with commas
  return <span>{displayValue.toLocaleString()}</span>;
};

const KPICard = ({ title, value, trend, icon, delay = 0 }: KPICardProps) => {
  return (
    <motion.div
      className="kpi-card floating" // Glass card with floating animation
      initial={{ opacity: 0, y: 20 }} // Start slightly below and transparent
      animate={{ opacity: 1, y: 0 }} // Animate to final position
      transition={{ duration: 0.6, delay: delay * 0.1 }} // Staggered entrance
      whileHover={{ scale: 1.05 }} // Gentle scale on hover
    >
      {/* Card Header with title, value, and optional icon */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2 leading-tight">{title}</h3>
          <div className="kpi-value text-xl sm:text-2xl lg:text-3xl">
            <AnimatedCounter value={value} delay={delay * 100} />
          </div>
        </div>
        {icon && (
          <div className="p-2 sm:p-3 rounded-lg bg-primary/10 border border-primary/20 shrink-0 ml-2">
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