/**
 * Machine Learning Prediction Service
 * Uses historical data and sentiment analysis to predict price movements
 */

export interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PredictionInput {
  ticker: string;
  priceHistory: PriceData[];
  sentiment: number;
  technicalIndicators: {
    sma20: number;
    sma50: number;
    rsi: number;
    macd: number;
    bollingerBands: { upper: number; lower: number };
  };
  marketCap?: number;
  volume24h?: number;
}

export interface PredictionOutput {
  ticker: string;
  prediction: "UP" | "DOWN" | "NEUTRAL";
  confidence: number;
  targetPrice: number;
  timeframe: string;
  reasoning: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  timestamp: Date;
}

export class MLPredictionService {
  /**
   * Simple Moving Average for trend detection
   */
  private static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  /**
   * Exponential Moving Average
   */
  private static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  }

  /**
   * Relative Strength Index
   */
  private static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.filter((c) => c > 0).slice(-period);
    const losses = changes.filter((c) => c < 0).slice(-period).map((c) => Math.abs(c));

    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  /**
   * MACD (Moving Average Convergence Divergence)
   */
  private static calculateMACD(prices: number[]): number {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    return ema12 - ema26;
  }

  /**
   * Bollinger Bands
   */
  private static calculateBollingerBands(
    prices: number[],
    period: number = 20
  ): { upper: number; lower: number } {
    const sma = this.calculateSMA(prices, period);
    const variance =
      prices
        .slice(-period)
        .reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    return {
      upper: sma + 2 * stdDev,
      lower: sma - 2 * stdDev,
    };
  }

  /**
   * Calculate momentum score based on multiple indicators
   */
  private static calculateMomentumScore(input: PredictionInput): number {
    let score = 0;
    let factors = 0;

    // Price trend analysis
    const closes = input.priceHistory.map((p) => p.close);
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const currentPrice = closes[closes.length - 1];

    // Trend factor (0-30 points)
    if (currentPrice > sma20) score += 15;
    if (sma20 > sma50) score += 15;
    factors += 30;

    // RSI factor (0-20 points)
    const rsi = this.calculateRSI(closes);
    if (rsi < 30) score += 10; // Oversold
    else if (rsi > 70) score -= 10; // Overbought
    else if (rsi > 40 && rsi < 60) score += 5;
    factors += 20;

    // MACD factor (0-20 points)
    const macd = this.calculateMACD(closes);
    if (macd > 0) score += 10;
    factors += 20;

    // Sentiment factor (0-20 points)
    if (input.sentiment > 0.5) score += 10;
    else if (input.sentiment < -0.5) score -= 10;
    factors += 20;

    // Volume factor (0-10 points)
    const avgVolume =
      input.priceHistory.reduce((sum, p) => sum + p.volume, 0) / input.priceHistory.length;
    if (input.priceHistory[input.priceHistory.length - 1].volume > avgVolume * 1.5) {
      score += 5;
    }
    factors += 10;

    return (score / factors) * 100;
  }

  /**
   * Predict price movement
   */
  static predictPriceMovement(input: PredictionInput): PredictionOutput {
    const closes = input.priceHistory.map((p) => p.close);
    const currentPrice = closes[closes.length - 1];

    // Calculate momentum score
    const momentumScore = this.calculateMomentumScore(input);

    // Determine prediction
    let prediction: "UP" | "DOWN" | "NEUTRAL";
    let confidence: number;
    let riskLevel: "LOW" | "MEDIUM" | "HIGH";

    if (momentumScore > 60) {
      prediction = "UP";
      confidence = Math.min(0.95, (momentumScore - 50) / 50);
    } else if (momentumScore < 40) {
      prediction = "DOWN";
      confidence = Math.min(0.95, (50 - momentumScore) / 50);
    } else {
      prediction = "NEUTRAL";
      confidence = 0.5;
    }

    // Calculate target price
    const volatility = this.calculateVolatility(closes);
    const targetPrice =
      prediction === "UP"
        ? currentPrice * (1 + volatility * confidence)
        : prediction === "DOWN"
          ? currentPrice * (1 - volatility * confidence)
          : currentPrice;

    // Determine risk level
    if (volatility > 0.05) {
      riskLevel = "HIGH";
    } else if (volatility > 0.02) {
      riskLevel = "MEDIUM";
    } else {
      riskLevel = "LOW";
    }

    // Generate reasoning
    const reasoning = this.generateReasoning(input, momentumScore, prediction);

    return {
      ticker: input.ticker,
      prediction,
      confidence,
      targetPrice: Math.round(targetPrice * 100) / 100,
      timeframe: "24h",
      reasoning,
      riskLevel,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate volatility
   */
  private static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  /**
   * Generate reasoning for prediction
   */
  private static generateReasoning(
    input: PredictionInput,
    _momentumScore: number,
    _prediction: string
  ): string {
    const closes = input.priceHistory.map((p) => p.close);
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const rsi = this.calculateRSI(closes);
    const currentPrice = closes[closes.length - 1];

    let reasons = [];

    // Trend analysis
    if (currentPrice > sma20 && sma20 > sma50) {
      reasons.push("Strong uptrend with price above both SMAs");
    } else if (currentPrice < sma20 && sma20 < sma50) {
      reasons.push("Strong downtrend with price below both SMAs");
    }

    // RSI analysis
    if (rsi < 30) {
      reasons.push("RSI indicates oversold conditions");
    } else if (rsi > 70) {
      reasons.push("RSI indicates overbought conditions");
    }

    // Sentiment analysis
    if (input.sentiment > 0.7) {
      reasons.push("Very positive sentiment from market");
    } else if (input.sentiment < -0.7) {
      reasons.push("Very negative sentiment from market");
    }

    return reasons.length > 0 ? reasons.join(". ") : "Mixed signals in technical analysis";
  }

  /**
   * Predict multiple timeframes
   */
  static predictMultipleTimeframes(
    input: PredictionInput
  ): Array<PredictionOutput & { timeframe: string }> {
    const predictions = [];

    // 24h prediction
    const pred24h = this.predictPriceMovement(input);
    predictions.push({ ...pred24h, timeframe: "24h" });

    // 7d prediction (using lower confidence)
    const pred7d = this.predictPriceMovement(input);
    pred7d.confidence *= 0.7;
    pred7d.timeframe = "7d";
    predictions.push(pred7d);

    // 30d prediction (using even lower confidence)
    const pred30d = this.predictPriceMovement(input);
    pred30d.confidence *= 0.5;
    pred30d.timeframe = "30d";
    predictions.push(pred30d);

    return predictions;
  }

  /**
   * Ensemble prediction combining multiple models
   */
  static ensemblePrediction(inputs: PredictionInput[]): PredictionOutput {
    if (inputs.length === 0) {
      throw new Error("No inputs provided");
    }

    const predictions = inputs.map((input) => this.predictPriceMovement(input));

    // Count votes
    const upVotes = predictions.filter((p) => p.prediction === "UP").length;
    const downVotes = predictions.filter((p) => p.prediction === "DOWN").length;

    // Determine consensus
    let prediction: "UP" | "DOWN" | "NEUTRAL";
    if (upVotes > downVotes) {
      prediction = "UP";
    } else if (downVotes > upVotes) {
      prediction = "DOWN";
    } else {
      prediction = "NEUTRAL";
    }

    // Average confidence
    const avgConfidence =
      predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

    // Average target price
    const avgTargetPrice =
      predictions.reduce((sum, p) => sum + p.targetPrice, 0) / predictions.length;

    return {
      ticker: inputs[0].ticker,
      prediction,
      confidence: avgConfidence,
      targetPrice: Math.round(avgTargetPrice * 100) / 100,
      timeframe: "24h",
      reasoning: `Ensemble prediction from ${inputs.length} models`,
      riskLevel: predictions[0].riskLevel,
      timestamp: new Date(),
    };
  }

  /**
   * Backtest prediction model
   */
  static backtestModel(
    priceHistory: PriceData[],
    sentiment: number,
    windowSize: number = 50
  ): {
    accuracy: number;
    profitability: number;
    trades: number;
    winRate: number;
  } {
    let correctPredictions = 0;
    let totalPredictions = 0;
    let totalProfit = 0;
    let trades = 0;
    let winningTrades = 0;

    for (let i = windowSize; i < priceHistory.length - 1; i++) {
      const historicalData = priceHistory.slice(i - windowSize, i);
      const nextPrice = priceHistory[i + 1].close;
      const currentPrice = priceHistory[i].close;

      const input: PredictionInput = {
        ticker: "TEST",
        priceHistory: historicalData,
        sentiment,
        technicalIndicators: {
          sma20: this.calculateSMA(
            historicalData.map((p) => p.close),
            20
          ),
          sma50: this.calculateSMA(
            historicalData.map((p) => p.close),
            50
          ),
          rsi: this.calculateRSI(historicalData.map((p) => p.close)),
          macd: this.calculateMACD(historicalData.map((p) => p.close)),
          bollingerBands: this.calculateBollingerBands(
            historicalData.map((p) => p.close)
          ),
        },
      };

      const prediction = this.predictPriceMovement(input);
      const actualMovement = nextPrice > currentPrice ? "UP" : "DOWN";

      if (prediction.prediction === actualMovement) {
        correctPredictions++;
      }

      totalPredictions++;

      // Calculate profit
      if (prediction.prediction === "UP" && nextPrice > currentPrice) {
        const profit = ((nextPrice - currentPrice) / currentPrice) * 100;
        totalProfit += profit;
        winningTrades++;
        trades++;
      } else if (prediction.prediction === "DOWN" && nextPrice < currentPrice) {
        const profit = ((currentPrice - nextPrice) / currentPrice) * 100;
        totalProfit += profit;
        winningTrades++;
        trades++;
      } else if (prediction.prediction !== "NEUTRAL") {
        trades++;
      }
    }

    return {
      accuracy: (correctPredictions / totalPredictions) * 100,
      profitability: totalProfit,
      trades,
      winRate: trades > 0 ? (winningTrades / trades) * 100 : 0,
    };
  }
}

export default MLPredictionService;
