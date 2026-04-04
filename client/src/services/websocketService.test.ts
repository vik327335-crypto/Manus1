import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { websocketService } from './websocketService';

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = 0;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  simulateOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

describe('WebSocket Service', () => {
  let mockWs: MockWebSocket;

  beforeEach(() => {
    // Mock global WebSocket
    global.WebSocket = MockWebSocket as any;
    mockWs = new MockWebSocket('ws://localhost:8080');
  });

  afterEach(() => {
    websocketService.disconnect();
  });

  it('should connect to WebSocket server', async () => {
    const connectPromise = websocketService.connect();
    mockWs.simulateOpen();
    await connectPromise;
    expect(websocketService.isConnected()).toBe(true);
  });

  it('should handle connection changes', async () => {
    const connectionChanges: boolean[] = [];
    websocketService.onConnectionChange((connected) => {
      connectionChanges.push(connected);
    });

    await websocketService.connect();
    mockWs.simulateOpen();

    expect(connectionChanges).toContain(true);
  });

  it('should subscribe to price updates', async () => {
    await websocketService.connect();
    mockWs.simulateOpen();

    const messages: any[] = [];
    websocketService.on('price_update', (msg) => {
      messages.push(msg);
    });

    websocketService.subscribeToPriceUpdates('BTC');

    mockWs.simulateMessage({
      type: 'price_update',
      ticker: 'BTC',
      price: 45000,
      change: 500,
    });

    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].ticker).toBe('BTC');
  });

  it('should subscribe to alerts', async () => {
    await websocketService.connect();
    mockWs.simulateOpen();

    const alerts: any[] = [];
    websocketService.on('alert', (msg) => {
      alerts.push(msg);
    });

    websocketService.subscribeToAlerts('watchlist-1');

    mockWs.simulateMessage({
      type: 'alert',
      ticker: 'ETH',
      message: 'Price threshold reached',
      price: 2500,
    });

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].ticker).toBe('ETH');
  });

  it('should handle reconnection on connection loss', async () => {
    const connectSpy = vi.spyOn(websocketService, 'connect');

    await websocketService.connect();
    mockWs.simulateOpen();

    expect(websocketService.isConnected()).toBe(true);

    mockWs.close();

    // Wait for reconnection attempt
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(connectSpy).toHaveBeenCalled();
  });

  it('should handle multiple message types', async () => {
    await websocketService.connect();
    mockWs.simulateOpen();

    const priceUpdates: any[] = [];
    const alerts: any[] = [];
    const notifications: any[] = [];

    websocketService.on('price_update', (msg) => priceUpdates.push(msg));
    websocketService.on('alert', (msg) => alerts.push(msg));
    websocketService.on('notification', (msg) => notifications.push(msg));

    mockWs.simulateMessage({ type: 'price_update', ticker: 'BTC', price: 45000 });
    mockWs.simulateMessage({ type: 'alert', ticker: 'ETH', message: 'Alert!' });
    mockWs.simulateMessage({ type: 'notification', message: 'Notification' });

    expect(priceUpdates.length).toBeGreaterThan(0);
    expect(alerts.length).toBeGreaterThan(0);
    expect(notifications.length).toBeGreaterThan(0);
  });

  it('should disconnect gracefully', async () => {
    await websocketService.connect();
    mockWs.simulateOpen();

    expect(websocketService.isConnected()).toBe(true);

    websocketService.disconnect();

    expect(websocketService.isConnected()).toBe(false);
  });

  it('should handle heartbeat', async () => {
    await websocketService.connect();
    mockWs.simulateOpen();

    const sendSpy = vi.spyOn(mockWs, 'send');

    // Wait for heartbeat
    await new Promise((resolve) => setTimeout(resolve, 35000));

    expect(sendSpy).toHaveBeenCalledWith(JSON.stringify({ type: 'heartbeat' }));
  });

  it('should emit events to multiple listeners', async () => {
    await websocketService.connect();
    mockWs.simulateOpen();

    const listener1Messages: any[] = [];
    const listener2Messages: any[] = [];

    websocketService.on('price_update', (msg) => listener1Messages.push(msg));
    websocketService.on('price_update', (msg) => listener2Messages.push(msg));

    mockWs.simulateMessage({
      type: 'price_update',
      ticker: 'BTC',
      price: 45000,
    });

    expect(listener1Messages.length).toBeGreaterThan(0);
    expect(listener2Messages.length).toBeGreaterThan(0);
  });
});
