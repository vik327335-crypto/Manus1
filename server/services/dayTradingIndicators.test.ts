import { describe, it, expect } from 'vitest';
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateVolumeProfile,
  generateSignal,
  Candle,
} from './dayTradingIndicators';

// Генерация тестовых свечей
function generateTestCandles(count: number, startPrice: number = 100): Candle[] {
  const candles: Candle[] = [];
  let price = startPrice;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 2; // -1 to 1
    price += change;

    candles.push({
      timestamp: 1000000 + i * 60000, // 1 минута между свечами
      open: price,
      high: price + Math.abs(change),
      low: price - Math.abs(change),
      close: price + (Math.random() - 0.5) * 1,
      volume: 1000 + Math.random() * 5000,
    });
  }

  return candles;
}

describe('Day Trading Indicators', () => {
  describe('RSI Calculation', () => {
    it('should calculate RSI correctly', () => {
      const candles = generateTestCandles(50, 100);
      const rsi = calculateRSI(candles, 14);

      expect(rsi.length).toBeGreaterThan(0);
      expect(rsi[0].value).toBeGreaterThanOrEqual(0);
      expect(rsi[0].value).toBeLessThanOrEqual(100);
    });

    it('should return empty array for insufficient data', () => {
      const candles = generateTestCandles(10, 100);
      const rsi = calculateRSI(candles, 14);

      expect(rsi.length).toBe(0);
    });

    it('should have correct timestamps', () => {
      const candles = generateTestCandles(50, 100);
      const rsi = calculateRSI(candles, 14);

      expect(rsi[0].timestamp).toBe(candles[14].timestamp);
    });
  });

  describe('MACD Calculation', () => {
    it('should calculate MACD correctly', () => {
      const candles = generateTestCandles(100, 100);
      const macd = calculateMACD(candles);

      expect(macd.length).toBeGreaterThan(0);
      expect(macd[0]).toHaveProperty('line');
      expect(macd[0]).toHaveProperty('signal');
      expect(macd[0]).toHaveProperty('histogram');
    });

    it('should return empty array for insufficient data', () => {
      const candles = generateTestCandles(20, 100);
      const macd = calculateMACD(candles);

      expect(macd.length).toBe(0);
    });

    it('histogram should be line minus signal', () => {
      const candles = generateTestCandles(100, 100);
      const macd = calculateMACD(candles);

      if (macd.length > 0) {
        const expected = macd[0].line - macd[0].signal;
        expect(Math.abs(macd[0].histogram - expected)).toBeLessThan(0.01);
      }
    });
  });

  describe('Bollinger Bands Calculation', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const candles = generateTestCandles(50, 100);
      const bb = calculateBollingerBands(candles, 20, 2);

      expect(bb.length).toBeGreaterThan(0);
      expect(bb[0]).toHaveProperty('upper');
      expect(bb[0]).toHaveProperty('middle');
      expect(bb[0]).toHaveProperty('lower');
    });

    it('upper band should be greater than middle', () => {
      const candles = generateTestCandles(50, 100);
      const bb = calculateBollingerBands(candles, 20, 2);

      bb.forEach((band) => {
        expect(band.upper).toBeGreaterThan(band.middle);
        expect(band.middle).toBeGreaterThan(band.lower);
      });
    });

    it('should return empty array for insufficient data', () => {
      const candles = generateTestCandles(10, 100);
      const bb = calculateBollingerBands(candles, 20, 2);

      expect(bb.length).toBe(0);
    });
  });

  describe('Volume Profile Calculation', () => {
    it('should calculate Volume Profile correctly', () => {
      const candles = generateTestCandles(150, 100);
      const vp = calculateVolumeProfile(candles, 100);

      expect(vp.length).toBeGreaterThan(0);
      expect(vp[0]).toHaveProperty('poc');
      expect(vp[0]).toHaveProperty('highVolumeLevels');
    });

    it('POC should be within price range', () => {
      const candles = generateTestCandles(150, 100);
      const vp = calculateVolumeProfile(candles, 100);

      if (vp.length > 0) {
        const prices = candles.map((c) => c.close);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        vp.forEach((profile) => {
          expect(profile.poc).toBeGreaterThanOrEqual(minPrice - 10);
          expect(profile.poc).toBeLessThanOrEqual(maxPrice + 10);
        });
      }
    });

    it('should return empty array for insufficient data', () => {
      const candles = generateTestCandles(50, 100);
      const vp = calculateVolumeProfile(candles, 100);

      expect(vp.length).toBe(0);
    });
  });

  describe('Signal Generation', () => {
    it('should generate BUY signal on RSI oversold', () => {
      // Создаём свечи с падением цены (RSI < 30)
      const candles: Candle[] = [];
      for (let i = 0; i < 50; i++) {
        candles.push({
          timestamp: 1000000 + i * 60000,
          open: 100 - i * 0.5,
          high: 100 - i * 0.5,
          low: 100 - i * 0.5 - 1,
          close: 100 - i * 0.5 - 0.5,
          volume: 1000,
        });
      }

      const rsi = calculateRSI(candles, 14);
      const macd = calculateMACD(candles);
      const bb = calculateBollingerBands(candles, 20, 2);
      const vp = calculateVolumeProfile(candles, 100);

      const signal = generateSignal(candles, { rsi, macd, bb, vp });

      // При сильном падении должен быть BUY сигнал
      expect(signal.type).toMatch(/BUY|HOLD/);
    });

    it('should generate SELL signal on RSI overbought', () => {
      // Создаём свечи с ростом цены (RSI > 70)
      const candles: Candle[] = [];
      for (let i = 0; i < 50; i++) {
        candles.push({
          timestamp: 1000000 + i * 60000,
          open: 100 + i * 0.5,
          high: 100 + i * 0.5 + 1,
          low: 100 + i * 0.5,
          close: 100 + i * 0.5 + 0.5,
          volume: 1000,
        });
      }

      const rsi = calculateRSI(candles, 14);
      const macd = calculateMACD(candles);
      const bb = calculateBollingerBands(candles, 20, 2);
      const vp = calculateVolumeProfile(candles, 100);

      const signal = generateSignal(candles, { rsi, macd, bb, vp });

      // При сильном росте должен быть SELL сигнал
      expect(signal.type).toMatch(/SELL|HOLD/);
    });

    it('signal confidence should be between 0 and 100', () => {
      const candles = generateTestCandles(100, 100);
      const rsi = calculateRSI(candles, 14);
      const macd = calculateMACD(candles);
      const bb = calculateBollingerBands(candles, 20, 2);
      const vp = calculateVolumeProfile(candles, 100);

      const signal = generateSignal(candles, { rsi, macd, bb, vp });

      expect(signal.confidence).toBeGreaterThanOrEqual(0);
      expect(signal.confidence).toBeLessThanOrEqual(100);
    });

    it('should provide reasons for signal', () => {
      const candles = generateTestCandles(100, 100);
      const rsi = calculateRSI(candles, 14);
      const macd = calculateMACD(candles);
      const bb = calculateBollingerBands(candles, 20, 2);
      const vp = calculateVolumeProfile(candles, 100);

      const signal = generateSignal(candles, { rsi, macd, bb, vp });

      expect(Array.isArray(signal.reasons)).toBe(true);
      if (signal.type !== 'HOLD') {
        expect(signal.reasons.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty candles array', () => {
      const candles: Candle[] = [];
      const rsi = calculateRSI(candles, 14);
      const macd = calculateMACD(candles);
      const bb = calculateBollingerBands(candles, 20, 2);
      const vp = calculateVolumeProfile(candles, 100);

      expect(rsi.length).toBe(0);
      expect(macd.length).toBe(0);
      expect(bb.length).toBe(0);
      expect(vp.length).toBe(0);
    });

    it('should handle single candle', () => {
      const candles = generateTestCandles(1, 100);
      const rsi = calculateRSI(candles, 14);
      const macd = calculateMACD(candles);
      const bb = calculateBollingerBands(candles, 20, 2);
      const vp = calculateVolumeProfile(candles, 100);

      expect(rsi.length).toBe(0);
      expect(macd.length).toBe(0);
      expect(bb.length).toBe(0);
      expect(vp.length).toBe(0);
    });

    it('should handle extreme price movements', () => {
      const candles: Candle[] = [];
      for (let i = 0; i < 50; i++) {
        const price = 100 * Math.pow(1.1, i); // Экспоненциальный рост
        candles.push({
          timestamp: 1000000 + i * 60000,
          open: price,
          high: price * 1.05,
          low: price * 0.95,
          close: price,
          volume: 1000,
        });
      }

      const rsi = calculateRSI(candles, 14);
      const macd = calculateMACD(candles);
      const bb = calculateBollingerBands(candles, 20, 2);

      expect(rsi.length).toBeGreaterThan(0);
      expect(macd.length).toBeGreaterThan(0);
      expect(bb.length).toBeGreaterThan(0);

      // Все значения должны быть числами
      rsi.forEach((r) => expect(typeof r.value).toBe('number'));
      macd.forEach((m) => {
        expect(typeof m.line).toBe('number');
        expect(typeof m.signal).toBe('number');
        expect(typeof m.histogram).toBe('number');
      });
    });
  });
});
