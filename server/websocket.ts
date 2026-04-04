import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'price_update' | 'alert' | 'ping' | 'pong';
  ticker?: string;
  price?: number;
  change?: number;
  timestamp?: number;
  data?: any;
}

interface ClientData {
  subscriptions: Set<string>;
  lastPing: number;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Map<WebSocket, ClientData>();
  const priceUpdates = new Map<string, { price: number; change: number }>();

  // Initialize with mock prices
  const mockTickers = ['BTC', 'ETH', 'ADA', 'SOL', 'XRP', 'DOGE', 'MATIC', 'AVAX'];
  mockTickers.forEach((ticker) => {
    priceUpdates.set(ticker, {
      price: Math.random() * 50000 + 1000,
      change: (Math.random() - 0.5) * 10,
    });
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    console.log('[WebSocket] Client connected from', req.socket.remoteAddress);

    // Initialize client data
    const clientData: ClientData = {
      subscriptions: new Set(),
      lastPing: Date.now(),
    };
    clients.set(ws, clientData);

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: 'connected',
        message: 'Connected to WebSocket server',
        timestamp: Date.now(),
      })
    );

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());

        if (message.type === 'subscribe' && message.ticker) {
          clientData.subscriptions.add(message.ticker);
          console.log(`[WebSocket] Client subscribed to ${message.ticker}`);

          // Send current price
          const price = priceUpdates.get(message.ticker);
          if (price) {
            ws.send(
              JSON.stringify({
                type: 'price_update',
                ticker: message.ticker,
                price: price.price,
                change: price.change,
                timestamp: Date.now(),
              })
            );
          }
        } else if (message.type === 'unsubscribe' && message.ticker) {
          clientData.subscriptions.delete(message.ticker);
          console.log(`[WebSocket] Client unsubscribed from ${message.ticker}`);
        } else if (message.type === 'ping') {
          clientData.lastPing = Date.now();
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      clients.delete(ws);
      console.log('[WebSocket] Client disconnected');
    });

    // Handle errors
    ws.on('error', (error: Error) => {
      console.error('[WebSocket] Error:', error);
    });
  });

  // Simulate price updates every 5 seconds
  setInterval(() => {
    mockTickers.forEach((ticker) => {
      const current = priceUpdates.get(ticker);
      if (current) {
        // Random walk for price
        const change = (Math.random() - 0.5) * 100;
        current.price += change;
        current.change = (change / current.price) * 100;

        // Broadcast to subscribed clients
        clients.forEach((clientData, ws) => {
          if (clientData.subscriptions.has(ticker) && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'price_update',
                ticker,
                price: current.price,
                change: current.change,
                timestamp: Date.now(),
              })
            );
          }
        });
      }
    });
  }, 5000);

  // Heartbeat to detect dead connections
  setInterval(() => {
    clients.forEach((clientData, ws) => {
      if (Date.now() - clientData.lastPing > 60000) {
        console.log('[WebSocket] Closing dead connection');
        ws.close();
      }
    });
  }, 30000);

  console.log('[WebSocket] WebSocket server initialized');
  return wss;
}
