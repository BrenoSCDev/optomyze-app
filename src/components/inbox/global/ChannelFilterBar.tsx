/**
 * CHANNEL FILTER BAR
 *
 * Horizontal pill/tab row letting the user filter the Global Inbox chat list
 * by channel (All / WhatsApp / Instagram / Messenger / SMS).
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { InboxChannel } from '@/types/inbox';
import ChannelIcon from './ChannelIcon';

interface ChannelFilterBarProps {
  value: InboxChannel | 'all';
  onChange: (channel: InboxChannel | 'all') => void;
}

const FILTERS: (InboxChannel | 'all')[] = ['all', 'whatsapp', 'instagram', 'messenger', 'sms'];

const ChannelFilterBar: React.FC<ChannelFilterBarProps> = ({ value, onChange }) => {
  const { t } = useLanguage();

  const labelFor = (channel: InboxChannel | 'all'): string => {
    switch (channel) {
      case 'all': return t('chat.inbox.filter-all');
      case 'whatsapp': return t('chat.inbox.filter-whatsapp');
      case 'instagram': return t('chat.inbox.filter-instagram');
      case 'messenger': return t('chat.inbox.filter-messenger');
      case 'sms': return t('chat.inbox.filter-sms');
      default: return channel;
    }
  };

  return (
    <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border-b border-border/50 overflow-x-auto">
      {FILTERS.map(channel => (
        <button
          key={channel}
          onClick={() => onChange(channel)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
            value === channel
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          {channel !== 'all' && <ChannelIcon channel={channel} className="h-3.5 w-3.5" />}
          {labelFor(channel)}
        </button>
      ))}
    </div>
  );
};

export default ChannelFilterBar;
