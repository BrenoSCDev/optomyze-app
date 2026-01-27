/**
 * NOTIFICATION CONTEXT
 * 
 * Manages real-time notifications for lead creation events
 * Subscribes to company-specific WebSocket channels
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { getEcho } from '@/services/echo';

// TypeScript interfaces
export interface LeadNotification {
  id: string;
  type: 'lead_created';
  message: string;
  lead: {
    id: number;
    funnel_id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  creator: {
    id: number;
    name: string;
    profile_pic?: string;
  };
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: LeadNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<LeadNotification[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('🔔 Could not play notification sound:', err));
    } catch (err) {
      console.log('🔔 Error creating audio:', err);
    }
  }, []);

  // Use refs to store latest callbacks for stable event handlers
  const navigateRef = useRef(navigate);
  const playNotificationSoundRef = useRef(playNotificationSound);
  
  // Keep refs updated
  useEffect(() => {
    navigateRef.current = navigate;
    playNotificationSoundRef.current = playNotificationSound;
  }, [navigate, playNotificationSound]);

  // Mark a single notification as read - defined BEFORE addNotification since it's used there
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

  // Ref for markAsRead to use in toast callback without causing re-renders
  const markAsReadRef = useRef(markAsRead);
  useEffect(() => {
    markAsReadRef.current = markAsRead;
  }, [markAsRead]);

  // Add a new notification - STABLE callback (no deps that change on route)
  const addNotification = useCallback((data: Omit<LeadNotification, 'read'>) => {
    const notification: LeadNotification = { ...data, read: false };
    
    setNotifications(prev => {
      // Prevent duplicates
      if (prev.some(n => n.id === notification.id)) {
        return prev;
      }
      // Add new notification at the beginning, keep max 50
      return [notification, ...prev].slice(0, 50);
    });

    // Play notification sound
    playNotificationSoundRef.current();

    // Show toast notification
    toast.success(data.message, {
      description: 'Click to view lead details',
      action: {
        label: 'View',
        onClick: () => {
          markAsReadRef.current(notification.id);
          navigateRef.current(`/leads/${data.lead.funnel_id}/lead/${data.lead.id}`);
        },
      },
      duration: 5000,
    });
  }, []); // Empty deps = stable callback, uses refs for dynamic values

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Subscribe to WebSocket channel when user is authenticated
  // IMPORTANT: Only depends on company_id, NOT on callbacks (they're stable via refs)
  useEffect(() => {
    if (!user?.company_id) {
      console.log('🔔 No company_id, skipping WebSocket subscription');
      return;
    }

    const echo = getEcho();
    if (!echo) {
      console.log('🔔 Echo not initialized, skipping WebSocket subscription');
      return;
    }

    console.log(`🔔 Subscribing to channel: company.${user.company_id}`);

    // Subscribe to private channel
    const channel = echo.private(`company.${user.company_id}`);

    // Listen for lead.created events (note the dot prefix for Laravel Echo)
    channel.listen('.lead.created', (data: Omit<LeadNotification, 'read'>) => {
      console.log('🔔 Received lead.created event:', data);
      addNotification(data);
    });

    console.log('🔔 Subscribed to channel successfully');

    // Cleanup - only on logout or company change, NOT on route navigation
    return () => {
      console.log(`🔔 Leaving channel: company.${user.company_id}`);
      echo.leave(`company.${user.company_id}`);
    };
  }, [user?.company_id, addNotification]); // addNotification is now stable (only depends on markAsRead which is stable)

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
