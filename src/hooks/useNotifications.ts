
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Get current permission status
    setNotificationPermission(Notification.permission);

    // If already granted, setup notifications
    if (Notification.permission === 'granted') {
      setupBasicNotifications();
    }
  }, []);

  const setupBasicNotifications = async () => {
    try {
      // For now, we'll use basic web notifications without Firebase
      // Firebase integration can be added later when properly configured
      console.log('Basic notifications setup complete');
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        await setupBasicNotifications();
        toast.success('Notifications enabled successfully');
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setNotificationPermission('denied');
    }
  };

  return {
    fcmToken,
    notificationPermission,
    requestPermission,
    isSupported: 'Notification' in window
  };
};
