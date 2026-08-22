import { describe, it, expect, beforeEach } from 'vitest';
import { OptimizedIndicatorCalculator, StreamingIndicatorProcessor } from './indicatorCache';
import { calculateRiskRewardRatio, calculatePositionSize, calculatePnL } from './riskManagement';
import { DEFAULT_DAY_TRADING_CONFIG, validateConfig } from '../config/dayTradingConfig';

describe('Day Trading Integration Tests', () => {
  let calculator: OptimizedIndicatorCalculator;
  let processor: StreamingIndicatorProcessor;
  let prices: number[];

  beforeEach(() => {
    calculator = new OptimizedIndicatorCalculator(10000, 60000);
    processor = new StreamingIndicatorProcessor(10000);

    // Генерируем тестовые цены
    prices = [];
    let price = 45000;
    for (let i = 0; i < 100; i++) {
      price += (Math.random() - 0.5) * 100;
      prices.push(price);
    }
  });

  describe('Full Trading Workflow', () => {
    it('should complete full trading workflow from signal to position management', () => {
      // 1. Добавляем цены в процессор
      prices.forEach((price) => processor.addPrice(price));

      // 2. Получаем текущие индикаторы
      const indicators = processor.getCurrentIndicators();
      expect(indicators.rsi).toBeDefined();
      expect(indicators.macd).toBeDefined();
      expect(indicators.bollingerBands).toBeDefined();

      // 3. Проверяем условия для входа
      const rsi = indicators.rsi || 50;
      const shouldEnterLong = rsi < 30; // Перепроданность

      if (shouldEnterLong) {
        // 4. Рассчитываем размер позиции
        const entryPrice = prices[prices.length - 1];
        const stopLoss = entryPrice - 200;
        const takeProfit = entryPrice + 500;

        const positionSize = calculatePositionSize(10000, 2, entryPrice, stopLoss);
        expect(positionSize).toBeGreaterThan(0);

        // 5. Проверяем R:R соотношение
        const rrr = calculateRiskRewardRatio(entryPrice, stopLoss, takeProfit);
        expect(rrr.ratio).toBeGreaterThanOrEqual(1.5);

        // 6. Открываем позицию
        const position = {
          id: 'test-1',
          asset: 'BTC/USD',
          entryPrice,
          currentPrice: entryPrice,
          quantity: positionSize,
          stopLoss,
          takeProfit,
          entryTime: Date.now(),
          status: 'OPEN' as const,
          pnl: 0,
          pnlPercentage: 0,
        };

        // 7. Обновляем цену и проверяем P&L
        position.currentPrice = entryPrice + 100;
        const pnl = calculatePnL(position);
        expect(pnl.pnl).toBeGreaterThan(0);
        expect(pnl.status).toBe('profit');
      }
    });

    it('should handle multiple positions simultaneously', () => {
      const positions = [];

      // Открываем 3 позиции
      for (let i = 0; i < 3; i++) {
        const entryPrice = 45000 + i * 100;
        const stopLoss = entryPrice - 200;
        const takeProfit = entryPrice + 500;

        positions.push({
          id: `pos-${i}`,
          asset: `BTC/USD`,
          entryPrice,
          currentPrice: entryPrice,
          quantity: 1,
          stopLoss,
          takeProfit,
          entryTime: Date.now(),
          status: 'OPEN' as const,
          pnl: 0,
          pnlPercentage: 0,
        });
      }

      expect(positions.length).toBe(3);

      // Обновляем цены
      positions.forEach((pos, index) => {
        pos.currentPrice = pos.entryPrice + (index + 1) * 50;
        const pnl = calculatePnL(pos);
        pos.pnl = pnl.pnl;
        pos.pnlPercentage = pnl.pnlPercentage;
        expect(pnl.pnl).toBeGreaterThan(0);
      });

      // Проверяем общий P&L
      const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
      expect(totalPnL).toBeGreaterThan(0);
    });
  });

  describe('Indicator Caching Performance', () => {
    it('should improve performance with caching', () => {
      const iterations = 100;
      const cacheKey = 'test-cache';

      // Первый проход заполняет кэш и создаёт cache hits после первого расчёта.
      for (let i = 0; i < iterations; i++) {
        calculator.calculateRSI(prices, 14, cacheKey);
      }
      const warmedStats = calculator.getCacheStats();

      // Второй проход должен обслуживаться из уже заполненного кэша.
      for (let i = 0; i < iterations; i++) {
        calculator.calculateRSI(prices, 14, cacheKey);
      }

      const stats = calculator.getCacheStats();
      expect(warmedStats.misses).toBeGreaterThan(0);
      expect(warmedStats.hits).toBeGreaterThan(0);
      expect(stats.hits).toBeGreaterThan(warmedStats.hits);
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
    });

    it('should handle high-frequency data stream', () => {
      // Добавляем 1000 цен в процессор
      for (let i = 0; i < 1000; i++) {
        processor.addPrice(45000 + (Math.random() - 0.5) * 500);
      }

      const stats = processor.getStats();
      expect(stats.processedPrices).toBe(1000);
      expect(stats.bufferSize).toBeLessThanOrEqual(1000);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate default configuration', () => {
      const validation = validateConfig(DEFAULT_DAY_TRADING_CONFIG);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should detect invalid configuration', () => {
      const invalidConfig = {
        ...DEFAULT_DAY_TRADING_CONFIG,
        risk: {
          ...DEFAULT_DAY_TRADING_CONFIG.risk,
          riskPercentagePerTrade: 10, // Слишком высокий риск
        },
      };

      const validation = validateConfig(invalidConfig);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Signal Generation', () => {
    it('should generate BUY signal on RSI oversold', () => {
      // Создаём цены с RSI < 30
      const testPrices = [
        45000, 44900, 44800, 44700, 44600, 44500, 44400, 44300, 44200, 44100,
        44000, 43900, 43800, 43700, 43600, 43500, 43400, 43300, 43200, 43100,
      ];

      const rsi = calculator.calculateRSI(testPrices, 14);
      expect(rsi).toBeLessThan(30);
    });

    it('should generate SELL signal on RSI overbought', () => {
      // Создаём цены с RSI > 70
      const testPrices = [
        43000, 43100, 43200, 43300, 43400, 43500, 43600, 43700, 43800, 43900,
        44000, 44100, 44200, 44300, 44400, 44500, 44600, 44700, 44800, 44900,
      ];

      const rsi = calculator.calculateRSI(testPrices, 14);
      expect(rsi).toBeGreaterThan(70);
    });
  });

  describe('Risk Management Integration', () => {
    it('should enforce position size based on risk', () => {
      const accountBalance = 10000;
      const riskPercentage = 2;
      const entryPrice = 45000;
      const stopLoss = 44800;

      const positionSize = calculatePositionSize(
        accountBalance,
        riskPercentage,
        entryPrice,
        stopLoss
      );

      // Максимальный риск = 10000 * 0.02 = 200
      // Риск на единицу = 45000 - 44800 = 200
      // Размер позиции = 200 / 200 = 1
      expect(positionSize).toBe(1);

      // Проверяем, что риск не превышает допустимый
      const maxRisk = accountBalance * (riskPercentage / 100);
      const actualRisk = (entryPrice - stopLoss) * positionSize;
      expect(actualRisk).toBeLessThanOrEqual(maxRisk);
    });

    it('should calculate correct profit targets', () => {
      const entryPrice = 45000;
      const stopLoss = 44800;
      const riskAmount = entryPrice - stopLoss;

      // Целевое соотношение 2:1
      const takeProfit = entryPrice + riskAmount * 2;

      const rrr = calculateRiskRewardRatio(entryPrice, stopLoss, takeProfit);
      expect(rrr.ratio).toBe(2);
      expect(rrr.isValid).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('should track cache performance', () => {
      // Выполняем 50 расчётов
      for (let i = 0; i < 50; i++) {
        calculator.calculateRSI(prices, 14, 'perf-test');
        calculator.calculateMACD(prices, 12, 26, 9, 'perf-test');
        calculator.calculateBollingerBands(prices, 20, 2, 'perf-test');
      }

      const stats = calculator.getCacheStats();
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(50);
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
    });

    it('should monitor memory usage', () => {
      // Добавляем много данных
      for (let i = 0; i < 100; i++) {
        calculator.calculateRSI(prices, 14, `mem-test-${i}`);
      }

      const memoryUsage = calculator.getMemoryUsage();
      expect(memoryUsage).toBeGreaterThan(0);
      expect(memoryUsage).toBeLessThan(10 * 1024 * 1024); // Менее 10 МБ
    });
  });
});
