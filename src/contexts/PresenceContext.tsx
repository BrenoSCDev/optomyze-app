/**
 * PRESENCE CONTEXT
 *
 * Tracks which users in the company are currently online via a Laravel Echo
 * presence channel (`online-users.{companyId}`). Exposes `isUserOnline(id)`
 * so any component can render a live online/offline indicator for a user.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getEcho } from '@/services/echo';

interface PresenceMember {
  id: number;
  name: string;
}

interface PresenceContextType {
  onlineUserIds: Set<number>;
  isUserOnline: (userId: number | string | undefined | null) => boolean;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user?.company_id) return;
    const echo = getEcho();
    if (!echo) return;

    const channelName = `online-users.${user.company_id}`;
    const channel = echo.join(channelName);

    channel.here((members: PresenceMember[]) => {
      setOnlineUserIds(new Set(members.map((m) => Number(m.id))));
    });

    channel.joining((member: PresenceMember) => {
      setOnlineUserIds((prev) => new Set(prev).add(Number(member.id)));
    });

    channel.leaving((member: PresenceMember) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(Number(member.id));
        return next;
      });
    });

    return () => {
      echo.leave(channelName);
      setOnlineUserIds(new Set());
    };
  }, [user?.company_id]);

  const isUserOnline = useCallback(
    (userId: number | string | undefined | null) => {
      if (userId === undefined || userId === null) return false;
      return onlineUserIds.has(Number(userId));
    },
    [onlineUserIds]
  );

  return (
    <PresenceContext.Provider value={{ onlineUserIds, isUserOnline }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const useOnlinePresence = (): PresenceContextType => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('useOnlinePresence must be used within a PresenceProvider');
  }
  return context;
};
