import React, { useState, useEffect } from 'react';
import { Users, Handshake, Target, Trophy, CheckCircle2 } from 'lucide-react';
import { getUserPerformance, UserPerformanceStats } from '@/services/userApi';

interface PerformanceTabProps {
  userId: number;
  active: boolean;
}

const STATS: { key: keyof UserPerformanceStats; label: string; icon: React.ElementType }[] = [
  { key: 'leads_assigned', label: 'Leads Assigned', icon: Users },
  { key: 'deals_assigned', label: 'Deals Assigned', icon: Handshake },
  { key: 'leads_converted', label: 'Leads Converted', icon: Target },
  { key: 'deals_closed', label: 'Deals Closed', icon: Trophy },
  { key: 'tasks_completed', label: 'Tasks Completed', icon: CheckCircle2 },
];

const PerformanceTab: React.FC<PerformanceTabProps> = ({ userId, active }) => {
  const [stats, setStats] = useState<UserPerformanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!active || hasLoaded) return;
    let cancelled = false;
    setIsLoading(true);
    getUserPerformance(userId)
      .then(data => {
        if (cancelled) return;
        setStats(data);
        setHasLoaded(true);
      })
      .catch(err => console.error('Failed to load performance stats:', err))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [active, userId, hasLoaded]);

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STATS.map(stat => (
          <div key={stat.key} className="glass-card p-4 flex flex-col gap-2">
            <div className="h-8 w-8 bg-muted/60 rounded-lg animate-pulse" />
            <div className="h-7 w-12 bg-muted/60 rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted/40 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {STATS.map(stat => {
        const Icon = stat.icon;
        return (
          <div key={stat.key} className="glass-card p-4 flex flex-col gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">{stats[stat.key]}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PerformanceTab;
