import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ActivityFilterBar, ActivityTimeline, useActivityFeed } from '@/components/activity';

const LeadActivityDashboard: React.FC = () => {
  const { t } = useLanguage();
  const feed = useActivityFeed('lead');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('lead-activity.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('lead-activity.subtitle')}</p>
      </div>

      <ActivityFilterBar
        group={feed.group}
        onGroupChange={feed.setGroup}
        dateRange={feed.dateRange}
        onDateRangeChange={feed.setDateRange}
        customDateFrom={feed.customDateFrom}
        customDateTo={feed.customDateTo}
        onCustomDateChange={feed.setCustomDates}
      />

      {feed.meta?.truncated && (
        <p className="text-xs text-muted-foreground">
          {t('activity.truncated-notice')} ({feed.meta.returned}/{feed.meta.total})
        </p>
      )}

      <ActivityTimeline
        events={feed.events}
        loading={feed.loading}
        variant="full"
        emptyStateLabel={t('lead-activity.no-transactions')}
      />
    </div>
  );
};

export default LeadActivityDashboard;
