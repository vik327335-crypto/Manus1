/**
 * Day Trading Indicators Service
 * Расчёт технических индикаторов для внутридневного трейдинга
 */

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RSIValue {
  timestamp: number;
  value: number;
}

export interface MACDValue {
  timestamp: number;
  line: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandsValue {
  timestamp: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface VolumeProfileValue {
  timestamp: number;
  poc: number; // Point of Control
  highVolumeLevels: number[];
}

export interface Indicators {
  rsi: RSIValue[];
  macd: MACDValue[];
  bollingerBands: BollingerBandsValue[];
  volumeProfile: VolumeProfileValue[];
}

/**
 * Расчёт RSI (Relative Strength Index)
 * @param candles - Массив свечей
 * @param period - Период (обычно 14)
 * @returns Массив значений RSI
 */
export function calculateRSI(candles: Candle[], period: number = 14): RSIValue[] {
  const result: RSIValue[] = [];
  
  if (candles.length < period + 1) {
    return result;
  }

  const changes: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    changes.push(candles[i].close - candles[i - 1].close);
  }

  let gains = 0;
  let losses = 0;

  // Инициализация первого периода
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      gains += changes[i];
    } else {
      losses -= changes[i];
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Расчёт RSI для каждой свечи
  for (let i = period; i < candles.length; i++) {
    const change = changes[i];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    result.push({
      timestamp: candles[i].timestamp,
      value: Math.round(rsi * 100) / 100,
    });
  }

  return result;
}

/**
 * Расчёт EMA (Exponential Moving Average)
 * @param candles - Массив свечей
 * @param period - Период
 * @returns Массив значений EMA
 */
function calculateEMA(candles: Candle[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  // Инициализация первого значения (SMA)
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let ema = sum / period;
  result[period - 1] = ema;

  // Расчёт EMA для остальных свечей
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * multiplier + ema * (1 - multiplier);
    result[i] = ema;
  }

  return result;
}

/**
 * Расчёт MACD (Moving Average Convergence Divergence)
 * @param candles - Массив свечей
 * @returns Массив значений MACD
 */
export function calculateMACD(candles: Candle[]): MACDValue[] {
  const result: MACDValue[] = [];

  if (candles.length < 26) {
    return result;
  }

  const ema12 = calculateEMA(candles, 12);
  const ema26 = calculateEMA(candles, 26);

  // Расчёт MACD Line (EMA12 - EMA26)
  const macdLine: number[] = [];
  for (let i = 25; i < candles.length; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }

  // Расчёт Signal Line (EMA9 от MACD Line)
  const signalLine: number[] = [];
  if (macdLine.length >= 9) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += macdLine[i];
    }
    let signal = sum / 9;
    signalLine[8] = signal;

    const multiplier = 2 / 10;
    for (let i = 9; i < macdLine.length; i++) {
      signal = macdLine[i] * multiplier + signal * (1 - multiplier);
      signalLine[i] = signal;
    }
  }

  // Расчёт Histogram (MACD Line - Signal Line)
  for (let i = 0; i < macdLine.length; i++) {
    if (signalLine[i] !== undefined) {
      result.push({
        timestamp: candles[i + 25].timestamp,
        line: Math.round(macdLine[i] * 10000) / 10000,
        signal: Math.round(signalLine[i] * 10000) / 10000,
        histogram: Math.round((macdLine[i] - signalLine[i]) * 10000) / 10000,
      });
    }
  }

  return result;
}

/**
 * Расчёт Bollinger Bands
 * @param candles - Массив свечей
 * @param period - Период (обычно 20)
 * @param stdDev - Количество стандартных отклонений (обычно 2)
 * @returns Массив значений Bollinger Bands
 */
export function calculateBollingerBands(
  candles: Candle[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsValue[] {
  const result: BollingerBandsValue[] = [];

  if (candles.length < period) {
    return result;
  }

  for (let i = period - 1; i < candles.length; i++) {
    // Расчёт SMA
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }
    const middle = sum / period;

    // Расчёт стандартного отклонения
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) {
      variance += Math.pow(candles[j].close - middle, 2);
    }
    const std = Math.sqrt(variance / period);

    const upper = middle + std * stdDev;
    const lower = middle - std * stdDev;

    result.push({
      timestamp: candles[i].timestamp,
      upper: Math.round(upper * 100) / 100,
      middle: Math.round(middle * 100) / 100,
      lower: Math.round(lower * 100) / 100,
    });
  }

  return result;
}

/**
 * Расчёт Volume Profile
 * @param candles - Массив свечей
 * @param period - Период для анализа (обычно 100)
 * @returns Массив значений Volume Profile
 */
export function calculateVolumeProfile(
  candles: Candle[],
  period: number = 100
): VolumeProfileValue[] {
  const result: VolumeProfileValue[] = [];

  if (candles.length < period) {
    return result;
  }

  for (let i = period - 1; i < candles.length; i++) {
    const volumeByPrice: Map<number, number> = new Map();

    // Агрегация объёма по ценовым уровням
    for (let j = i - period + 1; j <= i; j++) {
      const priceLevel = Math.round(candles[j].close * 100) / 100;
      const currentVolume = volumeByPrice.get(priceLevel) || 0;
      volumeByPrice.set(priceLevel, currentVolume + candles[j].volume);
    }

    // Поиск Point of Control (максимальный объём)
    let maxVolume = 0;
    let poc = 0;
    volumeByPrice.forEach((volume, price) => {
      if (volume > maxVolume) {
        maxVolume = volume;
        poc = price;
      }
    });

    // Поиск уровней с высоким объёмом (> 50% от максимума)
    const highVolumeLevels: number[] = [];
    volumeByPrice.forEach((volume, price) => {
      if (volume > maxVolume * 0.5) {
        highVolumeLevels.push(price);
      }
    });

    result.push({
      timestamp: candles[i].timestamp,
      poc,
      highVolumeLevels: highVolumeLevels.sort((a, b) => a - b),
    });
  }

  return result;
}

/**
 * Расчёт всех индикаторов
 * @param candles - Массив свечей
 * @returns Объект со всеми индикаторами
 */
export function calculateAllIndicators(candles: Candle[]): Indicators {
  return {
    rsi: calculateRSI(candles, 14),
    macd: calculateMACD(candles),
    bollingerBands: calculateBollingerBands(candles, 20, 2),
    volumeProfile: calculateVolumeProfile(candles, 100),
  };
}

/**
 * Генерация сигналов на основе индикаторов
 */
export interface Signal {
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  reasons: string[];
  price: number;
  timestamp: number;
}

export function generateSignal(
  candles: Candle[],
  indicators: Indicators
): Signal {
  if (
    candles.length === 0 ||
    indicators.rsi.length === 0 ||
    indicators.macd.length === 0 ||
    indicators.bollingerBands.length === 0
  ) {
    return {
      type: 'HOLD',
      confidence: 0,
      reasons: ['Недостаточно данных'],
      price: 0,
      timestamp: 0,
    };
  }

  const lastCandle = candles[candles.length - 1];
  const lastRSI = indicators.rsi[indicators.rsi.length - 1];
  const lastMACD = indicators.macd[indicators.macd.length - 1];
  const lastBB = indicators.bollingerBands[indicators.bollingerBands.length - 1];

  let buyScore = 0;
  let sellScore = 0;
  const reasons: string[] = [];

  // RSI анализ
  if (lastRSI.value < 30) {
    buyScore += 30;
    reasons.push('RSI < 30 (перепроданность)');
  } else if (lastRSI.value > 70) {
    sellScore += 30;
    reasons.push('RSI > 70 (перекупленность)');
  }

  // MACD анализ
  if (indicators.macd.length >= 2) {
    const prevMACD = indicators.macd[indicators.macd.length - 2];
    if (
      lastMACD.line > lastMACD.signal &&
      prevMACD.line <= prevMACD.signal
    ) {
      buyScore += 25;
      reasons.push('MACD пересёк Signal вверх');
    } else if (
      lastMACD.line < lastMACD.signal &&
      prevMACD.line >= prevMACD.signal
    ) {
      sellScore += 25;
      reasons.push('MACD пересёк Signal вниз');
    }
  }

  // Bollinger Bands анализ
  if (lastCandle.close < lastBB.lower) {
    buyScore += 20;
    reasons.push('Цена ниже нижней полосы BB');
  } else if (lastCandle.close > lastBB.upper) {
    sellScore += 20;
    reasons.push('Цена выше верхней полосы BB');
  }

  // Объём анализ
  const avgVolume =
    candles.slice(-20).reduce((sum, c) => sum + c.volume, 0) / 20;
  if (lastCandle.volume > avgVolume * 1.5) {
    if (lastCandle.close > lastCandle.open) {
      buyScore += 15;
      reasons.push('Высокий объём при растущей свече');
    } else {
      sellScore += 15;
      reasons.push('Высокий объём при падающей свече');
    }
  }

  // Определение сигнала
  let signal: Signal['type'] = 'HOLD';
  let confidence = 0;

  if (buyScore > sellScore && buyScore > 30) {
    signal = 'BUY';
    confidence = Math.min(100, buyScore);
  } else if (sellScore > buyScore && sellScore > 30) {
    signal = 'SELL';
    confidence = Math.min(100, sellScore);
  }

  return {
    type: signal,
    confidence,
    reasons,
    price: lastCandle.close,
    timestamp: lastCandle.timestamp,
  };
}
