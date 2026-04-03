import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOnline: navigator.onLine,
    updateAvailable: false,
  });

  useEffect(() => {
    if (!state.isSupported) {
      console.log('[useServiceWorker] Service Worker not supported');
      return;
    }

    // Register Service Worker
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          '/service-worker-enhanced.js',
          { scope: '/' }
        );
        console.log('[useServiceWorker] Service Worker registered:', registration);
        setState((prev) => ({ ...prev, isRegistered: true }));

        // Check for updates periodically
        setInterval(() => {
          registration.update().catch((err) => {
            console.error('[useServiceWorker] Update check failed:', err);
          });
        }, 60000); // Check every minute

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                console.log('[useServiceWorker] Update available');
                setState((prev) => ({ ...prev, updateAvailable: true }));
              }
            });
          }
        });
      } catch (error) {
        console.error('[useServiceWorker] Registration failed:', error);
      }
    };

    registerServiceWorker();

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('[useServiceWorker] Online');
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      console.log('[useServiceWorker] Offline');
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.isSupported]);

  // Function to clear cache
  const clearCache = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      console.log('[useServiceWorker] Cache clear requested');
    }
  };

  // Function to request update
  const requestUpdate = async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    registrations.forEach((registration) => {
      registration.update();
    });
  };

  // Function to skip waiting and activate new Service Worker
  const skipWaiting = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  // Function to trigger background sync
  const triggerSync = async (tag: string) => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register(tag);
        console.log('[useServiceWorker] Background sync registered:', tag);
      } catch (error) {
        console.error('[useServiceWorker] Background sync failed:', error);
      }
    }
  };

  return {
    ...state,
    clearCache,
    requestUpdate,
    skipWaiting,
    triggerSync,
  };
}
