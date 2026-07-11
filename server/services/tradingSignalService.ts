/**
 * Trading Signal Service
 * Generates real-time trading signals based on technical analysis
 */

export interface TradingSignal {
  id: string;
  ticker: string;
  signal: "BUY" | "SELL" | "HOLD";
  strength: number; // 0-100
  indicators: {
    sma: { value: number; trend: "UP" | "DOWN" };
    rsi: { value: number; overbought: boolean; oversold: boolean };
    macd: { value: number; signal: number; histogram: number };
  };
  price: number;
  timestamp: Date;
  confidence: number; // 0-100
  reasoning: string[];
}

export class TradingSignalService {
  /**
   * Generate trading signal based on technical indicators
   */
  static generateSignal(
    ticker: string,
    price: number,
    indicators: {
      sma20: number;
      sma50: number;
      rsi: number;
      macdValue: number;
      macdSignal: number;
      ema12: number;
      ema26: number;
    }
  ): TradingSignal {
    const signals: string[] = [];
    let buySignals = 0;
    let sellSignals = 0;

    // SMA Analysis
    const smaValue = indicators.sma20;
    const smaTrend = price > indicators.sma50 ? "UP" : "DOWN";
    if (price > indicators.sma20 && price > indicators.sma50) {
      signals.push("Price above both SMA20 and SMA50 (Uptrend)");
      buySignals++;
    } else if (price < indicators.sma20 && price < indicators.sma50) {
      signals.push("Price below both SMA20 and SMA50 (Downtrend)");
      sellSignals++;
    }

    // RSI Analysis
    const rsiOverbought = indicators.rsi > 70;
    const rsiOversold = indicators.rsi < 30;
    if (rsiOversold) {
      signals.push("RSI oversold (< 30) - Potential reversal");
      buySignals++;
    } else if (rsiOverbought) {
      signals.push("RSI overbought (> 70) - Potential correction");
      sellSignals++;
    }

    // MACD Analysis
    const macdHistogram = indicators.macdValue - indicators.macdSignal;
    if (macdHistogram > 0 && indicators.macdValue > indicators.macdSignal) {
      signals.push("MACD bullish crossover");
      buySignals++;
    } else if (macdHistogram < 0 && indicators.macdValue < indicators.macdSignal) {
      signals.push("MACD bearish crossover");
      sellSignals++;
    }

    // EMA Analysis
    if (indicators.ema12 > indicators.ema26) {
      signals.push("EMA12 above EMA26 (Bullish)");
      buySignals++;
    } else {
      signals.push("EMA12 below EMA26 (Bearish)");
      sellSignals++;
    }

    // Determine signal
    let signal: "BUY" | "SELL" | "HOLD" = "HOLD";
    let strength = 0;

    if (buySignals > sellSignals) {
      signal = "BUY";
      strength = (buySignals / 4) * 100;
    } else if (sellSignals > buySignals) {
      signal = "SELL";
      strength = (sellSignals / 4) * 100;
    } else {
      strength = 50;
    }

    // Calculate confidence
    const confidence = Math.min(100, strength + (Math.abs(buySignals - sellSignals) * 10));

    return {
      id: `${ticker}-${Date.now()}`,
      ticker,
      signal,
      strength: Math.round(strength),
      indicators: {
        sma: { value: smaValue, trend: smaTrend },
        rsi: { value: indicators.rsi, overbought: rsiOverbought, oversold: rsiOversold },
        macd: {
          value: indicators.macdValue,
          signal: indicators.macdSignal,
          histogram: macdHistogram,
        },
      },
      price,
      timestamp: new Date(),
      confidence: Math.round(confidence),
      reasoning: signals,
    };
  }

  /**
   * Generate multiple signals for a basket of tickers
   */
  static generateSignalBasket(
    tickers: Array<{
      ticker: string;
      price: number;
      indicators: {
        sma20: number;
        sma50: number;
        rsi: number;
        macdValue: number;
        macdSignal: number;
        ema12: number;
        ema26: number;
      };
    }>
  ): TradingSignal[] {
    return tickers.map((ticker) =>
      this.generateSignal(ticker.ticker, ticker.price, ticker.indicators)
    );
  }

  /**
   * Filter signals by criteria
   */
  static filterSignals(
    signals: TradingSignal[],
    criteria: {
      signalType?: "BUY" | "SELL" | "HOLD";
      minStrength?: number;
      minConfidence?: number;
    }
  ): TradingSignal[] {
    return signals.filter((signal) => {
      if (criteria.signalType && signal.signal !== criteria.signalType) {
        return false;
      }
      if (criteria.minStrength && signal.strength < criteria.minStrength) {
        return false;
      }
      if (criteria.minConfidence && signal.confidence < criteria.minConfidence) {
        return false;
      }
      return true;
    });
  }

  /**
   * Rank signals by strength and confidence
   */
  static rankSignals(signals: TradingSignal[]): TradingSignal[] {
    return [...signals].sort((a, b) => {
      const scoreA = (a.strength + a.confidence) / 2;
      const scoreB = (b.strength + b.confidence) / 2;
      return scoreB - scoreA;
    });
  }

  /**
   * Generate alert for strong signals
   */
  static generateAlert(signal: TradingSignal): {
    title: string;
    message: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
  } | null {
    if (signal.strength < 60 || signal.confidence < 60) {
      return null;
    }

    const severity =
      signal.strength > 80 && signal.confidence > 80
        ? "HIGH"
        : signal.strength > 70 && signal.confidence > 70
        ? "MEDIUM"
        : "LOW";

    return {
      title: `${signal.signal} Signal: ${signal.ticker}`,
      message: `Strong ${signal.signal} signal for ${signal.ticker} at $${signal.price.toFixed(2)}. Confidence: ${signal.confidence}%`,
      severity,
    };
  }

  /**
   * Analyze signal divergence (when multiple timeframes disagree)
   */
  static analyzeDivergence(
    shortTermSignal: TradingSignal,
    longTermSignal: TradingSignal
  ): {
    divergence: boolean;
    type: "BULLISH" | "BEARISH" | "NONE";
    strength: number;
  } {
    const divergence = shortTermSignal.signal !== longTermSignal.signal;

    if (!divergence) {
      return { divergence: false, type: "NONE", strength: 0 };
    }

    // Bullish divergence: short term down, long term up
    if (shortTermSignal.signal === "SELL" && longTermSignal.signal === "BUY") {
      return {
        divergence: true,
        type: "BULLISH",
        strength: Math.abs(longTermSignal.strength - shortTermSignal.strength),
      };
    }

    // Bearish divergence: short term up, long term down
    if (shortTermSignal.signal === "BUY" && longTermSignal.signal === "SELL") {
      return {
        divergence: true,
        type: "BEARISH",
        strength: Math.abs(shortTermSignal.strength - longTermSignal.strength),
      };
    }

    return { divergence: false, type: "NONE", strength: 0 };
  }

  /**
   * Calculate risk/reward ratio
   */
  static calculateRiskReward(
    entryPrice: number,
    stopLoss: number,
    takeProfit: number
  ): {
    riskAmount: number;
    rewardAmount: number;
    ratio: number;
  } {
    const riskAmount = Math.abs(entryPrice - stopLoss);
    const rewardAmount = Math.abs(takeProfit - entryPrice);
    const ratio = rewardAmount / riskAmount;

    return {
      riskAmount,
      rewardAmount,
      ratio,
    };
  }

  /**
   * Generate entry and exit levels
   */
  static generateLevels(
    price: number,
    atr: number // Average True Range
  ): {
    entry: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    takeProfit3: number;
  } {
    return {
      entry: price,
      stopLoss: price - atr * 2,
      takeProfit1: price + atr * 1,
      takeProfit2: price + atr * 2,
      takeProfit3: price + atr * 3,
    };
  }
}

export default TradingSignalService;
