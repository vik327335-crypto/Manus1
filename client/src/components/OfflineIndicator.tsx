import { useEffect, useState } from 'react';
import { websocketService } from '@/services/websocketService';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wsConnected, setWsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const swState = useServiceWorker();

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Try to reconnect WebSocket
      websocketService.connect().catch(console.error);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for WebSocket connection changes
    const unsubscribe = websocketService.onConnectionChange((connected) => {
      setWsConnected(connected);
      setIsReconnecting(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await websocketService.connect();
    } catch (error) {
      console.error('Reconnection failed:', error);
      setIsReconnecting(false);
    }
  };

  // Determine status
  const isFullyOnline = isOnline && wsConnected;
  const isPartiallyOnline = isOnline && !wsConnected;
  const isOffline = !isOnline;

  // Don't show indicator if everything is fine
  if (isFullyOnline && swState.isRegistered) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 rounded-lg shadow-lg p-3 flex items-center gap-2 text-sm font-medium',
        isOffline
          ? 'bg-red-50 text-red-700 border border-red-200'
          : isPartiallyOnline
            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
      )}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline - Using cached data</span>
        </>
      ) : isPartiallyOnline ? (
        <>
          <RefreshCw className={cn('h-4 w-4', isReconnecting && 'animate-spin')} />
          <span>Reconnecting...</span>
          {!isReconnecting && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReconnect}
              className="h-6 px-2 ml-2"
            >
              Retry
            </Button>
          )}
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4" />
          <span>Service Worker ready</span>
        </>
      )}
    </div>
  );
}
