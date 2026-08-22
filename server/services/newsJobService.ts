import { getAllNews as _getAllNews, getNewsByAsset } from "./rssService";
import { analyzeSentiment, extractCatalysts } from "./sentimentService";
import { storeSentimentAnalysis } from "../db/sentimentDb";

/**
 * Background job for periodic news fetching and sentiment analysis
 * This service runs at regular intervals to keep news data fresh
 */

export interface NewsUpdateJob {
  id: string;
  assetId: number;
  ticker: string;
  name: string;
  lastUpdated: Date;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}

// Track running jobs
const runningJobs: Map<string, NewsUpdateJob> = new Map();

/**
 * Fetch and analyze news for a specific asset
 */
export async function updateAssetNews(
  assetId: number,
  ticker: string,
  name: string
): Promise<NewsUpdateJob> {
  const jobId = `news-${assetId}-${Date.now()}`;
  const job: NewsUpdateJob = {
    id: jobId,
    assetId,
    ticker,
    name,
    lastUpdated: new Date(),
    status: "pending",
  };

  runningJobs.set(jobId, job);

  try {
    job.status = "running";

    // Fetch news for the asset
    const news = await getNewsByAsset(ticker, name);

    if (news.length === 0) {
      job.status = "completed";
      runningJobs.set(jobId, job);
      return job;
    }

    // Analyze sentiment for all news items
    const newsForAnalysis = news.map((item) => ({
      title: item.title,
      source: item.source,
      url: item.link,
      publishedAt: new Date(item.pubDate),
      sentiment: "neutral" as const,
      score: 0,
      catalysts: [],
      summary: item.description,
      content: item.content || item.description,
    }));

    const sentiment = await analyzeSentiment(newsForAnalysis as any);
    const catalysts = await extractCatalysts(newsForAnalysis as any);

    // Store results in database
    for (const item of news) {
      try {
        await storeSentimentAnalysis({
          assetId,
          source: item.source,
          catalyst: catalysts ? catalysts[0] : "news",
          sentiment: (sentiment?.sentiment as "positive" | "neutral" | "negative") || "neutral",
          confidence: Math.round((sentiment?.score || 0) * 100),
          summary: item.description,
          sourceUrl: item.link,
        });
      } catch (error) {
        console.error(
          `[NewsJob] Error storing sentiment for ${ticker}:`,
          error
        );
        // Continue with next item even if one fails
      }
    }

    job.status = "completed";
    job.lastUpdated = new Date();
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Unknown error";
    console.error(`[NewsJob] Error updating news for ${ticker}:`, error);
  }

  runningJobs.set(jobId, job);
  return job;
}

/**
 * Batch update news for multiple assets
 */
export async function updateMultipleAssets(
  assets: Array<{ id: number; ticker: string; name: string }>
): Promise<NewsUpdateJob[]> {
  const jobs = await Promise.all(
    assets.map((asset) =>
      updateAssetNews(asset.id, asset.ticker, asset.name)
    )
  );
  return jobs;
}

/**
 * Get job status
 */
export function getJobStatus(jobId: string): NewsUpdateJob | undefined {
  return runningJobs.get(jobId);
}

/**
 * Get all running jobs
 */
export function getRunningJobs(): NewsUpdateJob[] {
  const jobs: NewsUpdateJob[] = [];
  runningJobs.forEach((job) => {
    if (job.status === "running" || job.status === "pending") {
      jobs.push(job);
    }
  });
  return jobs;
}

/**
 * Clear completed jobs older than specified time
 */
export function cleanupOldJobs(olderThanMs: number = 24 * 60 * 60 * 1000): void {
  const now = Date.now();
  const jobsToDelete: string[] = [];
  runningJobs.forEach((job, jobId) => {
    if (
      (job.status === "completed" || job.status === "failed") &&
      now - job.lastUpdated.getTime() > olderThanMs
    ) {
      jobsToDelete.push(jobId);
    }
  });
  jobsToDelete.forEach((jobId) => runningJobs.delete(jobId));
}

/**
 * Initialize periodic news update job
 * Runs every 30 minutes by default
 */
export function startPeriodicNewsUpdates(
  assets: Array<{ id: number; ticker: string; name: string }>,
  intervalMs: number = 30 * 60 * 1000
): NodeJS.Timeout {
  console.info(
    `[NewsJob] Starting periodic news updates every ${intervalMs / 1000 / 60} minutes`
  );

  // Run immediately
  updateMultipleAssets(assets).catch((error) => {
    console.error("[NewsJob] Error in initial update:", error);
  });

  // Then run at intervals
  const interval = setInterval(() => {
    updateMultipleAssets(assets).catch((error) => {
      console.error("[NewsJob] Error in periodic update:", error);
    });

    // Cleanup old jobs every 6 hours
    cleanupOldJobs();
  }, intervalMs);

  return interval;
}

/**
 * Stop periodic news updates
 */
export function stopPeriodicNewsUpdates(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  console.info("[NewsJob] Stopped periodic news updates");
}
