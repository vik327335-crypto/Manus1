import { createHash } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { ohlcvAuditSnapshots } from "../../drizzle/schema";
import { getDb } from "../db";
import type { HistoricalDataResponse } from "./polygonService";

export interface OHLCVAuditSnapshotStatus {
  storageAvailable: boolean;
  snapshotCount: number;
  latestSnapshotAt: number | null;
  latestSource: string | null;
  latestTicker: string | null;
}

function hashHistoricalResponse(data: HistoricalDataResponse): string {
  const canonical = JSON.stringify({
    ticker: data.ticker,
    timeframe: data.timeframe,
    startDate: data.startDate,
    endDate: data.endDate,
    coverageStartDate: data.coverageStartDate,
    coverageEndDate: data.coverageEndDate,
    source: data.source,
    data: data.data,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

/** Persist one immutable, integrity-addressed snapshot for a fresh provider response. */
export async function persistOHLCVAuditSnapshot(data: HistoricalDataResponse): Promise<{ persisted: boolean; responseHash: string | null }> {
  if (data.availability !== "available" || data.fetchedAt === null || data.cacheAgeMs !== 0 || !data.coverageStartDate || !data.coverageEndDate) {
    return { persisted: false, responseHash: null };
  }

  const db = await getDb();
  if (!db) return { persisted: false, responseHash: null };

  const responseHash = hashHistoricalResponse(data);
  try {
    await db.insert(ohlcvAuditSnapshots).values({
      ticker: data.ticker,
      timeframe: data.timeframe,
      source: data.source,
      requestedStartDate: data.startDate,
      requestedEndDate: data.endDate,
      coverageStartDate: data.coverageStartDate,
      coverageEndDate: data.coverageEndDate,
      fetchedAt: new Date(data.fetchedAt),
      dataPoints: data.dataPoints,
      responseHash,
      bars: data.data.map((bar) => ({ ...bar })),
    });
    return { persisted: true, responseHash };
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") return { persisted: false, responseHash };
    console.warn("[OHLCVAudit] Snapshot persistence unavailable:", error);
    return { persisted: false, responseHash: null };
  }
}

export async function getOHLCVAuditSnapshotStatus(): Promise<OHLCVAuditSnapshotStatus> {
  try {
    const db = await getDb();
    if (!db) return { storageAvailable: false, snapshotCount: 0, latestSnapshotAt: null, latestSource: null, latestTicker: null };
    const [latest] = await db.select().from(ohlcvAuditSnapshots).orderBy(desc(ohlcvAuditSnapshots.createdAt)).limit(1);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(ohlcvAuditSnapshots);
    return {
      storageAvailable: true,
      snapshotCount: Number(count),
      latestSnapshotAt: latest?.createdAt?.getTime() ?? null,
      latestSource: latest?.source ?? null,
      latestTicker: latest?.ticker ?? null,
    };
  } catch (error) {
    console.warn("[OHLCVAudit] Snapshot status unavailable:", error);
    return { storageAvailable: false, snapshotCount: 0, latestSnapshotAt: null, latestSource: null, latestTicker: null };
  }
}

export async function listOHLCVAuditSnapshots(ticker: string | undefined, limit: number) {
  try {
    const db = await getDb();
    if (!db) return [];
    const query = db.select({
      id: ohlcvAuditSnapshots.id,
      ticker: ohlcvAuditSnapshots.ticker,
      timeframe: ohlcvAuditSnapshots.timeframe,
      source: ohlcvAuditSnapshots.source,
      requestedStartDate: ohlcvAuditSnapshots.requestedStartDate,
      requestedEndDate: ohlcvAuditSnapshots.requestedEndDate,
      coverageStartDate: ohlcvAuditSnapshots.coverageStartDate,
      coverageEndDate: ohlcvAuditSnapshots.coverageEndDate,
      fetchedAt: ohlcvAuditSnapshots.fetchedAt,
      dataPoints: ohlcvAuditSnapshots.dataPoints,
      responseHash: ohlcvAuditSnapshots.responseHash,
      createdAt: ohlcvAuditSnapshots.createdAt,
    }).from(ohlcvAuditSnapshots);
    return ticker
      ? query.where(eq(ohlcvAuditSnapshots.ticker, ticker.toUpperCase())).orderBy(desc(ohlcvAuditSnapshots.createdAt)).limit(limit)
      : query.orderBy(desc(ohlcvAuditSnapshots.createdAt)).limit(limit);
  } catch (error) {
    console.warn("[OHLCVAudit] Snapshot listing unavailable:", error);
    return [];
  }
}
