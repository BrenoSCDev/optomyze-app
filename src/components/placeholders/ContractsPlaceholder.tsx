/**
 * CONTRACTS PLACEHOLDER
 * Placeholder view for the Contracts feature (coming soon)
 */

import { FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ContractsPlaceholder = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="p-6 rounded-full bg-primary/10 mb-6">
        <FileText className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">
        {t('contracts.title')}
      </h2>
      <p className="text-muted-foreground max-w-md">
        {t('contracts.coming-soon')}
      </p>
    </div>
  );
};

export default ContractsPlaceholder;
