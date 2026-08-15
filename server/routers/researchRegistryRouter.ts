import { desc, eq } from "drizzle-orm";
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
    return { total: records.length, byStatus, adequateSamples: records.filter((record) => record.sampleAdequacy === "adequate").length, incompleteEvidence: records.filter((record) => !record.protocolPath || !record.resultPath || record.sampleAdequacy !== "adequate").length };
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
