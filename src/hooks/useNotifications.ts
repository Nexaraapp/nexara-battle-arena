import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { requestNotificationPermission, onMessageListener } from '@/integrations/firebase/config';
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

    // If already granted, get FCM token
    if (Notification.permission === 'granted') {
      setupNotifications();
    }
  }, []);

  const setupNotifications = async () => {
    try {
      // Get FCM token
      const token = await requestNotificationPermission();
      setFcmToken(token);

      // Save token to user's profile in Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: session.user.id,
            fcm_token: token,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error saving FCM token:', error);
        }
      }

      // Listen for foreground messages
      onMessageListener()
        .then((payload: any) => {
          toast(payload.notification.title, {
            description: payload.notification.body,
            action: payload.data?.action,
          });
        })
        .catch(err => console.error('Error receiving message:', err));

    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const requestPermission = async () => {
    try {
      await requestNotificationPermission();
      setNotificationPermission('granted');
      await setupNotifications();
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