import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { webhookChannels, webhookDeliveryLogs } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import {
  WEBHOOK_EVENT_TYPES,
  WebhookIntegrationService,
  type WebhookChannelType,
  type WebhookEventType,
} from "../services/webhookIntegrationService";
import WebhookEventDispatcher from "../services/webhookEventDispatcher";

const channelTypeSchema = z.enum(["generic", "discord", "slack", "telegram"]);
const eventTypeSchema = z.enum(WEBHOOK_EVENT_TYPES);

const channelInput = z.object({
  name: z.string().trim().min(2).max(120),
  channelType: channelTypeSchema,
  endpointUrl: z.string().url().max(2048),
  eventTypes: z.array(eventTypeSchema).min(1),
  enabled: z.boolean().default(true),
});

export const webhookIntegrationRouter = router({
  getSupportedEvents: protectedProcedure.query(() => ({
    success: true,
    events: WEBHOOK_EVENT_TYPES,
  })),

  listChannels: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const channels = await db.select().from(webhookChannels).where(eq(webhookChannels.userId, ctx.user.id)).orderBy(desc(webhookChannels.createdAt));

    return {
      success: true,
      channels: channels.map((channel) => ({
        ...channel,
        endpointUrl: WebhookIntegrationService.validateEndpointUrl(channel.endpointUrl).normalizedUrl ?? channel.endpointUrl,
        eventTypes: JSON.parse(channel.eventTypes) as WebhookEventType[],
        enabled: Boolean(channel.enabled),
      })),
    };
  }),

  createChannel: protectedProcedure.input(channelInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const validation = WebhookIntegrationService.validateEndpointUrl(input.endpointUrl);
    if (!validation.valid || !validation.normalizedUrl) throw new Error(validation.error ?? "Invalid webhook URL");

    const result = await db.insert(webhookChannels).values({
      userId: ctx.user.id,
      name: input.name,
      channelType: input.channelType,
      endpointUrl: validation.normalizedUrl,
      eventTypes: JSON.stringify(input.eventTypes),
      enabled: input.enabled ? 1 : 0,
    });

    return { success: true, channelId: Number(result[0].insertId) };
  }),

  updateChannel: protectedProcedure
    .input(channelInput.partial().extend({ channelId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { channelId, endpointUrl, eventTypes, enabled, ...fields } = input;
      const values: Record<string, unknown> = { ...fields };

      if (endpointUrl !== undefined) {
        const validation = WebhookIntegrationService.validateEndpointUrl(endpointUrl);
        if (!validation.valid || !validation.normalizedUrl) throw new Error(validation.error ?? "Invalid webhook URL");
        values.endpointUrl = validation.normalizedUrl;
      }
      if (eventTypes !== undefined) values.eventTypes = JSON.stringify(eventTypes);
      if (enabled !== undefined) values.enabled = enabled ? 1 : 0;
      if (Object.keys(values).length === 0) return { success: true, updated: false };

      const result = await db.update(webhookChannels).set(values).where(and(eq(webhookChannels.id, channelId), eq(webhookChannels.userId, ctx.user.id)));
      return { success: true, updated: result[0].affectedRows > 0 };
    }),

  deleteChannel: protectedProcedure.input(z.object({ channelId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.delete(webhookChannels).where(and(eq(webhookChannels.id, input.channelId), eq(webhookChannels.userId, ctx.user.id)));
    return { success: true, deleted: result[0].affectedRows > 0 };
  }),

  previewPayload: protectedProcedure
    .input(z.object({ channelType: channelTypeSchema, eventType: eventTypeSchema, title: z.string().min(1).max(200), message: z.string().min(1).max(1000) }))
    .query(({ input }) => ({
      success: true,
      payload: WebhookIntegrationService.buildPayload(input.channelType as WebhookChannelType, { type: input.eventType, title: input.title, message: input.message }),
    })),

  dispatchEvent: protectedProcedure
    .input(z.object({
      eventType: eventTypeSchema,
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(1000),
      data: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => ({
      success: true,
      summary: await WebhookEventDispatcher.dispatchForUser(ctx.user.id, {
        type: input.eventType,
        title: input.title,
        message: input.message,
        data: input.data,
      }),
    })),

  sendTest: protectedProcedure.input(z.object({ channelId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const channel = (await db.select().from(webhookChannels).where(and(eq(webhookChannels.id, input.channelId), eq(webhookChannels.userId, ctx.user.id))).limit(1))[0];
    if (!channel) throw new Error("Webhook channel not found");

    const result = await WebhookIntegrationService.deliver(
      channel.endpointUrl,
      channel.channelType as WebhookChannelType,
      { type: "system_health", title: "Webhook connection test", message: "CAN SLIM Crypto Scanner successfully sent a test webhook." }
    );

    await db.insert(webhookDeliveryLogs).values({
      userId: ctx.user.id,
      channelId: channel.id,
      eventType: "system_health",
      success: result.success ? 1 : 0,
      statusCode: result.statusCode ?? null,
      attemptCount: result.attemptCount,
      retried: result.retried ? 1 : 0,
      responseSummary: result.responseSummary,
    });

    return { success: result.success, statusCode: result.statusCode, responseSummary: result.responseSummary };
  }),

  getDeliveryLogs: protectedProcedure
    .input(z.object({ channelId: z.number().int().positive(), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const logs = await db.select().from(webhookDeliveryLogs).where(and(eq(webhookDeliveryLogs.userId, ctx.user.id), eq(webhookDeliveryLogs.channelId, input.channelId))).orderBy(desc(webhookDeliveryLogs.createdAt)).limit(input.limit);
      return { success: true, logs: logs.map((log) => ({ ...log, success: Boolean(log.success) })) };
    }),

  getRecentDeliveryLogs: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const logs = await db.select().from(webhookDeliveryLogs).where(eq(webhookDeliveryLogs.userId, ctx.user.id)).orderBy(desc(webhookDeliveryLogs.createdAt)).limit(input.limit);
      return { success: true, logs: logs.map((log) => ({ ...log, success: Boolean(log.success) })) };
    }),
});

export default webhookIntegrationRouter;
