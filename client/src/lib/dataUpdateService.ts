import { clearCache } from './polygonDataService';

/**
 * Service for managing automatic background data updates
 * Handles scheduling, notifications, and update management
 */

export interface UpdateConfig {
  enabled: boolean;
  intervalMinutes: number;
  tickers: string[];
  lastUpdate?: Date;
  nextUpdate?: Date;
}

export interface UpdateNotification {
  id: string;
  ticker: string;
  timestamp: Date;
  status: 'success' | 'error';
  message: string;
}

class DataUpdateService {
  private config: UpdateConfig = {
    enabled: false,
    intervalMinutes: 60, // Default: update every hour
    tickers: ['BTC', 'ETH'],
    lastUpdate: undefined,
    nextUpdate: undefined,
  };

  private updateIntervalId: NodeJS.Timeout | null = null;
  private notifications: UpdateNotification[] = [];
  private updateListeners: ((notification: UpdateNotification) => void)[] = [];

  /**
   * Initialize the update service
   */
  initialize(config: Partial<UpdateConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    console.log('[DataUpdateService] Initialized with config:', this.config);

    if (this.config.enabled) {
      this.start();
    }
  }

  /**
   * Start automatic updates
   */
  start(): void {
    if (this.updateIntervalId) {
      console.warn('[DataUpdateService] Updates already running');
      return;
    }

    console.log('[DataUpdateService] Starting automatic updates');

    // Run first update immediately
    this.runUpdate();

    // Schedule subsequent updates
    const intervalMs = this.config.intervalMinutes * 60 * 1000;
    this.updateIntervalId = setInterval(() => {
      this.runUpdate();
    }, intervalMs);

    this.config.enabled = true;
  }

  /**
   * Stop automatic updates
   */
  stop(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
      console.log('[DataUpdateService] Stopped automatic updates');
    }

    this.config.enabled = false;
  }

  /**
   * Run update for all configured tickers
   */
  private async runUpdate(): Promise<void> {
    console.log('[DataUpdateService] Running update cycle');

    const updateTime = new Date();
    this.config.lastUpdate = updateTime;
    this.config.nextUpdate = new Date(updateTime.getTime() + this.config.intervalMinutes * 60 * 1000);

    for (const ticker of this.config.tickers) {
      try {
        // Clear cache to force fresh data fetch
        clearCache(ticker);

        // In production, would call API to fetch fresh data
        // For now, just clear cache and notify
        const notification: UpdateNotification = {
          id: `${ticker}-${Date.now()}`,
          ticker,
          timestamp: updateTime,
          status: 'success',
          message: `Updated ${ticker} data`,
        };

        this.addNotification(notification);
        this.notifyListeners(notification);

        console.log(`[DataUpdateService] Updated ${ticker}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const notification: UpdateNotification = {
          id: `${ticker}-${Date.now()}`,
          ticker,
          timestamp: updateTime,
          status: 'error',
          message: `Failed to update ${ticker}: ${errorMessage}`,
        };

        this.addNotification(notification);
        this.notifyListeners(notification);

        console.error(`[DataUpdateService] Failed to update ${ticker}:`, errorMessage);
      }
    }
  }

  /**
   * Add notification to history
   */
  private addNotification(notification: UpdateNotification): void {
    this.notifications.push(notification);

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(-100);
    }
  }

  /**
   * Subscribe to update notifications
   */
  onUpdate(callback: (notification: UpdateNotification) => void): () => void {
    this.updateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.updateListeners = this.updateListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(notification: UpdateNotification): void {
    this.updateListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('[DataUpdateService] Error in listener:', error);
      }
    });
  }

  /**
   * Get current config
   */
  getConfig(): UpdateConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  setConfig(cfg: Partial<UpdateConfig>): void {
    this.config = {
      ...this.config,
      ...cfg,
    };

    // Restart if enabled
    if (this.config.enabled) {
      this.stop();
      this.start();
    }

    console.log('[DataUpdateService] Config updated:', this.config);
  }

  /**
   * Add ticker to update list
   */
  addTicker(ticker: string): void {
    if (!this.config.tickers.includes(ticker.toUpperCase())) {
      this.config.tickers.push(ticker.toUpperCase());
      console.log('[DataUpdateService] Added ticker:', ticker);
    }
  }

  /**
   * Remove ticker from update list
   */
  removeTicker(ticker: string): void {
    this.config.tickers = this.config.tickers.filter(
      t => t !== ticker.toUpperCase()
    );
    console.log('[DataUpdateService] Removed ticker:', ticker);
  }

  /**
   * Get update history
   */
  getHistory(limit: number = 50): UpdateNotification[] {
    return this.notifications.slice(-limit);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.notifications = [];
    console.log('[DataUpdateService] History cleared');
  }

  /**
   * Get statistics
   */
  getStats(): {
    enabled: boolean;
    lastUpdate?: Date;
    nextUpdate?: Date;
    tickers: string[];
    totalUpdates: number;
    successCount: number;
    errorCount: number;
  } {
    const successCount = this.notifications.filter(n => n.status === 'success').length;
    const errorCount = this.notifications.filter(n => n.status === 'error').length;

    return {
      enabled: this.config.enabled,
      lastUpdate: this.config.lastUpdate,
      nextUpdate: this.config.nextUpdate,
      tickers: [...this.config.tickers],
      totalUpdates: this.notifications.length,
      successCount,
      errorCount,
    };
  }

  /**
   * Force immediate update
   */
  forceUpdate(): Promise<void> {
    console.log('[DataUpdateService] Forcing immediate update');
    return new Promise((resolve) => {
      this.runUpdate().then(() => {
        resolve();
      });
    });
  }
}

// Export singleton instance
export const dataUpdateService = new DataUpdateService();

// Auto-initialize from localStorage if enabled
if (typeof window !== 'undefined') {
  try {
    const savedConfig = localStorage.getItem('dataUpdateConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      dataUpdateService.initialize(config);
    }
  } catch (error) {
    console.error('[DataUpdateService] Error loading config from localStorage:', error);
  }
}
