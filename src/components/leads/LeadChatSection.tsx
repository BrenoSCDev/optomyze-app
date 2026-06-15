/**
 * LEAD CHAT SECTION
 *
 * Embeds the unified Multi-Inbox conversation view (the same component used by
 * the Conversations module) for a single lead's chat. All message rendering,
 * pagination, sending and real-time sync are delegated to ChatConversation -
 * this wrapper only handles the "no chat exists yet" empty state and resolves
 * which InboxChat (across WhatsApp, Instagram, Messenger, ...) belongs to the
 * lead being viewed.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageCirclePlus, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInbox } from '@/contexts/InboxContext';
import { sendInboxMessage, fetchWhatsAppInstances, WhatsAppInstanceOption } from '@/services/globalInboxApi';
import { toast } from 'sonner';
import ChannelIcon from '@/components/inbox/global/ChannelIcon';
import ChatConversation from '@/components/inbox/global/ChatConversation';
import { InboxChat, InboxMessage, InboxInstance } from '@/types/inbox';

// Re-exported under Lead-prefixed names for Lead-detail consumers (LeadDetailTabs, etc.)
export type LeadInboxMessage = InboxMessage;
export type LeadInboxInstance = InboxInstance;
export type LeadInboxChat = InboxChat;

interface LeadChatSectionProps {
  chat: LeadInboxChat | null;
  leadId: number;
  leadPhone?: string;
  onMessageSent?: (message: LeadInboxMessage) => void;
}

const LeadChatSection: React.FC<LeadChatSectionProps> = ({
  chat,
  leadId,
  leadPhone,
  onMessageSent
}) => {
  const { t } = useLanguage();
  const { chats } = useInbox();

  // Start-conversation state (only relevant when the lead has no chat yet)
  const [instances, setInstances] = useState<WhatsAppInstanceOption[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [startMessage, setStartMessage] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!chat) {
      setLoadingInstances(true);
      fetchWhatsAppInstances()
        .then(setInstances)
        .catch(() => {})
        .finally(() => setLoadingInstances(false));
    }
  }, [chat]);

  // If no chat was loaded with the lead, watch the global inbox context for one
  // appearing in real time (e.g. the customer messages in, or a conversation is started below)
  const liveChat = useMemo(() => {
    if (chat) return null;
    return chats.find(c => c.lead_id === leadId) || null;
  }, [chat, chats, leadId]);

  const activeChat = chat || liveChat;

  const handleStartConversation = async () => {
    if (!selectedInstanceId || !startMessage.trim()) return;
    setIsStarting(true);
    try {
      await sendInboxMessage(Number(selectedInstanceId), {
        lead_id: leadId,
        text: startMessage.trim(),
        message_mode: 'external',
      });
      toast.success(t('chat.inbox.message-sent'));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('chat.inbox.message-error'));
    } finally {
      setIsStarting(false);
    }
  };

  // Empty state - no chat associated with this lead yet
  if (!activeChat) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col items-center justify-center px-4 py-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary">
            <ChannelIcon channel="whatsapp" className="h-8 w-8" />
          </div>
          <h4 className="mb-1 text-center font-medium text-foreground">{t('lead-details.tabs.chat-empty')}</h4>
          <p className="mb-6 max-w-xs text-center text-sm text-muted-foreground">
            {t('lead-details.tabs.chat-start-desc')}
          </p>

          <div className="w-full max-w-sm space-y-3">
            {leadPhone && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>{leadPhone}</span>
              </div>
            )}

            <Select
              value={selectedInstanceId}
              onValueChange={setSelectedInstanceId}
              disabled={loadingInstances}
            >
              <SelectTrigger className="border-border bg-background text-foreground">
                <SelectValue placeholder={t('chat.inbox.select-instance')} />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover text-popover-foreground">
                {instances.map(inst => (
                  <SelectItem key={inst.id} value={String(inst.id)}>
                    {inst.instance_name.split('_')[0]}
                    <span className="ml-2 text-xs text-muted-foreground">({inst.status})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              value={startMessage}
              onChange={e => setStartMessage(e.target.value)}
              placeholder={t('chat.inbox.type-message')}
              disabled={isStarting}
              className="resize-none border-border bg-background text-foreground placeholder:text-muted-foreground"
              rows={3}
            />

            <Button
              onClick={handleStartConversation}
              disabled={!selectedInstanceId || !startMessage.trim() || isStarting}
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCirclePlus className="h-4 w-4" />
              )}
              {t('chat.inbox.start-conversation')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden h-[600px] flex flex-col">
      <div className="flex-1 min-h-0">
        <ChatConversation chat={activeChat} onMessageSent={onMessageSent} hideLeadPreview />
      </div>
    </div>
  );
};

export default LeadChatSection;
