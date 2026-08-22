/**
 * Custom React hook for WebSocket connection with auto-reconnect
 * Supports both native WebSocket and socket.io
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { io as _io, Socket as _Socket } from "socket.io-client";

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectionDelay?: number;
  maxReconnectionAttempts?: number;
  useSocketIO?: boolean;
  onPriceUpdate?: (data: any) => void;
  onAlert?: (data: any) => void;
  onSentimentUpdate?: (data: any) => void;
  onPortfolioUpdate?: (data: any) => void;
  onTradingSignal?: (data: any) => void;
  onBacktestComplete?: (data: any) => void;
  onOptimizationProgress?: (data: any) => void;
  onLeaderboardUpdate?: (data: any) => void;
  onStrategyShared?: (data: any) => void;
  onMarketStatus?: (data: any) => void;
  onNotification?: (data: any) => void;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  ws: WebSocket | null;
}

interface PendingMessage {
  type: string;
  [key: string]: any;
}

const DEFAULT_OPTIONS: UseWebSocketOptions = {
  autoConnect: true,
  reconnectionDelay: 1000,
  maxReconnectionAttempts: 5,
};

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect, reconnectionDelay, maxReconnectionAttempts } = options;

  // Get WebSocket URL from current location
  const getWsUrl = useCallback(() => {
    if (typeof window === "undefined") return "ws://localhost:3000/ws";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  }, []);

  const mergedOptions = useMemo(
    () => ({ ...DEFAULT_OPTIONS, autoConnect, reconnectionDelay, maxReconnectionAttempts }),
    [autoConnect, reconnectionDelay, maxReconnectionAttempts]
  );

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageHandlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const pendingMessagesRef = useRef<PendingMessage[]>([]);

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    ws: null,
  });

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const ws = new WebSocket(getWsUrl());

      ws.onopen = () => {
        console.info("[WebSocket] Connected");
        reconnectAttemptsRef.current = 0;
        wsRef.current = ws;
        setState({
          isConnected: true,
          isConnecting: false,
          error: null,
          ws,
        });

        // Send pending messages
        pendingMessagesRef.current.forEach((msg) => {
          ws.send(JSON.stringify(msg));
        });
        pendingMessagesRef.current = [];
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, ...payload } = data;

          // Call registered handlers for this message type
          const handlers = messageHandlersRef.current.get(type);
          if (handlers) {
            handlers.forEach((handler) => {
              try {
                handler(payload);
              } catch (err) {
                console.error(`[WebSocket] Error in handler for ${type}:`, err);
              }
            });
          }
        } catch (err) {
          console.error("[WebSocket] Error parsing message:", err);
        }
      };

      ws.onerror = (event) => {
        console.error("[WebSocket] Error:", event);
        setState((prev) => ({
          ...prev,
          error: new Error("WebSocket error"),
          isConnecting: false,
        }));
      };

      ws.onclose = () => {
        console.info("[WebSocket] Disconnected");
        wsRef.current = null;
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < mergedOptions.maxReconnectionAttempts!) {
          reconnectAttemptsRef.current++;
          const delay = mergedOptions.reconnectionDelay! * Math.pow(2, reconnectAttemptsRef.current - 1);
          console.info(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        isConnected: false,
        isConnecting: false,
        error: err,
        ws: null,
      });
    }
  }, [getWsUrl, mergedOptions.reconnectionDelay, mergedOptions.maxReconnectionAttempts]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState({
      isConnected: false,
      isConnecting: false,
      error: null,
      ws: null,
    });
  }, []);

  /**
   * Send message to server
   */
  const send = useCallback((message: PendingMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue message if not connected
      pendingMessagesRef.current.push(message);
    }
  }, []);

  /**
   * Subscribe to price updates
   */
  const subscribeToPrices = useCallback((tickers: string[]) => {
    send({
      type: "subscribe",
      tickers,
    });
  }, [send]);

  /**
   * Unsubscribe from price updates
   */
  const unsubscribeFromPrices = useCallback((tickers: string[]) => {
    send({
      type: "unsubscribe",
      tickers,
    });
  }, [send]);

  /**
   * Listen to message type
   */
  const on = useCallback((type: string, handler: (data: any) => void) => {
    if (!messageHandlersRef.current.has(type)) {
      messageHandlersRef.current.set(type, new Set());
    }
    messageHandlersRef.current.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = messageHandlersRef.current.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }, []);

  /**
   * Listen to price updates
   */
  const onPriceUpdate = useCallback(
    (callback: (data: any) => void) => {
      return on("price_update", callback);
    },
    [on]
  );

  // Auto-connect on mount
  useEffect(() => {
    if (mergedOptions.autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, mergedOptions.autoConnect]);

  return {
    ...state,
    connect,
    disconnect,
    send,
    subscribeToPrices,
    unsubscribeFromPrices,
    on,
    onPriceUpdate,
  };
}
