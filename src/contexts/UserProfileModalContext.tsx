/**
 * USER PROFILE MODAL CONTEXT
 *
 * Provides a global `openUserProfile(userId, tab?)` action that opens a shared
 * User Profile Modal (Profile / Performance / Chat tabs) from anywhere in the app.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import UserProfileModal, { UserProfileTabId } from '@/components/users/profile-modal/UserProfileModal';

interface UserProfileModalContextType {
  openUserProfile: (userId: number, tab?: UserProfileTabId) => void;
  closeUserProfile: () => void;
}

const UserProfileModalContext = createContext<UserProfileModalContextType | undefined>(undefined);

export const UserProfileModalProvider = ({ children }: { children: ReactNode }) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [initialTab, setInitialTab] = useState<UserProfileTabId>('profile');
  const [isOpen, setIsOpen] = useState(false);

  const openUserProfile = (userId: number, tab: UserProfileTabId = 'profile') => {
    setSelectedUserId(userId);
    setInitialTab(tab);
    setIsOpen(true);
  };

  const closeUserProfile = () => setIsOpen(false);

  return (
    <UserProfileModalContext.Provider value={{ openUserProfile, closeUserProfile }}>
      {children}
      <UserProfileModal
        userId={selectedUserId}
        initialTab={initialTab}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </UserProfileModalContext.Provider>
  );
};

export const useUserProfileModal = (): UserProfileModalContextType => {
  const context = useContext(UserProfileModalContext);
  if (!context) {
    throw new Error('useUserProfileModal must be used within a UserProfileModalProvider');
  }
  return context;
};
