import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { exchangeConnections } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { encryptExchangeCredential, fingerprintExchangeKey, maskExchangeKey } from "../services/exchangeConnectionCrypto";

const providerSchema = z.enum(["binance", "coinbase", "kraken"]);

export const exchangeConnectionRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const rows = await db.select().from(exchangeConnections).where(eq(exchangeConnections.userId, ctx.user.id)).orderBy(desc(exchangeConnections.updatedAt));
    return rows.map((connection) => ({ id: connection.id, provider: connection.provider, keyMasked: maskExchangeKey(connection.keyFingerprint), permissionMode: connection.permissionMode, status: connection.status, createdAt: connection.createdAt, updatedAt: connection.updatedAt }));
  }),
  create: protectedProcedure.input(z.object({ provider: providerSchema, apiKey: z.string().trim().min(8).max(1024), apiSecret: z.string().trim().min(8).max(2048), apiPassphrase: z.string().trim().max(1024).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const keyFingerprint = fingerprintExchangeKey(input.apiKey);
    const existing = await db.select({ id: exchangeConnections.id }).from(exchangeConnections).where(and(eq(exchangeConnections.userId, ctx.user.id), eq(exchangeConnections.provider, input.provider), eq(exchangeConnections.keyFingerprint, keyFingerprint))).limit(1);
    if (existing.length) throw new Error("This read-only connection is already recorded");
    const result = await db.insert(exchangeConnections).values({ userId: ctx.user.id, provider: input.provider, apiKeyCiphertext: encryptExchangeCredential(input.apiKey), apiSecretCiphertext: encryptExchangeCredential(input.apiSecret), apiPassphraseCiphertext: input.apiPassphrase ? encryptExchangeCredential(input.apiPassphrase) : null, keyFingerprint, permissionMode: "read_only", status: "active" });
    return { id: Number(result[0].insertId), keyMasked: maskExchangeKey(keyFingerprint) };
  }),
  setStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["active", "disabled"]) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const result = await db.update(exchangeConnections).set({ status: input.status }).where(and(eq(exchangeConnections.id, input.id), eq(exchangeConnections.userId, ctx.user.id)));
    if (!result[0].affectedRows) throw new Error("Exchange connection not found");
    return { id: input.id, status: input.status };
  }),
  remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const existing = await db.select({ status: exchangeConnections.status }).from(exchangeConnections).where(and(eq(exchangeConnections.id, input.id), eq(exchangeConnections.userId, ctx.user.id))).limit(1);
    if (!existing.length) throw new Error("Exchange connection not found");
    if (existing[0].status !== "disabled") throw new Error("Disable the exchange connection before deleting encrypted credentials");
    await db.delete(exchangeConnections).where(and(eq(exchangeConnections.id, input.id), eq(exchangeConnections.userId, ctx.user.id)));
    return { id: input.id };
  }),
});
