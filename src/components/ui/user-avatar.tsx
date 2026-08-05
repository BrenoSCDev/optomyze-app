/**
 * USER AVATAR
 *
 * Small avatar for displaying a user associated with a lead/deal card.
 * Shows the user's profile picture when available, falling back to initials.
 */

import { usePrivateFile } from '@/hooks/usePrivateFile';
import { leadAvatarSrc } from '@/lib/leadAvatars';
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
  /**
   * A contact's illustrated face, used only when there is no real photo.
   * Users and team members leave this unset and keep their initials — the
   * faces belong to contacts.
   */
  avatarKey?: string | null;
  className?: string;
}

const UserAvatar = ({ name, profilePicPath, avatarKey, className }: UserAvatarProps) => {
  const url = usePrivateFile(profilePicPath ?? undefined);
  // A real photo always wins; the face is the fallback, initials the last resort.
  const fallbackFace = url ? null : leadAvatarSrc(avatarKey);

  return (
    <div className={cn('rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-primary/20 text-primary font-semibold', className)}>
      {url || fallbackFace ? (
        <img src={url ?? fallbackFace!} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

export default UserAvatar;
