
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// Only initialize Firebase if config is present
let app: any = null;
let messaging: any = null;
let analytics: any = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    analytics = getAnalytics(app);
  } else {
    console.log('Firebase configuration incomplete, skipping initialization');
  }
} catch (error) {
  console.warn('Firebase initialization failed:', error);
}

export const requestNotificationPermission = async () => {
  if (!messaging) {
    throw new Error('Firebase messaging not initialized');
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      return token;
    }
    throw new Error('Notification permission denied');
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    throw error;
  }
};

export const onMessageListener = () => {
  if (!messaging) {
    return Promise.reject('Firebase messaging not initialized');
  }
  
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

export { app, messaging, analytics };
