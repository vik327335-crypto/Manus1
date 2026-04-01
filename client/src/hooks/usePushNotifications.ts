import { useEffect, useState } from 'react';

export interface PushNotificationOptions {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  sound?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      registerServiceWorker();
      checkSubscription();
    }
  }, []);

  // Register Service Worker
  const registerServiceWorker = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });
        console.log('[ServiceWorker] Registered:', registration);
      }
    } catch (error) {
      console.error('[ServiceWorker] Registration failed:', error);
    }
  };

  // Check current subscription status
  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      setIsSubscribed(!!sub);
    } catch (error) {
      console.error('[PushNotifications] Failed to check subscription:', error);
    }
  };

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('[PushNotifications] Not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('[PushNotifications] Permission request failed:', error);
      return false;
    }
  };

  // Subscribe to push notifications
  const subscribe = async (vapidPublicKey?: string): Promise<boolean> => {
    try {
      const permission = await requestPermission();
      if (!permission) {
        console.warn('[PushNotifications] Permission denied');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const options: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
      };

      if (vapidPublicKey) {
        options.applicationServerKey = urlBase64ToUint8Array(vapidPublicKey) as BufferSource;
      }

      const sub = await registration.pushManager.subscribe(options);
      setSubscription(sub);
      setIsSubscribed(true);
      console.log('[PushNotifications] Subscribed:', sub);
      return true;
    } catch (error) {
      console.error('[PushNotifications] Subscription failed:', error);
      return false;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async (): Promise<boolean> => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
        setIsSubscribed(false);
        console.log('[PushNotifications] Unsubscribed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PushNotifications] Unsubscribe failed:', error);
      return false;
    }
  };

  // Send local notification (for testing)
  const sendLocalNotification = async (options: PushNotificationOptions) => {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(options.title, {
        body: options.body,
        tag: options.tag || 'canslim-notification',
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        requireInteraction: options.requireInteraction || false,
        data: options.data || {},
      });
    } catch (error) {
      console.error('[PushNotifications] Failed to send notification:', error);
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    sendLocalNotification,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
