/**
 * INBOX AVATAR
 *
 * Channel-agnostic avatar used across the Global Inbox (chat list, conversation
 * header, message bubbles). Shows the contact's/agent's profile picture when
 * available, falling back to initials. When a `channel` is provided, a small
 * channel icon badge is overlaid in the bottom-right corner so new
 * integrations (Instagram, Messenger, SMS, ...) automatically get the same
 * avatar + badge treatment without any custom UI logic.
 */

import React from 'react';
import { InboxChannel } from '@/types/inbox';
import { cn } from '@/lib/utils';
import { usePrivateFile } from '@/hooks/usePrivateFile';
import ChannelIcon from './ChannelIcon';

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const BADGE_SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-4 h-4 p-[2px]',
  md: 'w-5 h-5 p-[3px]',
  lg: 'w-6 h-6 p-[3px]',
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface InboxAvatarProps {
  /** Storage path (or absolute URL) of the profile picture, if any. */
  profilePicPath?: string | null;
  /** Display name used to derive initials and the image alt text. */
  name: string;
  /** When provided, overlays a small channel icon badge in the bottom-right corner. */
  channel?: InboxChannel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Custom fallback icon shown instead of initials (e.g. for system/bot senders). */
  icon?: React.ReactNode;
}

const InboxAvatar: React.FC<InboxAvatarProps> = ({ profilePicPath, name, channel, size = 'md', className, icon }) => {
  const url = usePrivateFile(profilePicPath ?? undefined);

  return (
    <div className={cn('relative shrink-0', SIZE_CLASSES[size], className)}>
      {url ? (
        <img src={url} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <div className="w-full h-full rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
          {icon ?? getInitials(name)}
        </div>
      )}
      {channel && (
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 rounded-full bg-background border border-border flex items-center justify-center shadow-sm',
          BADGE_SIZE_CLASSES[size]
        )}>
          <ChannelIcon channel={channel} className="w-full h-full" />
        </div>
      )}
    </div>
  );
};

export default InboxAvatar;
