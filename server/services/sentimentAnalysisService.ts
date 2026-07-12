/**
 * Sentiment Analysis Service
 * Analyzes sentiment from social media, news, and other sources
 */

export interface SentimentScore {
  source: "twitter" | "reddit" | "news" | "telegram" | "discord";
  ticker: string;
  sentiment: "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "VERY_NEGATIVE";
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  timestamp: Date;
  sampleSize: number;
  keywords: string[];
}

export interface SentimentTrend {
  ticker: string;
  period: "1H" | "4H" | "1D" | "7D" | "30D";
  averageSentiment: number;
  trend: "IMPROVING" | "STABLE" | "DECLINING";
  momentum: number;
  volatility: number;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  relevantTickers: string[];
  impact: "HIGH" | "MEDIUM" | "LOW";
}

export class SentimentAnalysisService {
  /**
   * Analyze sentiment from text
   */
  static analyzeSentiment(text: string): {
    sentiment: "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "VERY_NEGATIVE";
    score: number;
    confidence: number;
  } {
    // Simple sentiment analysis based on keywords
    const positiveKeywords = [
      "bullish",
      "moon",
      "pump",
      "gain",
      "profit",
      "surge",
      "rally",
      "breakthrough",
      "excellent",
      "amazing",
      "great",
      "good",
      "buy",
      "long",
    ];
    const negativeKeywords = [
      "bearish",
      "crash",
      "dump",
      "loss",
      "decline",
      "fall",
      "drop",
      "disaster",
      "terrible",
      "awful",
      "bad",
      "sell",
      "short",
      "scam",
    ];

    const lowerText = text.toLowerCase();
    let score = 0;
    let positiveCount = 0;
    let negativeCount = 0;

    positiveKeywords.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        positiveCount++;
        score += 0.1;
      }
    });

    negativeKeywords.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        negativeCount++;
        score -= 0.1;
      }
    });

    // Normalize score to -1 to 1
    score = Math.max(-1, Math.min(1, score));

    let sentiment: "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "VERY_NEGATIVE";
    if (score >= 0.6) sentiment = "VERY_POSITIVE";
    else if (score >= 0.2) sentiment = "POSITIVE";
    else if (score <= -0.6) sentiment = "VERY_NEGATIVE";
    else if (score <= -0.2) sentiment = "NEGATIVE";
    else sentiment = "NEUTRAL";

    const confidence = Math.min(
      1,
      (positiveCount + negativeCount) / (text.split(" ").length / 10)
    );

    return { sentiment, score, confidence };
  }

  /**
   * Calculate aggregate sentiment
   */
  static aggregateSentiments(sentiments: SentimentScore[]): {
    overallSentiment: number;
    averageConfidence: number;
    dominantSentiment: string;
    distribution: Record<string, number>;
  } {
    if (sentiments.length === 0) {
      return {
        overallSentiment: 0,
        averageConfidence: 0,
        dominantSentiment: "NEUTRAL",
        distribution: {},
      };
    }

    const overallSentiment =
      sentiments.reduce((sum, s) => sum + s.score * s.confidence, 0) /
      sentiments.reduce((sum, s) => sum + s.confidence, 0);

    const averageConfidence =
      sentiments.reduce((sum, s) => sum + s.confidence, 0) / sentiments.length;

    const distribution: Record<string, number> = {};
    sentiments.forEach((s) => {
      distribution[s.sentiment] = (distribution[s.sentiment] || 0) + 1;
    });

    const dominantSentiment = Object.entries(distribution).sort(
      ([, a], [, b]) => b - a
    )[0][0];

    return {
      overallSentiment,
      averageConfidence,
      dominantSentiment,
      distribution,
    };
  }

  /**
   * Calculate sentiment trend
   */
  static calculateSentimentTrend(
    sentiments: SentimentScore[],
    period: "1H" | "4H" | "1D" | "7D" | "30D"
  ): SentimentTrend {
    const now = new Date();
    const periodMs = {
      "1H": 60 * 60 * 1000,
      "4H": 4 * 60 * 60 * 1000,
      "1D": 24 * 60 * 60 * 1000,
      "7D": 7 * 24 * 60 * 60 * 1000,
      "30D": 30 * 24 * 60 * 60 * 1000,
    }[period];

    const filteredSentiments = sentiments.filter(
      (s) => now.getTime() - new Date(s.timestamp).getTime() <= periodMs
    );

    if (filteredSentiments.length === 0) {
      return {
        ticker: sentiments[0]?.ticker || "UNKNOWN",
        period,
        averageSentiment: 0,
        trend: "STABLE",
        momentum: 0,
        volatility: 0,
      };
    }

    const scores = filteredSentiments.map((s) => s.score);
    const averageSentiment =
      scores.reduce((a, b) => a + b, 0) / scores.length;

    // Calculate trend
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let trend: "IMPROVING" | "STABLE" | "DECLINING";
    if (secondAvg > firstAvg + 0.1) trend = "IMPROVING";
    else if (secondAvg < firstAvg - 0.1) trend = "DECLINING";
    else trend = "STABLE";

    // Calculate momentum
    const momentum = secondAvg - firstAvg;

    // Calculate volatility
    const mean = averageSentiment;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
      scores.length;
    const volatility = Math.sqrt(variance);

    return {
      ticker: sentiments[0]?.ticker || "UNKNOWN",
      period,
      averageSentiment,
      trend,
      momentum,
      volatility,
    };
  }

  /**
   * Extract ticker mentions from text
   */
  static extractTickerMentions(text: string): string[] {
    const tickerPattern = /\b([A-Z]{1,5})\b/g;
    const matches = text.match(tickerPattern) || [];
    const commonWords = [
      "THE",
      "AND",
      "FOR",
      "ARE",
      "BUT",
      "NOT",
      "YOU",
      "ALL",
      "CAN",
      "HER",
      "WAS",
      "ONE",
      "OUR",
      "OUT",
      "DAY",
      "GET",
      "HAS",
      "HIM",
      "HIS",
      "HOW",
      "ITS",
      "MAY",
      "NEW",
      "NOW",
      "OLD",
      "SEE",
      "TWO",
      "WAY",
      "WHO",
      "BOY",
      "DID",
      "ITS",
      "LET",
      "PUT",
      "SAY",
      "SHE",
      "TOO",
      "USE",
    ];

    return Array.from(new Set(matches)).filter((ticker) => !commonWords.includes(ticker));
  }

  /**
   * Score news impact
   */
  static scoreNewsImpact(
    title: string,
    content: string,
    sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL"
  ): "HIGH" | "MEDIUM" | "LOW" {
    const impactKeywords = [
      "crash",
      "surge",
      "hack",
      "partnership",
      "bankruptcy",
      "acquisition",
      "regulation",
      "breakthrough",
      "scandal",
      "record",
    ];

    const text = (title + " " + content).toLowerCase();
    const hasImpactKeyword = impactKeywords.some((keyword) => text.includes(keyword));

    if (hasImpactKeyword) return "HIGH";
    if (sentiment !== "NEUTRAL") return "MEDIUM";
    return "LOW";
  }

  /**
   * Calculate sentiment momentum
   */
  static calculateMomentum(sentiments: SentimentScore[]): number {
    if (sentiments.length < 2) return 0;

    const sorted = [...sentiments].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const recent = sorted.slice(-Math.ceil(sorted.length / 2));
    const older = sorted.slice(0, Math.floor(sorted.length / 2));

    const recentAvg =
      recent.reduce((sum, s) => sum + s.score, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.score, 0) / older.length;

    return recentAvg - olderAvg;
  }

  /**
   * Get sentiment by source
   */
  static getSentimentBySource(
    sentiments: SentimentScore[]
  ): Record<string, { score: number; confidence: number; count: number }> {
    const result: Record<string, { score: number; confidence: number; count: number }> = {};

    sentiments.forEach((s) => {
      if (!result[s.source]) {
        result[s.source] = { score: 0, confidence: 0, count: 0 };
      }
      result[s.source].score += s.score;
      result[s.source].confidence += s.confidence;
      result[s.source].count += 1;
    });

    Object.keys(result).forEach((source) => {
      result[source].score /= result[source].count;
      result[source].confidence /= result[source].count;
    });

    return result;
  }

  /**
   * Predict price movement based on sentiment
   */
  static predictPriceMovement(
    sentiment: number,
    volatility: number,
    momentum: number
  ): {
    direction: "UP" | "DOWN" | "NEUTRAL";
    confidence: number;
    target: number;
  } {
    let direction: "UP" | "DOWN" | "NEUTRAL" = "NEUTRAL";
    let confidence = 0;

    // Strong positive sentiment
    if (sentiment > 0.5 && momentum > 0.1) {
      direction = "UP";
      confidence = Math.min(1, sentiment * 0.8 + momentum * 0.2);
    }
    // Strong negative sentiment
    else if (sentiment < -0.5 && momentum < -0.1) {
      direction = "DOWN";
      confidence = Math.min(1, Math.abs(sentiment) * 0.8 + Math.abs(momentum) * 0.2);
    }
    // Moderate sentiment
    else if (Math.abs(sentiment) > 0.2) {
      direction = sentiment > 0 ? "UP" : "DOWN";
      confidence = Math.abs(sentiment) * 0.5;
    }

    // Volatility reduces confidence
    confidence = Math.max(0, confidence - volatility * 0.2);

    // Target is based on sentiment strength
    const target = Math.abs(sentiment) * 5; // 0-5% target

    return { direction, confidence, target };
  }

  /**
   * Generate sentiment report
   */
  static generateSentimentReport(sentiments: SentimentScore[]) {
    const aggregated = this.aggregateSentiments(sentiments);
    const trend1D = this.calculateSentimentTrend(sentiments, "1D");
    const trend7D = this.calculateSentimentTrend(sentiments, "7D");
    const bySource = this.getSentimentBySource(sentiments);
    const momentum = this.calculateMomentum(sentiments);
    const prediction = this.predictPriceMovement(
      aggregated.overallSentiment,
      trend7D.volatility,
      momentum
    );

    return {
      aggregated,
      trends: { "1D": trend1D, "7D": trend7D },
      bySource,
      momentum,
      prediction,
      timestamp: new Date(),
    };
  }
}

export default SentimentAnalysisService;
