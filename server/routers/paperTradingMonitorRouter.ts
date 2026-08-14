import { and, eq } from "drizzle-orm";
import { parse as parseCookie } from "cookie";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { paperTradingMonitors } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { getDb } from "../db";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import { protectedProcedure, router } from "../_core/trpc";
import { getMonitorDashboard, runPaperTradingMonitor } from "../services/paperTradingMonitorService";

const DEFAULT_DAILY_CRON = "0 10 0 * * *";
const symbolsSchema = z.array(z.enum(["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT"]))
  .min(1)
  .max(6)
  .refine((symbols) => new Set(symbols).size === symbols.length, "Symbols must be unique");
const monitorThresholdsSchema = z.object({
  minimumTradeCount: z.number().int().min(3).max(100),
  watchProfitFactorMilli: z.number().int().min(1_000).max(5_000),
  degradedProfitFactorMilli: z.number().int().min(100).max(4_999),
  degradedBenchmarkLagBps: z.number().int().min(100).max(5_000),
}).refine((value) => value.degradedProfitFactorMilli < value.watchProfitFactorMilli, {
  message: "Degraded PF threshold must be lower than watch PF threshold",
  path: ["degradedProfitFactorMilli"],
});

async function requireOwnedMonitor(userId: number, monitorId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const monitor = (await db.select().from(paperTradingMonitors).where(and(eq(paperTradingMonitors.id, monitorId), eq(paperTradingMonitors.userId, userId))).limit(1))[0];
  if (!monitor) throw new TRPCError({ code: "NOT_FOUND", message: "Monitor not found" });
  return { db, monitor };
}

export const paperTradingMonitorRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().trim().min(3).max(120),
      symbols: symbolsSchema.default(["BTCUSDT", "ETHUSDT", "SOLUSDT"]),
      initialCapitalUsd: z.number().min(100).max(10_000_000).default(10_000),
      rollingWindowDays: z.number().int().min(30).max(365).default(90),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const initialCapitalCents = Math.round(input.initialCapitalUsd * 100);
      const result = await db.insert(paperTradingMonitors).values({
        userId: ctx.user.id,
        name: input.name,
        symbols: input.symbols,
        initialCapitalCents,
        cashCents: initialCapitalCents,
        rollingWindowDays: input.rollingWindowDays,
        enabled: 0,
        lastStatus: "idle",
      });
      return { monitorId: Number(result[0].insertId), enabled: false };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(paperTradingMonitors).where(eq(paperTradingMonitors.userId, ctx.user.id));
  }),

  dashboard: protectedProcedure
    .input(z.object({ monitorId: z.number().int().positive() }))
    .query(({ ctx, input }) => getMonitorDashboard(ctx.user.id, input.monitorId)),

  exportAlertAuditCsv: protectedProcedure
    .input(z.object({ monitorId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const dashboard = await getMonitorDashboard(ctx.user.id, input.monitorId);
      const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
      const csv = [
        ["created_at", "alert_kind", "delivery_status", "message"].map(escape).join(","),
        ...dashboard.alerts.map((alert) => [alert.createdAt.toISOString(), alert.alertKind, alert.deliveryStatus, alert.message].map(escape).join(",")),
      ].join("\n");
      return { filename: `paper-monitor-${input.monitorId}-alert-audit.csv`, csv };
    }),

  updateThresholds: protectedProcedure
    .input(z.object({ monitorId: z.number().int().positive(), thresholds: monitorThresholdsSchema }))
    .mutation(async ({ ctx, input }) => {
      const { db, monitor } = await requireOwnedMonitor(ctx.user.id, input.monitorId);
      await db.update(paperTradingMonitors).set(input.thresholds).where(eq(paperTradingMonitors.id, monitor.id));
      return { monitorId: monitor.id, thresholds: input.thresholds };
    }),

  enableDaily: protectedProcedure
    .input(z.object({ monitorId: z.number().int().positive(), cron: z.string().default(DEFAULT_DAILY_CRON) }))
    .mutation(async ({ ctx, input }) => {
      if (process.env.NODE_ENV !== "production") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Publish the current application version before enabling a daily schedule.",
        });
      }
      const { db, monitor } = await requireOwnedMonitor(ctx.user.id, input.monitorId);
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing active session" });

      let taskUid = monitor.scheduleCronTaskUid;
      if (taskUid) {
        await updateHeartbeatJob(taskUid, { cron: input.cron, enable: true, description: `Daily paper-trading monitor ${monitor.name}` }, sessionToken);
      } else {
        const job = await createHeartbeatJob({
          name: `paper-monitor-${monitor.id}-${ctx.user.id}`,
          cron: input.cron,
          path: "/api/scheduled/paper-trading-monitor",
          description: `Daily paper-trading monitor ${monitor.name}`,
        }, sessionToken);
        taskUid = job.taskUid;
      }

      await db.update(paperTradingMonitors).set({
        scheduleCronTaskUid: taskUid,
        scheduleCron: input.cron,
        enabled: 1,
        lastStatus: "idle",
      }).where(eq(paperTradingMonitors.id, monitor.id));
      return { taskUid, cron: input.cron, enabled: true };
    }),

  pauseDaily: protectedProcedure
    .input(z.object({ monitorId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { db, monitor } = await requireOwnedMonitor(ctx.user.id, input.monitorId);
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      if (monitor.scheduleCronTaskUid && sessionToken) await updateHeartbeatJob(monitor.scheduleCronTaskUid, { enable: false }, sessionToken);
      await db.update(paperTradingMonitors).set({ enabled: 0, lastStatus: "paused" }).where(eq(paperTradingMonitors.id, monitor.id));
      return { enabled: false };
    }),

  runNow: protectedProcedure
    .input(z.object({ monitorId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { monitor } = await requireOwnedMonitor(ctx.user.id, input.monitorId);
      if (!monitor.enabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Enable daily monitoring before running it" });
      return runPaperTradingMonitor(monitor.id);
    }),
});
