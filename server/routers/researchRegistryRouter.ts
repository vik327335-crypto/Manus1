import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { researchHypothesisAudits, researchHypotheses } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const statusSchema = z.enum(["draft", "preregistered", "validated", "rejected", "inconclusive"]);

export const researchRegistryRouter = router({
  list: protectedProcedure.input(z.object({ query: z.string().trim().max(160).default(""), status: statusSchema.optional(), sampleAdequacy: z.enum(["not_assessed", "insufficient", "adequate"]).optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const records = await db.select().from(researchHypotheses).where(eq(researchHypotheses.userId, ctx.user.id)).orderBy(desc(researchHypotheses.updatedAt));
    const query = input?.query.toLowerCase() ?? "";
    return records.filter((record) => (!query || `${record.title} ${record.hypothesis}`.toLowerCase().includes(query)) && (!input?.status || record.status === input.status) && (!input?.sampleAdequacy || record.sampleAdequacy === input.sampleAdequacy)).map((record) => ({ ...record, evidenceComplete: Boolean(record.protocolPath && record.resultPath && record.sampleAdequacy === "adequate") }));
  }),
  summary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const records = await db.select().from(researchHypotheses).where(eq(researchHypotheses.userId, ctx.user.id));
    const statuses = ["draft", "preregistered", "validated", "rejected", "inconclusive"] as const;
    const byStatus = Object.fromEntries(statuses.map((status) => [status, records.filter((record) => record.status === status).length]));
    const consistencyIssues = records.flatMap((record) => [
      ...(["preregistered", "validated", "rejected", "inconclusive"].includes(record.status) && !record.protocolPath ? [`${record.id}: protocol reference missing`] : []),
      ...(record.status === "validated" && (!record.resultPath || record.sampleAdequacy !== "adequate") ? [`${record.id}: validated status lacks adequate recorded evidence`] : []),
    ]);
    const protocolCoverage = records.filter((record) => Boolean(record.protocolPath)).length;
    const resultCoverage = records.filter((record) => Boolean(record.resultPath)).length;
    const remediation = records.flatMap((record) => [
      ...(!record.protocolPath ? [{ id: record.id, title: record.title, action: "Add protocol reference" }] : []),
      ...(["validated", "rejected", "inconclusive"].includes(record.status) && !record.resultPath ? [{ id: record.id, title: record.title, action: "Add result reference" }] : []),
      ...(record.status === "validated" && record.sampleAdequacy !== "adequate" ? [{ id: record.id, title: record.title, action: "Record adequate sample evidence" }] : []),
    ]);
    const activeWorkload = byStatus.draft + byStatus.preregistered + byStatus.inconclusive;
    let completeCount = 0;
    const evidenceTrend = [...records].sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime()).map((record, index) => {
      const complete = Boolean(record.protocolPath && record.resultPath && record.sampleAdequacy === "adequate");
      if (complete) completeCount += 1;
      return { asOf: record.updatedAt, recordId: record.id, complete, observedCompletionRateBps: Math.round((completeCount / (index + 1)) * 10_000) };
    });
    return { total: records.length, byStatus, adequateSamples: records.filter((record) => record.sampleAdequacy === "adequate").length, incompleteEvidence: records.filter((record) => !record.protocolPath || !record.resultPath || record.sampleAdequacy !== "adequate").length, consistency: { valid: consistencyIssues.length === 0, issues: consistencyIssues }, remediation, activeWorkload, evidenceTrend, limitations: ["Registry records describe research evidence only; they are not trading recommendations.", "Validated status requires documented protocol, result reference, and adequate sample label.", "Virtual monitor outcomes do not represent live execution, liquidity, or personal suitability."], methodologyDisclosure: "Monitor benchmark comparisons use the persisted equal-weight buy-and-hold baseline for the configured assets and evaluation window. They are descriptive historical comparisons, not forecasts or personalized financial advice.", coverage: { protocolReferences: protocolCoverage, resultReferences: resultCoverage, total: records.length, lifecycle: byStatus } };
  }),
  exportCsv: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const records = await db.select().from(researchHypotheses).where(eq(researchHypotheses.userId, ctx.user.id)).orderBy(desc(researchHypotheses.updatedAt));
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [["title", "status", "sample_adequacy", "hypothesis", "falsification_criteria", "protocol_path", "result_path", "updated_at"], ...records.map((record) => [record.title, record.status, record.sampleAdequacy, record.hypothesis, record.falsificationCriteria, record.protocolPath, record.resultPath, record.updatedAt.toISOString()])];
    return { filename: "research-registry.csv", csv: rows.map((row) => row.map(escape).join(",")).join("\n") };
  }),
  exportSummaryCsv: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const records = await db.select().from(researchHypotheses).where(eq(researchHypotheses.userId, ctx.user.id));
    const statuses = ["draft", "preregistered", "validated", "rejected", "inconclusive"] as const;
    const counts = statuses.map((status) => [status, records.filter((record) => record.status === status).length]);
    const csv = [["metric", "value"], ["total", records.length], ["adequate_samples", records.filter((record) => record.sampleAdequacy === "adequate").length], ["incomplete_evidence", records.filter((record) => !record.protocolPath || !record.resultPath || record.sampleAdequacy !== "adequate").length], ...counts].map((row) => row.map((value) => `"${String(value)}"`).join(",")).join("\n");
    return { filename: "research-status-summary.csv", csv };
  }),
  exportSnapshotCsv: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const records = await db.select().from(researchHypotheses).where(eq(researchHypotheses.userId, ctx.user.id));
    const statuses = ["draft", "preregistered", "validated", "rejected", "inconclusive"] as const;
    const counts = statuses.map((status) => [status, records.filter((record) => record.status === status).length]);
    const snapshotAt = new Date().toISOString();
    const rows = [["snapshot_at", "metric", "value"], [snapshotAt, "total", records.length], [snapshotAt, "protocol_coverage", records.filter((record) => Boolean(record.protocolPath)).length], [snapshotAt, "result_coverage", records.filter((record) => Boolean(record.resultPath)).length], [snapshotAt, "adequate_samples", records.filter((record) => record.sampleAdequacy === "adequate").length], ...counts.map(([status, count]) => [snapshotAt, `status_${status}`, count])];
    return { filename: "research-registry-snapshot.csv", csv: rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n") };
  }),
  compareOutcomes: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const records = await db.select().from(researchHypotheses).where(eq(researchHypotheses.userId, ctx.user.id));
    return records.filter((record) => record.status === "validated" || record.status === "rejected" || record.status === "inconclusive").map((record) => ({ id: record.id, title: record.title, status: record.status, sampleAdequacy: record.sampleAdequacy, evidenceComplete: Boolean(record.protocolPath && record.resultPath && record.sampleAdequacy === "adequate"), updatedAt: record.updatedAt }));
  }),
  exportOutcomeCsv: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const records = await db.select().from(researchHypotheses).where(eq(researchHypotheses.userId, ctx.user.id));
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [["id", "title", "status", "sample_adequacy", "evidence_complete", "updated_at"], ...records.filter((record) => record.status !== "draft" && record.status !== "preregistered").map((record) => [record.id, record.title, record.status, record.sampleAdequacy, Boolean(record.protocolPath && record.resultPath && record.sampleAdequacy === "adequate"), record.updatedAt.toISOString()])];
    return { filename: "research-outcome-comparison.csv", csv: rows.map((row) => row.map(escape).join(",")).join("\n") };
  }),
  auditTimeline: protectedProcedure.input(z.object({ hypothesisId: z.number().int().positive().optional(), action: z.string().trim().max(40).optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const audits = await db.select().from(researchHypothesisAudits).where(eq(researchHypothesisAudits.userId, ctx.user.id)).orderBy(desc(researchHypothesisAudits.createdAt));
    return audits.filter((audit) => (!input?.hypothesisId || audit.hypothesisId === input.hypothesisId) && (!input?.action || audit.action === input.action)).slice(0, 100);
  }),
  auditHealth: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const audits = await db.select().from(researchHypothesisAudits).where(eq(researchHypothesisAudits.userId, ctx.user.id));
    const now = Date.now();
    const issues = audits.flatMap((audit) => [
      ...(audit.hypothesisId <= 0 ? [`${audit.id}: invalid hypothesis reference`] : []),
      ...(!audit.action.trim() ? [`${audit.id}: missing audit action`] : []),
      ...(audit.createdAt.getTime() > now + 60_000 ? [`${audit.id}: future audit timestamp`] : []),
    ]);
    return { valid: issues.length === 0, total: audits.length, issues };
  }),
  exportAuditCsv: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const audits = await db.select().from(researchHypothesisAudits).where(eq(researchHypothesisAudits.userId, ctx.user.id)).orderBy(desc(researchHypothesisAudits.createdAt));
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [["id", "hypothesis_id", "action", "details", "created_at"], ...audits.map((audit) => [audit.id, audit.hypothesisId, audit.action, JSON.stringify(audit.details), audit.createdAt.toISOString()])];
    return { filename: "research-hypothesis-audit.csv", csv: rows.map((row) => row.map(escape).join(",")).join("\n") };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number().int().positive(),
    status: statusSchema.optional(),
    protocolPath: z.string().trim().max(320).nullable().optional(),
    resultPath: z.string().trim().max(320).nullable().optional(),
    sampleAdequacy: z.enum(["not_assessed", "insufficient", "adequate"]).optional(),
    confirmValidated: z.literal(true).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [existing] = await db.select().from(researchHypotheses).where(and(eq(researchHypotheses.id, input.id), eq(researchHypotheses.userId, ctx.user.id))).limit(1);
    if (!existing) throw new Error("Research hypothesis not found");
    if (input.status === "validated" && existing.status !== "validated") {
      const protocolPath = input.protocolPath === undefined ? existing.protocolPath : input.protocolPath;
      const resultPath = input.resultPath === undefined ? existing.resultPath : input.resultPath;
      const sampleAdequacy = input.sampleAdequacy ?? existing.sampleAdequacy;
      if (input.confirmValidated !== true) throw new Error("Validated status requires explicit owner confirmation");
      if (!protocolPath || !resultPath || sampleAdequacy !== "adequate") throw new Error("Validated status requires protocol, result reference, and adequate sample evidence");
    }
    const { id, confirmValidated: _confirmValidated, ...changes } = input;
    await db.update(researchHypotheses).set({ ...changes, updatedAt: new Date() }).where(eq(researchHypotheses.id, id));
    await db.insert(researchHypothesisAudits).values({ hypothesisId: id, userId: ctx.user.id, action: "updated", details: { changedFields: Object.keys(changes), previousStatus: existing.status, nextStatus: changes.status ?? existing.status } });
    return { id };
  }),
  create: protectedProcedure.input(z.object({
    title: z.string().trim().min(5).max(160),
    hypothesis: z.string().trim().min(20).max(10_000),
    status: statusSchema.default("draft"),
    falsificationCriteria: z.string().trim().min(20).max(10_000),
    protocolPath: z.string().trim().max(320).optional(),
    resultPath: z.string().trim().max(320).optional(),
    sampleAdequacy: z.enum(["not_assessed", "insufficient", "adequate"]).default("not_assessed"),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const result = await db.insert(researchHypotheses).values({ ...input, userId: ctx.user.id });
    const id = Number(result[0].insertId);
    await db.insert(researchHypothesisAudits).values({ hypothesisId: id, userId: ctx.user.id, action: "created", details: { status: input.status, sampleAdequacy: input.sampleAdequacy, hasProtocolReference: Boolean(input.protocolPath), hasResultReference: Boolean(input.resultPath) } });
    return { id };
  }),
});
