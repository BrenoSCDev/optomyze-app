/**
 * CHAT DETAILS COMPONENT
 *
 * Right panel displaying lead, channel, and chat metadata
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Phone,
  Layers,
  GitBranch,
  Server,
  Hash,
  Calendar,
  Clock,
  ChevronDown,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { InboxChat } from '@/types/inbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import ChannelIcon from './ChannelIcon';

interface ChatDetailsProps {
  chat: InboxChat | null;
  onClose?: () => void;
  showCloseButton?: boolean;
  defaultCollapsed?: boolean;
}

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <div className="text-muted-foreground shrink-0 mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate">{value || '-'}</p>
    </div>
  </div>
);

const ChatDetails: React.FC<ChatDetailsProps> = ({
  chat,
  onClose,
  showCloseButton = false,
  defaultCollapsed = false
}) => {
  const { t } = useLanguage();
  const [leadOpen, setLeadOpen] = React.useState(!defaultCollapsed);
  const [channelOpen, setChannelOpen] = React.useState(!defaultCollapsed);
  const [metadataOpen, setMetadataOpen] = React.useState(!defaultCollapsed);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLeadName = (): string => {
    if (chat?.lead?.first_name || chat?.lead?.last_name) {
      return `${chat.lead.first_name || ''} ${chat.lead.last_name || ''}`.trim();
    }
    return '-';
  };

  if (!chat) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-muted/10 p-4">
        <p className="text-sm text-muted-foreground text-center">
          {t('chat.inbox.select-chat-for-details')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold">{t('chat.inbox.chat-details')}</h3>
        {showCloseButton && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Lead Information */}
          <Collapsible open={leadOpen} onOpenChange={setLeadOpen}>
            <CollapsibleTrigger asChild>
              <motion.button
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg",
                  "bg-secondary/60 hover:bg-secondary text-secondary-foreground transition-colors"
                )}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium text-sm">
                    {t('chat.inbox.lead-information')}
                  </span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  leadOpen && "transform rotate-180"
                )} />
              </motion.button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-2 px-1"
              >
                <DetailItem
                  icon={<User className="h-4 w-4" />}
                  label={t('chat.inbox.name')}
                  value={getLeadName()}
                />
                <DetailItem
                  icon={<Phone className="h-4 w-4" />}
                  label={t('chat.inbox.phone')}
                  value={chat.lead?.phone || chat.external_contact_id}
                />
                <DetailItem
                  icon={<Layers className="h-4 w-4" />}
                  label={t('chat.inbox.funnel')}
                  value={chat.lead?.funnel?.name}
                />
                <DetailItem
                  icon={<GitBranch className="h-4 w-4" />}
                  label={t('chat.inbox.stage')}
                  value={chat.lead?.stage?.name}
                />
              </motion.div>
            </CollapsibleContent>
          </Collapsible>

          {/* Channel Information */}
          <Collapsible open={channelOpen} onOpenChange={setChannelOpen}>
            <CollapsibleTrigger asChild>
              <motion.button
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg",
                  "bg-secondary/60 hover:bg-secondary text-secondary-foreground transition-colors"
                )}
              >
                <div className="flex items-center gap-2">
                  <ChannelIcon channel={chat.channel} className="h-4 w-4" />
                  <span className="font-medium text-sm">
                    {t('chat.inbox.channel-information')}
                  </span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  channelOpen && "transform rotate-180"
                )} />
              </motion.button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-2 px-1"
              >
                <DetailItem
                  icon={<ChannelIcon channel={chat.channel} className="h-4 w-4" />}
                  label={t('chat.inbox.channel')}
                  value={t(`chat.inbox.filter-${chat.channel}`)}
                />
                {chat.instance && (
                  <DetailItem
                    icon={<Server className="h-4 w-4" />}
                    label={t('chat.inbox.instance-name')}
                    value={chat.instance.instance_name}
                  />
                )}
                <DetailItem
                  icon={<Hash className="h-4 w-4" />}
                  label={t('chat.inbox.instance-id')}
                  value={chat.channelable_id}
                />
              </motion.div>
            </CollapsibleContent>
          </Collapsible>

          {/* Chat Metadata */}
          <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
            <CollapsibleTrigger asChild>
              <motion.button
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg",
                  "bg-secondary/60 hover:bg-secondary text-secondary-foreground transition-colors"
                )}
              >
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  <span className="font-medium text-sm">
                    {t('chat.inbox.chat-metadata')}
                  </span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  metadataOpen && "transform rotate-180"
                )} />
              </motion.button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-2 px-1"
              >
                <DetailItem
                  icon={<Hash className="h-4 w-4" />}
                  label={t('chat.inbox.external-chat-id')}
                  value={chat.external_chat_id}
                />
                <DetailItem
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('chat.inbox.created-at')}
                  value={formatDate(chat.created_at)}
                />
                <DetailItem
                  icon={<Clock className="h-4 w-4" />}
                  label={t('chat.inbox.last-message-at')}
                  value={formatDate(chat.last_message_at)}
                />
              </motion.div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatDetails;
