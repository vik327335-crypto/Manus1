/**
 * Custom React hook for WebSocket connection with auto-reconnect
 */

import { useEffect, useRef, useState, useCallback } from "react";
import io, { Socket } from "socket.io-client";

export interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectionDelay?: number;
  maxReconnectionAttempts?: number;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  socket: Socket | null;
}

const DEFAULT_OPTIONS: UseWebSocketOptions = {
  url: typeof window !== "undefined" && import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL 
    : "http://localhost:3000",
  autoConnect: true,
  reconnectionDelay: 1000,
  maxReconnectionAttempts: 5,
};

export function useWebSocket(options: UseWebSocketOptions = {}) {
  // Ensure URL is set correctly for browser environment
  const wsUrl = typeof window !== "undefined" && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : window?.location?.origin || "http://localhost:3000";
  
  const mergedOptions = { ...DEFAULT_OPTIONS, url: wsUrl, ...options };
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    socket: null,
  });

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const socket = io(mergedOptions.url!, {
        reconnection: true,
        reconnectionDelay: mergedOptions.reconnectionDelay,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: mergedOptions.maxReconnectionAttempts,
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        console.log("[WebSocket] Connected");
        reconnectAttemptsRef.current = 0;
        setState({
          isConnected: true,
          isConnecting: false,
          error: null,
          socket,
        });
      });

      socket.on("disconnect", () => {
        console.log("[WebSocket] Disconnected");
        setState((prev) => ({
          ...prev,
          isConnected: false,
        }));
      });

      socket.on("connect_error", (error) => {
        console.error("[WebSocket] Connection error:", error);
        reconnectAttemptsRef.current++;
        setState((prev) => ({
          ...prev,
          error: error as Error,
          isConnecting: false,
        }));
      });

      socket.on("error", (error) => {
        console.error("[WebSocket] Error:", error);
        setState((prev) => ({
          ...prev,
          error: new Error(error),
        }));
      });

      socketRef.current = socket;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        isConnected: false,
        isConnecting: false,
        error: err,
        socket: null,
      });
    }
  }, [mergedOptions]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({
        isConnected: false,
        isConnecting: false,
        error: null,
        socket: null,
      });
    }
  }, []);

  /**
   * Subscribe to price updates
   */
  const subscribeToPrices = useCallback((tickers: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("subscribe:prices", tickers);
    }
  }, []);

  /**
   * Subscribe to news updates
   */
  const subscribeToNews = useCallback((assets?: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("subscribe:news", assets);
    }
  }, []);

  /**
   * Subscribe to market updates
   */
  const subscribeToMarket = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("subscribe:market");
    }
  }, []);

  /**
   * Listen to price updates
   */
  const onPriceUpdate = useCallback(
    (callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on("price:update", callback);
        return () => {
          socketRef.current?.off("price:update", callback);
        };
      }
      return () => {};
    },
    []
  );

  /**
   * Listen to news updates
   */
  const onNewsUpdate = useCallback(
    (callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on("news:update", callback);
        return () => {
          socketRef.current?.off("news:update", callback);
        };
      }
      return () => {};
    },
    []
  );

  /**
   * Listen to market updates
   */
  const onMarketUpdate = useCallback(
    (callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on("market:update", callback);
        return () => {
          socketRef.current?.off("market:update", callback);
        };
      }
      return () => {};
    },
    []
  );

  /**
   * Emit custom event
   */
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  /**
   * Listen to custom event
   */
  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => {
        socketRef.current?.off(event, callback);
      };
    }
    return () => {};
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (mergedOptions.autoConnect) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [mergedOptions.autoConnect, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    subscribeToPrices,
    subscribeToNews,
    subscribeToMarket,
    onPriceUpdate,
    onNewsUpdate,
    onMarketUpdate,
    emit,
    on,
  };
}
