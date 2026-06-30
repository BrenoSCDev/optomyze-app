/**
 * MINI AVATAR
 *
 * Small initials avatar used in calendar event chips and agenda cards
 * for leads and assignees, since neither carries a profile picture here.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { getAvatarColorClass, getInitials } from './calendarUtils';

interface MiniAvatarProps {
  name?: string | null;
  id?: number | null;
  className?: string;
}

export const MiniAvatar: React.FC<MiniAvatarProps> = ({ name, id, className }) => (
  <span
    className={cn(
      'inline-flex items-center justify-center rounded-full font-semibold shrink-0 h-5 w-5 text-[9px]',
      getAvatarColorClass(id, name),
      className
    )}
  >
    {getInitials(name)}
  </span>
);

export default MiniAvatar;
