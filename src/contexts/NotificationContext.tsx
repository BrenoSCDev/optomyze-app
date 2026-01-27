/**
 * NOTIFICATION CONTEXT
 * 
 * Manages real-time notifications for lead creation events
 * Subscribes to company-specific WebSocket channels
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

  // Add a new notification
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
    playNotificationSound();

    // Show toast notification
    toast.success(data.message, {
      description: 'Click to view lead details',
      action: {
        label: 'View',
        onClick: () => {
          markAsRead(notification.id);
          navigate(`/leads/${data.lead.funnel_id}/lead/${data.lead.id}`);
        },
      },
      duration: 5000,
    });
  }, [navigate, playNotificationSound]);

  // Mark a single notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

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

    // Cleanup on unmount or when company_id changes
    return () => {
      console.log(`🔔 Leaving channel: company.${user.company_id}`);
      echo.leave(`company.${user.company_id}`);
    };
  }, [user?.company_id, addNotification]);

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
