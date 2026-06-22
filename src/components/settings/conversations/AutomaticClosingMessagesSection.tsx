import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AutomaticClosingMessagesSectionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const AutomaticClosingMessagesSection = ({ enabled, onToggle }: AutomaticClosingMessagesSectionProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-background/50">
      <div className="space-y-1">
        <Label className="text-sm font-medium">{t('settings.conversations.auto-closing.enable-label')}</Label>
        <p className="text-xs text-muted-foreground max-w-md">{t('settings.conversations.auto-closing.description')}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
};

export default AutomaticClosingMessagesSection;
