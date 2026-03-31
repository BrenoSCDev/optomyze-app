import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  NotificationEvents,
  NotificationChannels,
  NotificationChannel,
  mockUsers,
} from '@/services/notificationSettingsApi';
import { Send, Mail, MessageCircle, Bell } from 'lucide-react';

interface Props {
  events: NotificationEvents;
  enabledChannels: NotificationChannels;
}

const channelIcons: Record<NotificationChannel, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  in_app: Bell,
};

export default function NotificationPreviewSection({ events, enabledChannels }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel>('email');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  // Get enabled events from the events object
  const enabledEvents = Object.entries(events)
    .filter(([, config]) => config.enabled)
    .map(([key]) => key);

  const enabledChannelsList = (Object.entries(enabledChannels) as [NotificationChannel, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);

  const handlePreview = () => {
    const user = mockUsers.find(u => u.id === selectedUser);

    if (selectedEvent && user) {
      let content = `Notification: ${t(`settings.notifications.events.${selectedEvent}`)}`;

      // Replace mock variables
      content = content
        .replace(/\{deal_name\}/g, 'Sample Deal')
        .replace(/\{lead_name\}/g, 'Sample Lead')
        .replace(/\{owner_name\}/g, user.name)
        .replace(/\{company_name\}/g, 'Acme Corp')
        .replace(/\{deal_value\}/g, 'R$ 25,000')
        .replace(/\{contact_name\}/g, 'John Doe')
        .replace(/\{lead_email\}/g, 'lead@example.com')
        .replace(/\{lead_phone\}/g, '+55 11 99999-9999')
        .replace(/\{loss_reason\}/g, 'Budget constraints');

      setPreviewContent(content);
    }
  };

  const handleSendTest = () => {
    setIsOpen(false);
    setPreviewContent(null);
    setSelectedEvent('');
    setSelectedChannel('email');
    setSelectedUser('');

    toast({
      title: t('settings.notifications.preview.test-sent'),
      description: t('settings.notifications.preview.test-sent-description'),
    });
  };

  const Icon = channelIcons[selectedChannel];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('settings.notifications.preview.description')}
      </p>

      <div className="p-6 rounded-lg border bg-background/50 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <Send className="w-8 h-8 text-primary" />
        </div>
        <h4 className="font-medium mb-2">
          {t('settings.notifications.preview.title')}
        </h4>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {t('settings.notifications.preview.hint')}
        </p>
        <Button onClick={() => setIsOpen(true)}>
          <Send className="w-4 h-4 mr-2" />
          {t('settings.notifications.preview.send-test')}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('settings.notifications.preview.send-test')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Event Selection */}
            <div>
              <Label>{t('settings.notifications.preview.select-event')}</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder={t('settings.notifications.preview.event-placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {enabledEvents.map((eventKey) => (
                    <SelectItem key={eventKey} value={eventKey}>
                      {t(`settings.notifications.events.${eventKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Channel Selection */}
            <div>
              <Label>{t('settings.notifications.preview.select-channel')}</Label>
              <Select
                value={selectedChannel}
                onValueChange={(v: NotificationChannel) => setSelectedChannel(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {enabledChannelsList.map((ch) => (
                    <SelectItem key={ch} value={ch}>
                      {t(`settings.notifications.channels.${ch}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient Selection */}
            <div>
              <Label>{t('settings.notifications.preview.select-recipient')}</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder={t('settings.notifications.preview.recipient-placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview Button */}
            {selectedEvent && selectedChannel && selectedUser && !previewContent && (
              <Button variant="outline" className="w-full" onClick={handlePreview}>
                {t('settings.notifications.preview.generate')}
              </Button>
            )}

            {/* Preview Content */}
            {previewContent && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {t(`settings.notifications.channels.${selectedChannel}`)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{previewContent}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={!selectedEvent || !selectedChannel || !selectedUser}
            >
              <Send className="w-4 h-4 mr-2" />
              {t('settings.notifications.preview.send-test')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
