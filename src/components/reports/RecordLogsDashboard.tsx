import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ActivityFilterBar, ActivityTimeline, useActivityFeed } from '@/components/activity';
import type { ActivityFeedDomain } from '@/components/activity';

const RecordLogsDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [recordType, setRecordType] = useState<ActivityFeedDomain>('all');
  const feed = useActivityFeed(recordType);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('record-logs.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('record-logs.subtitle')}</p>
      </div>

      <ActivityFilterBar
        group={feed.group}
        onGroupChange={feed.setGroup}
        dateRange={feed.dateRange}
        onDateRangeChange={feed.setDateRange}
        customDateFrom={feed.customDateFrom}
        customDateTo={feed.customDateTo}
        onCustomDateChange={feed.setCustomDates}
        recordType={recordType}
        onRecordTypeChange={setRecordType}
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
        emptyStateLabel={t('record-logs.no-records')}
      />
    </div>
  );
};

export default RecordLogsDashboard;
