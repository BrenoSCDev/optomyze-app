/**
 * STATUS BADGE
 *
 * Shared status/priority/type pill used by the calendar grid, hover
 * previews, and agenda cards so appointment "health" reads identically
 * everywhere it appears.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getStatusConfig, type StatusBadgeKind } from './calendarUtils';

interface StatusBadgeProps {
  kind: StatusBadgeKind;
  value: string | null | undefined;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ kind, value, className, showIcon = true }) => {
  const { t } = useLanguage();
  const config = getStatusConfig(kind, value);
  const Icon = config.Icon;
  const label = config.translationKey ? (t(config.translationKey) || config.label) : config.label;

  return (
    <Badge variant="outline" className={cn('gap-1 font-semibold whitespace-nowrap', config.classes, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
};

export default StatusBadge;
