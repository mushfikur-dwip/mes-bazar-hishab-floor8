const VAPID_KEY = 'BFMQo4XarRLWqUlFqvDPa7LnX9fC8z-6NOT6YbfzygeHkbV1VmwTSdJARM7900Rb6jdjgzZPuy7c7E1c-WiWKfk';

export async function requestNotificationPermission(): Promise<string | null> {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported in this browser');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Register our push service worker
    const registration = await navigator.serviceWorker.register('/push-sw.js');
    await navigator.serviceWorker.ready;

    // Subscribe to push with VAPID key
    const subscription = await (registration as any).pushManager.subscribe({
      userVisuallyIndicatesPermission: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
    });

    // Return full subscription as JSON string
    return JSON.stringify(subscription.toJSON());
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
}

export function setupForegroundNotifications() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'PUSH_RECEIVED') {
      // Dispatch custom event for the app to handle
      window.dispatchEvent(new CustomEvent('push-notification', {
        detail: { title: event.data.title, body: event.data.body }
      }));
    }
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
