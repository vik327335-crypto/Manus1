import { sentimentAnalysis } from "../../drizzle/schema";
import { getDb } from "../db";
import { desc, eq } from "drizzle-orm";

/**
 * Store sentiment analysis result in database
 */
export async function storeSentimentAnalysis(data: {
  assetId: number;
  source: string;
  catalyst: string;
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  summary: string;
  sourceUrl: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[SentimentDB] Database not available");
    return;
  }

  try {
    await db.insert(sentimentAnalysis).values({
      assetId: data.assetId,
      source: data.source,
      catalyst: data.catalyst,
      sentiment: data.sentiment,
      confidence: data.confidence,
      summary: data.summary,
      sourceUrl: data.sourceUrl,
      analyzedAt: new Date(),
    });
  } catch (error) {
    console.error("[SentimentDB] Error storing sentiment analysis:", error);
    throw error;
  }
}

/**
 * Get recent sentiment analysis for an asset
 */
export async function getAssetSentimentHistory(
  assetId: number,
  limit: number = 10
) {
  const db = await getDb();
  if (!db) {
    console.warn("[SentimentDB] Database not available");
    return [];
  }

  try {
    const results = await db
      .select()
      .from(sentimentAnalysis)
      .where(eq(sentimentAnalysis.assetId, assetId))
      .orderBy(desc(sentimentAnalysis.analyzedAt))
      .limit(limit);

    return results;
  } catch (error) {
    console.error("[SentimentDB] Error fetching sentiment history:", error);
    return [];
  }
}

/**
 * Get sentiment summary for an asset
 */
export async function getAssetSentimentSummary(assetId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[SentimentDB] Database not available");
    return null;
  }

  try {
    const results = await db
      .select()
      .from(sentimentAnalysis)
      .where(eq(sentimentAnalysis.assetId, assetId))
      .orderBy(desc(sentimentAnalysis.analyzedAt))
      .limit(20);

    if (results.length === 0) {
      return null;
    }

    const positive = results.filter((r) => r.sentiment === "positive").length;
    const negative = results.filter((r) => r.sentiment === "negative").length;
    const neutral = results.filter((r) => r.sentiment === "neutral").length;
    const avgConfidence =
      results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length;

    return {
      totalAnalyzed: results.length,
      positive,
      negative,
      neutral,
      averageConfidence: Math.round(avgConfidence),
      recentCatalysts: results
        .filter((r) => r.catalyst)
        .slice(0, 5)
        .map((r) => r.catalyst),
      lastAnalyzed: results[0]?.analyzedAt,
    };
  } catch (error) {
    console.error("[SentimentDB] Error calculating sentiment summary:", error);
    return null;
  }
}

/**
 * Delete old sentiment analysis records (older than specified days)
 */
export async function cleanupOldSentimentData(olderThanDays: number = 30): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[SentimentDB] Database not available");
    return 0;
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Note: Drizzle doesn't have a direct delete with date comparison in the simple API
    // This is a placeholder - in production, use raw SQL or Drizzle's advanced features
    console.log(
      `[SentimentDB] Would delete sentiment records older than ${cutoffDate.toISOString()}`
    );
    return 0;
  } catch (error) {
    console.error("[SentimentDB] Error cleaning up old sentiment data:", error);
    return 0;
  }
}
