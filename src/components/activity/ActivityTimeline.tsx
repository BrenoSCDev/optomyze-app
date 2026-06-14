import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { ActivityEvent, AUTOMATION_ACTOR } from './types';
import { resolveActivityRegistryEntry } from './registry';

interface ActivityTimelineProps {
  events: ActivityEvent[];
  loading?: boolean;
  /** 'full' = page view (no inner scroll, shows which lead/deal each event belongs to).
   *  'compact' = modal view (scrollable, subject hidden since it's always the same record). */
  variant?: 'full' | 'compact';
  emptyStateLabel?: string;
  maxHeight?: string;
  className?: string;
}

interface ActivityGroup {
  label: string;
  events: ActivityEvent[];
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  events,
  loading = false,
  variant = 'full',
  emptyStateLabel,
  maxHeight = 'max-h-[420px]',
  className = '',
}) => {
  const { t } = useLanguage();
  const showSubject = variant === 'full';

  const groups = useMemo<ActivityGroup[]>(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const order: string[] = [];
    const byDay = new Map<string, ActivityGroup>();

    sorted.forEach((event) => {
      const date = new Date(event.createdAt);
      const key = format(date, 'yyyy-MM-dd');
      if (!byDay.has(key)) {
        const label = isToday(date)
          ? t('activity.date.today')
          : isYesterday(date)
            ? t('activity.date.yesterday')
            : format(date, 'MMMM d, yyyy');
        byDay.set(key, { label, events: [] });
        order.push(key);
      }
      byDay.get(key)!.events.push(event);
    });

    return order.map((key) => byDay.get(key)!);
  }, [events, t]);

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-10 text-center ${className}`}>
        <Activity className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">{emptyStateLabel ?? t('activity.empty.default')}</p>
      </div>
    );
  }

  const content = (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {group.label}
          </h3>
          <div>
            {group.events.map((event, index) => {
              const entry = resolveActivityRegistryEntry(event);
              const Icon = entry.icon;
              const isLast = index === group.events.length - 1;
              const subjectLabel = [event.subject.dealName, event.subject.leadName]
                .filter(Boolean)
                .join(' • ');

              return (
                <motion.div
                  key={event.id}
                  className="flex gap-3 px-2 -mx-2 py-2 rounded-lg transition-colors hover:bg-muted/40"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.4) }}
                >
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-8 h-8 rounded-full ${entry.badgeColor} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${entry.iconColor}`} />
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-border/40 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-sm font-medium text-foreground leading-snug">{t(entry.titleKey)}</p>
                    <p className="text-sm text-muted-foreground leading-snug mt-0.5">{event.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <span>{format(new Date(event.createdAt), 'h:mm a')}</span>
                      <span>•</span>
                      <span>
                        {event.actor.isSystem
                          ? t(event.actor.name === AUTOMATION_ACTOR ? 'activity.actor.automation' : 'activity.actor.system')
                          : event.actor.name}
                      </span>
                      {showSubject && subjectLabel && (
                        <>
                          <span>•</span>
                          <span className="text-accent">{subjectLabel}</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  if (variant === 'compact') {
    return <div className={`overflow-y-auto overflow-x-hidden scrollbar-dark px-2 ${maxHeight} ${className}`}>{content}</div>;
  }

  return <div className={className}>{content}</div>;
};

export default ActivityTimeline;
