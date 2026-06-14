import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useUserProfileModal } from '@/contexts/UserProfileModalContext';

interface ClickableUserProps {
  userId: number | string | undefined | null;
  className?: string;
  children: ReactNode;
}

/**
 * Wraps user avatar/name markup so clicking it opens the shared User Profile Modal.
 * Renders children unwrapped if no userId is available.
 */
const ClickableUser: React.FC<ClickableUserProps> = ({ userId, className, children }) => {
  const { openUserProfile } = useUserProfileModal();

  if (!userId) return <>{children}</>;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openUserProfile(Number(userId));
      }}
      className={cn('inline-flex items-center text-left hover:opacity-80 transition-opacity', className)}
    >
      {children}
    </button>
  );
};

export default ClickableUser;
