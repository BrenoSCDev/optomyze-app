import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DefaultRecipients } from '@/services/notificationSettingsApi';
import { User, Users, Shield, Crown } from 'lucide-react';

interface Props {
  recipients: DefaultRecipients;
  onUpdate: (updates: Partial<DefaultRecipients>) => void;
}

const recipientConfig = [
  { key: 'deal_owner' as const, icon: User },
  { key: 'lead_owner' as const, icon: User },
  { key: 'manager' as const, icon: Users },
  { key: 'admin' as const, icon: Shield },
];

export default function DefaultRecipientsSection({ recipients, onUpdate }: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('settings.notifications.recipients.description')}
      </p>

      <div className="grid gap-3">
        {recipientConfig.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 rounded-lg border bg-background/50"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <Label className="font-medium">
                {t(`settings.notifications.recipients.${key}`)}
              </Label>
            </div>
            <Switch
              checked={recipients[key]}
              onCheckedChange={(checked) => onUpdate({ [key]: checked })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
