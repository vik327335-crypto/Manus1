import { eq } from "drizzle-orm";
import { webhookChannels, webhookDeliveryLogs } from "../../drizzle/schema";
import { getDb } from "../db";
import WebhookIntegrationService, {
  type WebhookEvent,
  type WebhookEventType,
  type WebhookChannelType,
} from "./webhookIntegrationService";

export interface WebhookDispatchSummary {
  requested: number;
  delivered: number;
  failed: number;
  skipped: number;
}

export const parseWebhookEventTypes = (serialized: string): WebhookEventType[] => {
  try {
    const parsed = JSON.parse(serialized);
    return Array.isArray(parsed) ? parsed.filter((event): event is WebhookEventType => typeof event === "string") : [];
  } catch {
    return [];
  }
};

export const selectSubscribedWebhookChannels = <T extends { enabled: number | null; eventTypes: string }>(
  channels: T[],
  eventType: WebhookEventType
): T[] => channels.filter((channel) => Boolean(channel.enabled) && parseWebhookEventTypes(channel.eventTypes).includes(eventType));

export class WebhookEventDispatcher {
  static async dispatchForUser(userId: number, event: WebhookEvent): Promise<WebhookDispatchSummary> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allChannels = await db.select().from(webhookChannels).where(eq(webhookChannels.userId, userId));
    const subscribedChannels = selectSubscribedWebhookChannels(allChannels, event.type);

    const deliveryResults = await Promise.all(
      subscribedChannels.map(async (channel) => {
        const result = await WebhookIntegrationService.deliver(
          channel.endpointUrl,
          channel.channelType as WebhookChannelType,
          event
        );
        await db.insert(webhookDeliveryLogs).values({
          userId,
          channelId: channel.id,
          eventType: event.type,
          success: result.success ? 1 : 0,
          statusCode: result.statusCode ?? null,
          responseSummary: result.responseSummary,
        });
        return result;
      })
    );

    return {
      requested: subscribedChannels.length,
      delivered: deliveryResults.filter((result) => result.success).length,
      failed: deliveryResults.filter((result) => !result.success).length,
      skipped: allChannels.length - subscribedChannels.length,
    };
  }
}

export default WebhookEventDispatcher;
