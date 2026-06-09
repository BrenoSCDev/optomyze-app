import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DefaultRecipients } from '@/services/notificationSettingsApi';
import { Shield, User, Users } from 'lucide-react';

interface Props {
  recipients: DefaultRecipients;
  onUpdate: (updates: Partial<DefaultRecipients>) => void;
}

// Render recipients dynamically based on API keys
const recipientIcons: Record<string, typeof User> = {
  admin: Shield,
  deal_owner: User,
  lead_owner: User,
  team_manager: Users,
};

export default function DefaultRecipientsSection({ recipients, onUpdate }: Props) {
  const { t } = useLanguage();

  // Convert recipients object to array for rendering
  const recipientEntries = Object.entries(recipients) as [keyof DefaultRecipients, boolean][];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('settings.notifications.recipients.description')}
      </p>

      <div className="grid gap-3">
        {recipientEntries.map(([key, enabled]) => {
          const Icon = recipientIcons[key] || User;
          
          return (
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
                checked={enabled}
                onCheckedChange={(checked) => onUpdate({ [key]: checked })}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
