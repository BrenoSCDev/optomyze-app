import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { NotificationChannels } from '@/services/notificationSettingsApi';
import { Mail, MessageCircle, Bell } from 'lucide-react';

interface Props {
  channels: NotificationChannels;
  onUpdate: (updates: Partial<NotificationChannels>) => void;
}

// Map channel keys to icons
const channelIcons: Record<keyof NotificationChannels, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  in_app: Bell,
};

export default function NotificationChannelsSection({ channels, onUpdate }: Props) {
  const { t } = useLanguage();

  // Convert channels object to array for rendering
  const channelEntries = Object.entries(channels) as [keyof NotificationChannels, boolean][];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('settings.notifications.channels.description')}
      </p>

      <div className="grid gap-4">
        {channelEntries.map(([key, enabled]) => {
          const Icon = channelIcons[key] || Bell;
          
          return (
            <div
              key={key}
              className="flex items-center justify-between p-4 rounded-lg border bg-background/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <Label className="font-medium">
                    {t(`settings.notifications.channels.${key}`)}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t(`settings.notifications.channels.${key}-hint`)}
                  </p>
                </div>
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
