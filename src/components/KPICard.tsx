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
}

const AnimatedCounter = ({ value, delay = 0 }: { value: string | number, delay?: number }) => {
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
  
  if (typeof value === 'string' && value.includes('%')) {
    return <span>{displayValue.toFixed(1)}%</span>;
  }
  
  if (typeof value === 'string' && value.includes('$')) {
    return <span>${displayValue.toLocaleString()}</span>;
  }
  
  if (typeof value === 'string' && (value.includes('M') || value.includes('K'))) {
    const suffix = value.includes('M') ? 'M' : 'K';
    return <span>{(displayValue / (suffix === 'M' ? 1000000 : 1000)).toFixed(1)}{suffix}</span>;
  }
  
  return <span>{displayValue.toLocaleString()}</span>;
};

const KPICard = ({ title, value, trend, icon, delay = 0 }: KPICardProps) => {
  return (
    <motion.div
      className="kpi-card floating"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay * 0.1 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
          <div className="kpi-value">
            <AnimatedCounter value={value} delay={delay * 100} />
          </div>
        </div>
        {icon && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            {icon}
          </div>
        )}
      </div>
      
      {trend && (
        <div className={`flex items-center gap-1 kpi-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
          {trend.isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>{trend.value}</span>
        </div>
      )}
    </motion.div>
  );
};

export default KPICard;