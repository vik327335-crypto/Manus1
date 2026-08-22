import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { exchangeConnectionAudits, exchangeConnections } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { encryptExchangeCredential, fingerprintExchangeKey, maskExchangeKey } from "../services/exchangeConnectionCrypto";
import { checkReadOnlyPermissions, retrieveReadOnlyBalances, type ReadOnlyBalance } from "../services/exchangeBalanceService";
import { getUsdPriceQuotes, normalizeExchangeAsset as _normalizeExchangeAsset, valueBalancesInUsd } from "../services/exchangeBalanceValuationService";

const providerSchema = z.enum(["binance", "coinbase", "kraken"]);

async function recordAudit(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, connectionId: number, userId: number, action: "created" | "disabled" | "enabled" | "rotated" | "deleted" | "permission_check" | "balance_check", details: Record<string, string | number | boolean>) {
  await db.insert(exchangeConnectionAudits).values({ connectionId, userId, action, details });
}

export const exchangeConnectionRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const rows = await db.select().from(exchangeConnections).where(eq(exchangeConnections.userId, ctx.user.id)).orderBy(desc(exchangeConnections.updatedAt));
    return rows.map((connection) => ({ id: connection.id, provider: connection.provider, keyMasked: maskExchangeKey(connection.keyFingerprint), permissionMode: connection.permissionMode, status: connection.status, createdAt: connection.createdAt, updatedAt: connection.updatedAt }));
  }),
  securityPosture: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [connections, audits] = await Promise.all([
      db.select().from(exchangeConnections).where(eq(exchangeConnections.userId, ctx.user.id)).orderBy(desc(exchangeConnections.updatedAt)),
      db.select({ connectionId: exchangeConnectionAudits.connectionId, action: exchangeConnectionAudits.action, createdAt: exchangeConnectionAudits.createdAt }).from(exchangeConnectionAudits).where(eq(exchangeConnectionAudits.userId, ctx.user.id)).orderBy(desc(exchangeConnectionAudits.createdAt)),
    ]);
    const auditCounts = audits.reduce<Record<string, number>>((counts, audit) => ({ ...counts, [audit.action]: (counts[audit.action] ?? 0) + 1 }), {});
    const lastChecks = new Map<number, { balanceCheckAt: Date | null; permissionCheckAt: Date | null }>();
    for (const audit of audits) {
      const current = lastChecks.get(audit.connectionId) ?? { balanceCheckAt: null, permissionCheckAt: null };
      if (audit.action === "balance_check" && !current.balanceCheckAt) current.balanceCheckAt = audit.createdAt;
      if (audit.action === "permission_check" && !current.permissionCheckAt) current.permissionCheckAt = audit.createdAt;
      lastChecks.set(audit.connectionId, current);
    }
    const staleAfterDays = 30;
    const staleBefore = new Date(Date.now() - staleAfterDays * 24 * 60 * 60 * 1000);
    const connectionChecks = connections.map((connection) => {
      const checks = lastChecks.get(connection.id) ?? { balanceCheckAt: null, permissionCheckAt: null };
      const mostRecentCheck = [checks.balanceCheckAt, checks.permissionCheckAt].filter((value): value is Date => value instanceof Date).sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
      return { id: connection.id, provider: connection.provider, keyMasked: maskExchangeKey(connection.keyFingerprint), status: connection.status, balanceCheckAt: checks.balanceCheckAt, permissionCheckAt: checks.permissionCheckAt, stale: connection.status === "active" && (!mostRecentCheck || mostRecentCheck < staleBefore) };
    });
    return {
      totalConnections: connections.length,
      activeConnections: connections.filter((connection) => connection.status === "active").length,
      disabledConnections: connections.filter((connection) => connection.status === "disabled").length,
      staleAfterDays,
      staleConnectionIds: connectionChecks.filter((connection) => connection.stale).map((connection) => connection.id),
      auditCounts,
      connections: connectionChecks,
    };
  }),
  balances: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const rows = await db.select().from(exchangeConnections).where(and(eq(exchangeConnections.userId, ctx.user.id), eq(exchangeConnections.status, "active")));
    const connectionResults = await Promise.all(rows.map(async (connection) => {
      try {
        const balances = await retrieveReadOnlyBalances(connection);
        await recordAudit(db, connection.id, ctx.user.id, "balance_check", { success: true, assetCount: balances.length });
        return { id: connection.id, provider: connection.provider, keyMasked: maskExchangeKey(connection.keyFingerprint), status: "ok" as const, balances };
      } catch {
        await recordAudit(db, connection.id, ctx.user.id, "balance_check", { success: false });
        return { id: connection.id, provider: connection.provider, keyMasked: maskExchangeKey(connection.keyFingerprint), status: "error" as const, balances: [], message: "Read-only balance retrieval failed. Verify the key is active and has only the documented account-read permission." };
      }
    }));
    const successfulBalances = connectionResults.reduce<ReadOnlyBalance[]>((all, connection) => connection.status === "ok" ? [...all, ...connection.balances] : all, []);
    const quoteResult = await getUsdPriceQuotes(successfulBalances.map((balance) => balance.asset));
    const connections = connectionResults.map((connection) => {
      if (connection.status === "error") return connection;
      const balances = valueBalancesInUsd<ReadOnlyBalance>(connection.balances as ReadOnlyBalance[], quoteResult.quotes);
      const unpricedAssets = Array.from(new Set(balances.filter((balance) => balance.usdValue === null).map((balance) => balance.normalizedAsset))).sort();
      const valuedTotalUsd = balances.reduce((total, balance) => total + (balance.usdValue ?? 0), 0);
      return { ...connection, balances, valuedTotalUsd, unpricedAssets, pricedBalanceCount: balances.filter((balance) => balance.usdValue !== null).length };
    });
    const valuedConnections = connections.filter((connection) => connection.status === "ok");
    const unpricedAssets = Array.from(new Set(valuedConnections.flatMap((connection) => connection.unpricedAssets))).sort();
    return {
      retrievedAt: new Date(),
      connections,
      valuation: {
        totalUsd: valuedConnections.reduce((total, connection) => total + connection.valuedTotalUsd, 0),
        pricedBalanceCount: valuedConnections.reduce((total, connection) => total + connection.pricedBalanceCount, 0),
        unpricedAssets,
        priceSource: "CoinGecko Simple Price with explicit USD stablecoin parity mapping",
        priceRetrievedAt: quoteResult.retrievedAt,
      },
    };
  }),
  permissionCheck: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const rows = await db.select().from(exchangeConnections).where(and(eq(exchangeConnections.id, input.id), eq(exchangeConnections.userId, ctx.user.id), eq(exchangeConnections.status, "active"))).limit(1);
    if (!rows.length) throw new Error("Active exchange connection not found");
    const connection = rows[0];
    try {
      const diagnostic = await checkReadOnlyPermissions(connection);
      await recordAudit(db, connection.id, ctx.user.id, "permission_check", {
        success: true,
        verdict: diagnostic.verdict,
        canView: diagnostic.canView ?? false,
        canTrade: diagnostic.canTrade ?? false,
        canTransferOrWithdraw: diagnostic.canTransferOrWithdraw ?? false,
      });
      return { id: connection.id, ...diagnostic, checkedAt: new Date() };
    } catch {
      await recordAudit(db, connection.id, ctx.user.id, "permission_check", { success: false });
      throw new Error("Read-only permission diagnostic failed. Verify the key is active and review its permissions in the exchange portal.");
    }
  }),
  rotate: protectedProcedure.input(z.object({ id: z.number().int().positive(), apiKey: z.string().trim().min(8).max(1024), apiSecret: z.string().trim().min(8).max(2048), apiPassphrase: z.string().trim().max(1024).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const rows = await db.select({ id: exchangeConnections.id, provider: exchangeConnections.provider, status: exchangeConnections.status }).from(exchangeConnections).where(and(eq(exchangeConnections.id, input.id), eq(exchangeConnections.userId, ctx.user.id))).limit(1);
    if (!rows.length) throw new Error("Exchange connection not found");
    const connection = rows[0];
    const keyFingerprint = fingerprintExchangeKey(input.apiKey);
    const duplicate = await db.select({ id: exchangeConnections.id }).from(exchangeConnections).where(and(eq(exchangeConnections.userId, ctx.user.id), eq(exchangeConnections.provider, connection.provider), eq(exchangeConnections.keyFingerprint, keyFingerprint))).limit(1);
    if (duplicate.some((row) => row.id !== connection.id)) throw new Error("This read-only connection is already recorded");
    await db.update(exchangeConnections).set({
      apiKeyCiphertext: encryptExchangeCredential(input.apiKey),
      apiSecretCiphertext: encryptExchangeCredential(input.apiSecret),
      apiPassphraseCiphertext: input.apiPassphrase ? encryptExchangeCredential(input.apiPassphrase) : null,
      keyFingerprint,
      permissionMode: "read_only",
    }).where(and(eq(exchangeConnections.id, connection.id), eq(exchangeConnections.userId, ctx.user.id)));
    await recordAudit(db, connection.id, ctx.user.id, "rotated", { provider: connection.provider, status: connection.status, credentialMaterialReplaced: true, permissionMode: "read_only" });
    return { id: connection.id, keyMasked: maskExchangeKey(keyFingerprint), status: connection.status };
  }),
  create: protectedProcedure.input(z.object({ provider: providerSchema, apiKey: z.string().trim().min(8).max(1024), apiSecret: z.string().trim().min(8).max(2048), apiPassphrase: z.string().trim().max(1024).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const keyFingerprint = fingerprintExchangeKey(input.apiKey);
    const existing = await db.select({ id: exchangeConnections.id }).from(exchangeConnections).where(and(eq(exchangeConnections.userId, ctx.user.id), eq(exchangeConnections.provider, input.provider), eq(exchangeConnections.keyFingerprint, keyFingerprint))).limit(1);
    if (existing.length) throw new Error("This read-only connection is already recorded");
    const result = await db.insert(exchangeConnections).values({ userId: ctx.user.id, provider: input.provider, apiKeyCiphertext: encryptExchangeCredential(input.apiKey), apiSecretCiphertext: encryptExchangeCredential(input.apiSecret), apiPassphraseCiphertext: input.apiPassphrase ? encryptExchangeCredential(input.apiPassphrase) : null, keyFingerprint, permissionMode: "read_only", status: "active" });
    const id = Number(result[0].insertId);
    await recordAudit(db, id, ctx.user.id, "created", { provider: input.provider, permissionMode: "read_only" });
    return { id, keyMasked: maskExchangeKey(keyFingerprint) };
  }),
  setStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["active", "disabled"]) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const result = await db.update(exchangeConnections).set({ status: input.status }).where(and(eq(exchangeConnections.id, input.id), eq(exchangeConnections.userId, ctx.user.id)));
    if (!result[0].affectedRows) throw new Error("Exchange connection not found");
    await recordAudit(db, input.id, ctx.user.id, input.status === "active" ? "enabled" : "disabled", { status: input.status });
    return { id: input.id, status: input.status };
  }),
  remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const existing = await db.select({ status: exchangeConnections.status }).from(exchangeConnections).where(and(eq(exchangeConnections.id, input.id), eq(exchangeConnections.userId, ctx.user.id))).limit(1);
    if (!existing.length) throw new Error("Exchange connection not found");
    if (existing[0].status !== "disabled") throw new Error("Disable the exchange connection before deleting encrypted credentials");
    await recordAudit(db, input.id, ctx.user.id, "deleted", { credentialMaterialErased: true });
    await db.delete(exchangeConnections).where(and(eq(exchangeConnections.id, input.id), eq(exchangeConnections.userId, ctx.user.id)));
    return { id: input.id };
  }),
});
