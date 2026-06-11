/**
 * USER AVATAR
 *
 * Small avatar for displaying a user associated with a lead/deal card.
 * Shows the user's profile picture when available, falling back to initials.
 */

import { usePrivateFile } from '@/hooks/usePrivateFile';
import { cn } from '@/lib/utils';

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface UserAvatarProps {
  name: string;
  profilePicPath?: string | null;
  className?: string;
}

const UserAvatar = ({ name, profilePicPath, className }: UserAvatarProps) => {
  const url = usePrivateFile(profilePicPath ?? undefined);

  return (
    <div className={cn('rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-primary/20 text-primary font-semibold', className)}>
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

export default UserAvatar;
