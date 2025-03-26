import { createContext, useContext, useEffect, useState } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'task' | 'leave' | 'salary' | 'complaint';
  relatedId?: string;
  // Add recipient field to track who should see the notification
  recipientId?: string; // If set, only this user should see it (besides HR)
  // Add a field to track if notification should be shown to HR or not
  showToHR?: boolean; // If false, don't show to HR (default is true)
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  // Add new method to get filtered notifications for current user
  getRelevantNotifications: (userId?: string, userRole?: string) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Load notifications from localStorage on initial render
  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        setNotifications(JSON.parse(storedNotifications));
      } catch (error) {
        console.error('Failed to parse stored notifications:', error);
      }
    }
  }, []);
  
  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);
  
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Check if a similar notification already exists to avoid duplicates
    const isDuplicate = notifications.some(
      n => n.type === notification.type && 
           n.relatedId === notification.relatedId && 
           n.title === notification.title &&
           !n.read
    );
    
    if (isDuplicate) return;
    
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
      showToHR: notification.showToHR !== false // Default to true if not specified
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Get notifications relevant to the current user
  const getRelevantNotifications = (userId?: string, userRole?: string): Notification[] => {
    if (!userId) return [];
    
    // HR gets to see notifications that are specifically for HR
    if (userRole === 'hr') {
      return notifications.filter(notification => {
        // Show notifications specifically for this HR user
        if (notification.recipientId === userId) return true;
        
        // Show notifications marked for HR view
        if (notification.showToHR === true) return true;
        
        return false;
      });
    }
    
    // For employees, filter notifications to only see their own
    return notifications.filter(notification => {
      // Employee can see notifications specifically for them
      if (notification.recipientId === userId) return true;
      
      // Employee can see general system-wide notifications (no specific recipient)
      if (!notification.recipientId) {
        // But for leave requests, task updates, or other employee-specific events,
        // only show their own
        if (notification.type === 'leave' && notification.title.includes('has requested')) {
          return false;
        }
        if (notification.type === 'task') {
          return false; // Tasks should be specifically assigned
        }
        return true;
      }
      
      // If notification has a recipient but it's not this user, don't show it
      return false;
    });
  };
  
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        getRelevantNotifications
      }}
    >
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
