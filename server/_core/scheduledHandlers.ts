import { Request, Response } from "express";
import { sdk } from "./sdk";
import { schedulerService } from "../services/schedulerService";
import { getPaperTradingMonitorByTaskUid } from "../db";
import { recordPaperTradingMonitorFailure, runPaperTradingMonitor } from "../services/paperTradingMonitorService";

/**
 * Scheduled Handlers
 * These handlers are called by the Heartbeat system for periodic tasks
 */

export async function syncBalancesHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);

    // Check if this is a cron request
    const isCron = (user as any).isCron === true;
    if (!isCron || !user.id) {
      return res.status(403).json({ error: "cron-only" });
    }

    const result = await schedulerService.syncBalancesForUser(user.id);

    res.json({
      ok: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in syncBalancesHandler:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: {
        url: req.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export async function runBacktestsHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);

    const isCron = (user as any).isCron === true;
    if (!isCron || !user.id) {
      return res.status(403).json({ error: "cron-only" });
    }

    const result = await schedulerService.runPeriodicBacktests(user.id);

    res.json({
      ok: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in runBacktestsHandler:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: {
        url: req.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export async function updateLeaderboardHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);

    const isCron = (user as any).isCron === true;
    if (!isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    const result = await schedulerService.updateLeaderboardRankings();

    res.json({
      ok: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in updateLeaderboardHandler:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: {
        url: req.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export async function cleanupDataHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);

    const isCron = (user as any).isCron === true;
    if (!isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    const daysToKeep = (req.body?.daysToKeep as number) || 30;
    const result = await schedulerService.cleanupOldData(daysToKeep);

    res.json({
      ok: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in cleanupDataHandler:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: {
        url: req.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export async function generateDailySummaryHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);

    const isCron = (user as any).isCron === true;
    if (!isCron || !user.id) {
      return res.status(403).json({ error: "cron-only" });
    }

    const result = await schedulerService.generateDailySummary(user.id);

    res.json({
      ok: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in generateDailySummaryHandler:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: {
        url: req.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Runs a monitor resolved only by the verified Heartbeat task UID. Request body
 * values are intentionally ignored to prevent cross-monitor execution.
 */
export async function paperTradingMonitorHandler(req: Request, res: Response) {
  let monitorId: number | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    const taskUid = (user as any).taskUid as string | undefined;
    if (!(user as any).isCron || !taskUid) return res.status(403).json({ error: "cron-only" });

    const monitor = await getPaperTradingMonitorByTaskUid(taskUid);
    if (!monitor) return res.json({ ok: true, skipped: "orphan", taskUid });
    if (!monitor.enabled) return res.json({ ok: true, skipped: "monitor_disabled", taskUid, monitorId: monitor.id });

    monitorId = monitor.id;
    const result = await runPaperTradingMonitor(monitor.id);
    res.json({ ok: true, taskUid, monitorId: monitor.id, result, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("Error in paperTradingMonitorHandler:", error);
    const diagnostic = monitorId ? await recordPaperTradingMonitorFailure(monitorId, error).catch((diagnosticError) => {
      console.error("Error recording paperTrading monitor failure:", diagnosticError);
      return null;
    }) : null;
    res.status(500).json({
      error: error.message,
      diagnostic,
      context: { url: req.url, timestamp: new Date().toISOString() },
    });
  }
}
