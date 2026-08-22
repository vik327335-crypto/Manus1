import React from 'react';

type MessageHandler = (data: any) => void;
type ConnectionHandler = (connected: boolean) => void;

interface WebSocketMessage {
  type: 'price_update' | 'alert' | 'notification' | 'sync' | 'error';
  ticker?: string;
  price?: number;
  change?: number;
  timestamp?: number;
  message?: string;
  data?: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;

  constructor(url: string = '') {
    // Use current origin for WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.url = url || `${protocol}//${host}/ws`;
  }

  // Connect to WebSocket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.info('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          this.isIntentionallyClosed = false;
          this.startHeartbeat();
          this.notifyConnectionHandlers(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.info('[WebSocket] Disconnected');
          this.stopHeartbeat();
          this.notifyConnectionHandlers(false);

          if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.info(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect().catch(console.error), delay);
          }
        };
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket
  disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
  }

  // Send message to server
  send(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Not connected, cannot send message');
      return;
    }
    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error);
    }
  }

  // Subscribe to message type
  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  // Subscribe to connection changes
  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  // Subscribe to price updates for specific ticker
  subscribeToPriceUpdates(ticker: string): void {
    this.send({
      type: 'sync',
      data: { action: 'subscribe_price', ticker },
    });
  }

  // Unsubscribe from price updates
  unsubscribeFromPriceUpdates(ticker: string): void {
    this.send({
      type: 'sync',
      data: { action: 'unsubscribe_price', ticker },
    });
  }

  // Subscribe to watchlist alerts
  subscribeToAlerts(watchlistId: string): void {
    this.send({
      type: 'sync',
      data: { action: 'subscribe_alerts', watchlistId },
    });
  }

  // Unsubscribe from watchlist alerts
  unsubscribeFromAlerts(watchlistId: string): void {
    this.send({
      type: 'sync',
      data: { action: 'unsubscribe_alerts', watchlistId },
    });
  }

  // Get connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Private methods

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('[WebSocket] Handler error:', error);
        }
      });
    }

    // Log all messages for debugging
    console.info('[WebSocket] Message:', message);
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        console.error('[WebSocket] Connection handler error:', error);
      }
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'sync', data: { action: 'ping' } });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Export hook for React components
export function useWebSocket() {
  const [isConnected, setIsConnected] = React.useState(websocketService.isConnected());

  React.useEffect(() => {
    const unsubscribe = websocketService.onConnectionChange(setIsConnected);
    websocketService.connect().catch(console.error);
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected,
    send: (message: WebSocketMessage) => websocketService.send(message),
    on: (type: string, handler: MessageHandler) => websocketService.on(type, handler),
    subscribeToPriceUpdates: (ticker: string) =>
      websocketService.subscribeToPriceUpdates(ticker),
    unsubscribeFromPriceUpdates: (ticker: string) =>
      websocketService.unsubscribeFromPriceUpdates(ticker),
    subscribeToAlerts: (watchlistId: string) =>
      websocketService.subscribeToAlerts(watchlistId),
    unsubscribeFromAlerts: (watchlistId: string) =>
      websocketService.unsubscribeFromAlerts(watchlistId),
  };
}


