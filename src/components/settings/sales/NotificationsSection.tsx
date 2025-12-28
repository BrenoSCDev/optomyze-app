import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { SalesSettings, Notifications } from '@/services/settingsApi';

interface Props {
  settings: SalesSettings;
  onUpdate: (updates: Partial<SalesSettings>) => void;
}

const NotificationsSection = ({ settings, onUpdate }: Props) => {
  const { t } = useLanguage();
  const { notifications } = settings;

  const updateNotifications = (updates: Partial<Notifications>) => {
    onUpdate({
      notifications: { ...notifications, ...updates },
    });
  };

  const toggleRecipient = (recipient: 'deal-owner' | 'team-manager' | 'admin') => {
    const current = notifications.notifyRecipients;
    const updated = current.includes(recipient)
      ? current.filter(r => r !== recipient)
      : [...current, recipient];
    updateNotifications({ notifyRecipients: updated });
  };

  const toggleChannel = (channel: 'email' | 'whatsapp' | 'slack') => {
    updateNotifications({
      channels: {
        ...notifications.channels,
        [channel]: !notifications.channels[channel],
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Notify on Deal Won */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.sales.notify-deal-won')}</Label>
          <p className="text-sm text-muted-foreground">{t('settings.sales.notify-deal-won-desc')}</p>
        </div>
        <Switch 
          checked={notifications.notifyOnDealWon} 
          onCheckedChange={(checked) => updateNotifications({ notifyOnDealWon: checked })}
        />
      </div>

      {notifications.notifyOnDealWon && (
        <div className="space-y-6 ml-4 border-l-2 border-primary/20 pl-4">
          {/* Who Gets Notified */}
          <div className="space-y-3">
            <Label>{t('settings.sales.notify-recipients')}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-deal-owner"
                  checked={notifications.notifyRecipients.includes('deal-owner')}
                  onCheckedChange={() => toggleRecipient('deal-owner')}
                />
                <label htmlFor="notify-deal-owner" className="text-sm">
                  {t('settings.sales.recipient-deal-owner')}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-team-manager"
                  checked={notifications.notifyRecipients.includes('team-manager')}
                  onCheckedChange={() => toggleRecipient('team-manager')}
                />
                <label htmlFor="notify-team-manager" className="text-sm">
                  {t('settings.sales.recipient-team-manager')}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-admin"
                  checked={notifications.notifyRecipients.includes('admin')}
                  onCheckedChange={() => toggleRecipient('admin')}
                />
                <label htmlFor="notify-admin" className="text-sm">
                  {t('settings.sales.recipient-admin')}
                </label>
              </div>
            </div>
          </div>

          {/* Notification Channels */}
          <div className="space-y-3">
            <Label>{t('settings.sales.notification-channels')}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="channel-email"
                  checked={notifications.channels.email}
                  onCheckedChange={() => toggleChannel('email')}
                />
                <label htmlFor="channel-email" className="text-sm">
                  {t('settings.sales.channel-email')}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="channel-whatsapp"
                  checked={notifications.channels.whatsapp}
                  onCheckedChange={() => toggleChannel('whatsapp')}
                />
                <label htmlFor="channel-whatsapp" className="text-sm">
                  {t('settings.sales.channel-whatsapp')}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="channel-slack"
                  checked={notifications.channels.slack}
                  onCheckedChange={() => toggleChannel('slack')}
                />
                <label htmlFor="channel-slack" className="text-sm">
                  {t('settings.sales.channel-slack')}
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsSection;
