// FrequencyControlSection - Coming Soon
// This component is currently commented out in CrmPanel and will be implemented
// when the backend supports frequency settings.

import { useLanguage } from '@/contexts/LanguageContext';

interface FrequencySettings {
  groupSimilar: boolean;
  maxPerHour: number;
  delayNonCritical: boolean;
  delayDuration: number;
}

interface Props {
  frequency: FrequencySettings;
  onUpdate: (updates: Partial<FrequencySettings>) => void;
}

export default function FrequencyControlSection({ frequency, onUpdate }: Props) {
  const { t } = useLanguage();

  return (
    <div className="text-center py-8 text-muted-foreground">
      {t('common.coming-soon')}
    </div>
  );
}
