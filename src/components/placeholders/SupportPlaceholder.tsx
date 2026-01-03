/**
 * SUPPORT PLACEHOLDER
 * Placeholder view for the Support feature (coming soon)
 */

import { Headphones } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const SupportPlaceholder = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="p-6 rounded-full bg-primary/10 mb-6">
        <Headphones className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">
        {t('support.title')}
      </h2>
      <p className="text-muted-foreground max-w-md">
        {t('support.coming-soon')}
      </p>
    </div>
  );
};

export default SupportPlaceholder;
