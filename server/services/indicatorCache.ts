/**
 * Оптимизированный кэш для индикаторов day trading
 * Использует LRU (Least Recently Used) стратегию для управления памятью
 */

export interface CachedIndicator {
  timestamp: number;
  rsi?: number;
  macd?: { line: number; signal: number; histogram: number };
  bollingerBands?: { upper: number; middle: number; lower: number };
  volumeProfile?: Map<number, number>;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

/**
 * LRU Cache для индикаторов
 */
export class IndicatorCache {
  private cache: Map<string, CachedIndicator> = new Map();
  private accessOrder: string[] = [];
  private maxSize: number;
  private ttl: number; // Time to live в миллисекундах
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 10000, ttl: number = 60000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Получить индикатор из кэша
   */
  get(key: string): CachedIndicator | null {
    const item = this.cache.get(key);

    if (!item) {
      this.misses++;
      return null;
    }

    // Проверка TTL
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      this.misses++;
      return null;
    }

    // Обновление порядка доступа (LRU)
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);
    this.hits++;

    return item;
  }

  /**
   * Сохранить индикатор в кэш
   */
  set(key: string, value: CachedIndicator): void {
    // Если элемент уже существует, удалить его
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
    }

    // Если кэш переполнен, удалить самый старый элемент
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    // Добавить новый элемент
    value.expiresAt = Date.now() + this.ttl;
    this.cache.set(key, value);
    this.accessOrder.push(key);
  }

  /**
   * Очистить кэш
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Получить статистику кэша
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }

  /**
   * Удалить устаревшие элементы
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    const keysToDelete: string[] = [];

    this.cache.forEach((value, key) => {
      if (now > value.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      removed++;
    });

    return removed;
  }

  /**
   * Очистить кэш в байтах (приблизительно)
   */
  getMemoryUsage(): number {
    let bytes = 0;

    this.cache.forEach((value, key) => {
      bytes += key.length * 2; // Строка
      bytes += 8; // timestamp
      bytes += 8; // expiresAt
      if (value.rsi) bytes += 8;
      if (value.macd) bytes += 24;
      if (value.bollingerBands) bytes += 24;
      if (value.volumeProfile) bytes += value.volumeProfile.size * 16;
    });

    return bytes;
  }
}

/**
 * Оптимизированный расчёт индикаторов с кэшированием
 */
export class OptimizedIndicatorCalculator {
  private cache: IndicatorCache;
  private batchSize: number = 100; // Размер батча для обработки

  constructor(cacheSize: number = 10000, ttl: number = 60000) {
    this.cache = new IndicatorCache(cacheSize, ttl);
  }

  /**
   * Расчёт RSI с кэшированием
   */
  calculateRSI(
    prices: number[],
    period: number = 14,
    cacheKey?: string
  ): number | null {
    // Проверить кэш
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached?.rsi !== undefined) {
        return cached.rsi;
      }
    }

    if (prices.length < period + 1) {
      return null;
    }

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    // Сохранить в кэш
    if (cacheKey) {
      const cached = this.cache.get(cacheKey) || { timestamp: Date.now(), expiresAt: 0 };
      cached.rsi = rsi;
      this.cache.set(cacheKey, cached as CachedIndicator);
    }

    return Math.round(rsi * 100) / 100;
  }

  /**
   * Расчёт MACD с кэшированием
   */
  calculateMACD(
    prices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9,
    cacheKey?: string
  ): { line: number; signal: number; histogram: number } | null {
    // Проверить кэш
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached?.macd) {
        return cached.macd;
      }
    }

    if (prices.length < slowPeriod) {
      return null;
    }

    // Расчёт EMA
    const emaFast = this.calculateEMA(prices, fastPeriod);
    const emaSlow = this.calculateEMA(prices, slowPeriod);

    const macdLine = emaFast - emaSlow;

    // Расчёт сигнальной линии (EMA от MACD)
    const macdValues: number[] = [];
    for (let i = slowPeriod - 1; i < prices.length; i++) {
      const fast = this.calculateEMA(prices.slice(0, i + 1), fastPeriod);
      const slow = this.calculateEMA(prices.slice(0, i + 1), slowPeriod);
      macdValues.push(fast - slow);
    }

    const signalLine = this.calculateEMA(macdValues, signalPeriod);
    const histogram = macdLine - signalLine;

    const result = {
      line: Math.round(macdLine * 10000) / 10000,
      signal: Math.round(signalLine * 10000) / 10000,
      histogram: Math.round(histogram * 10000) / 10000,
    };

    // Сохранить в кэш
    if (cacheKey) {
      const cached = this.cache.get(cacheKey) || { timestamp: Date.now(), expiresAt: 0 };
      cached.macd = result;
      this.cache.set(cacheKey, cached as CachedIndicator);
    }

    return result;
  }

  /**
   * Расчёт EMA (Exponential Moving Average)
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;

    const k = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }

    return ema;
  }

  /**
   * Расчёт Bollinger Bands с кэшированием
   */
  calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDev: number = 2,
    cacheKey?: string
  ): { upper: number; middle: number; lower: number } | null {
    // Проверить кэш
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached?.bollingerBands) {
        return cached.bollingerBands;
      }
    }

    if (prices.length < period) {
      return null;
    }

    // Расчёт SMA (Simple Moving Average)
    const sma =
      prices.slice(-period).reduce((a, b) => a + b, 0) / period;

    // Расчёт стандартного отклонения
    const variance =
      prices
        .slice(-period)
        .reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    const result = {
      upper: Math.round((sma + stdDev * standardDeviation) * 100) / 100,
      middle: Math.round(sma * 100) / 100,
      lower: Math.round((sma - stdDev * standardDeviation) * 100) / 100,
    };

    // Сохранить в кэш
    if (cacheKey) {
      const cached = this.cache.get(cacheKey) || { timestamp: Date.now(), expiresAt: 0 };
      cached.bollingerBands = result;
      this.cache.set(cacheKey, cached as CachedIndicator);
    }

    return result;
  }

  /**
   * Получить статистику кэша
   */
  getCacheStats(): CacheStats {
    return this.cache.getStats();
  }

  /**
   * Очистить кэш
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Получить использование памяти кэшем
   */
  getMemoryUsage(): number {
    return this.cache.getMemoryUsage();
  }

  /**
   * Очистить устаревшие элементы
   */
  cleanup(): number {
    return this.cache.cleanup();
  }
}

/**
 * Оптимизированная обработка потока данных (streaming)
 */
export class StreamingIndicatorProcessor {
  private calculator: OptimizedIndicatorCalculator;
  private buffer: number[] = [];
  private maxBufferSize: number = 1000;
  private processedCount: number = 0;

  constructor(cacheSize: number = 10000) {
    this.calculator = new OptimizedIndicatorCalculator(cacheSize);
  }

  /**
   * Добавить новую цену в поток
   */
  addPrice(price: number): void {
    this.buffer.push(price);

    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    this.processedCount++;
  }

  /**
   * Получить текущие индикаторы
   */
  getCurrentIndicators(): {
    rsi?: number;
    macd?: { line: number; signal: number; histogram: number };
    bollingerBands?: { upper: number; middle: number; lower: number };
  } {
    if (this.buffer.length < 26) {
      return {};
    }

    const cacheKey = `stream-${this.processedCount}`;

    return {
      rsi: this.calculator.calculateRSI(this.buffer, 14, cacheKey) || undefined,
      macd: this.calculator.calculateMACD(this.buffer, 12, 26, 9, cacheKey) || undefined,
      bollingerBands: this.calculator.calculateBollingerBands(this.buffer, 20, 2, cacheKey) || undefined,
    };
  }

  /**
   * Получить статистику
   */
  getStats(): {
    processedPrices: number;
    bufferSize: number;
    cacheStats: CacheStats;
    memoryUsage: number;
  } {
    return {
      processedPrices: this.processedCount,
      bufferSize: this.buffer.length,
      cacheStats: this.calculator.getCacheStats(),
      memoryUsage: this.calculator.getMemoryUsage() + this.buffer.length * 8,
    };
  }

  /**
   * Очистить буфер
   */
  clear(): void {
    this.buffer = [];
    this.processedCount = 0;
    this.calculator.clearCache();
  }
}
