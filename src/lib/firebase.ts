import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBfp-Ydv4CkkJnt099BPt6uYyDWQIPT5UY",
  authDomain: "meal-4d2bd.firebaseapp.com",
  projectId: "meal-4d2bd",
  storageBucket: "meal-4d2bd.firebasestorage.app",
  messagingSenderId: "642495202763",
  appId: "1:642495202763:web:dc8abc521a5d2fe2f9a24e",
  measurementId: "G-J8NDB9TD1H",
};

const VAPID_KEY = 'BFMQo4XarRLWqUlFqvDPa7LnX9fC8z-6NOT6YbfzygeHkbV1VmwTSdJARM7900Rb6jdjgzZPuy7c7E1c-WiWKfk';

const app = initializeApp(firebaseConfig);

let messaging: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('Push notifications not supported in this browser');
    return null;
  }
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
}

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const msg = getMessagingInstance();
    if (!msg) return null;

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  const msg = getMessagingInstance();
  if (!msg) return () => {};
  return onMessage(msg, callback);
}
