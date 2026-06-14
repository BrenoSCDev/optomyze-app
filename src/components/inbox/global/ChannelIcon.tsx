/**
 * CHANNEL ICON
 *
 * Maps an inbox channel to its representative icon, used across the Global
 * Inbox (chat list, conversation header, filter bar) to identify which
 * platform a conversation belongs to.
 */

import React from 'react';
import { FaWhatsapp, FaInstagram, FaFacebookMessenger, FaSms, FaTelegram } from 'react-icons/fa';
import { MessageCircle } from 'lucide-react';
import { InboxChannel } from '@/types/inbox';
import { cn } from '@/lib/utils';

interface ChannelIconProps {
  channel: InboxChannel;
  className?: string;
}

const ChannelIcon: React.FC<ChannelIconProps> = ({ channel, className }) => {
  switch (channel) {
    case 'whatsapp':
      return <FaWhatsapp className={cn('text-green-600', className)} />;
    case 'instagram':
      return <FaInstagram className={cn('text-pink-500', className)} />;
    case 'messenger':
      return <FaFacebookMessenger className={cn('text-blue-500', className)} />;
    case 'sms':
      return <FaSms className={cn('text-blue-400', className)} />;
    case 'telegram':
      return <FaTelegram className={cn('text-sky-500', className)} />;
    default:
      return <MessageCircle className={cn('text-muted-foreground', className)} />;
  }
};

export default ChannelIcon;
