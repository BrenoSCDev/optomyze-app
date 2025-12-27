import { useLanguage } from '@/contexts/LanguageContext';
import OptoIcon from '@/assets/opto-icon.png';

const CrmPanel = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <img src={OptoIcon} alt="Optomyze" className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('settings.crm-panel.title')}</h1>
          <p className="text-muted-foreground">{t('settings.crm-panel.description')}</p>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="glass-card p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <img src={OptoIcon} alt="Optomyze" className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t('settings.crm-panel.coming-soon')}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t('settings.crm-panel.coming-soon-description')}
        </p>
      </div>
    </div>
  );
};

export default CrmPanel;
