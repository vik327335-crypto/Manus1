export const WEBHOOK_EVENT_TYPES = [
  "price_alert",
  "trading_signal",
  "portfolio_update",
  "risk_alert",
  "rebalance_plan",
  "system_health",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];
export type WebhookChannelType = "generic" | "discord" | "slack" | "telegram";

export interface WebhookEvent {
  type: WebhookEventType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  occurredAt?: Date;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  responseSummary: string;
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return false;
  const [first, second] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

export class WebhookIntegrationService {
  static validateEndpointUrl(endpointUrl: string): { valid: boolean; error?: string; normalizedUrl?: string } {
    try {
      const url = new URL(endpointUrl.trim());
      const hostname = url.hostname.toLowerCase();

      if (url.protocol !== "https:") {
        return { valid: false, error: "Webhook URL must use HTTPS" };
      }

      if (
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname.endsWith(".local") ||
        hostname === "::1" ||
        hostname.startsWith("fc") ||
        hostname.startsWith("fd") ||
        isPrivateIpv4(hostname)
      ) {
        return { valid: false, error: "Private or local network targets are not permitted" };
      }

      return { valid: true, normalizedUrl: url.toString() };
    } catch {
      return { valid: false, error: "Webhook URL is invalid" };
    }
  }

  static buildPayload(channelType: WebhookChannelType, event: WebhookEvent): Record<string, unknown> {
    const occurredAt = (event.occurredAt ?? new Date()).toISOString();
    const base = {
      source: "CAN SLIM Crypto Scanner",
      event: event.type,
      title: event.title,
      message: event.message,
      occurredAt,
      data: event.data ?? {},
    };

    if (channelType === "discord") {
      return { content: `**${event.title}**\n${event.message}`, embeds: [{ title: event.type, timestamp: occurredAt }], ...base };
    }

    if (channelType === "slack") {
      return { text: `*${event.title}*\n${event.message}`, ...base };
    }

    return base;
  }

  static async deliver(
    endpointUrl: string,
    channelType: WebhookChannelType,
    event: WebhookEvent
  ): Promise<WebhookDeliveryResult> {
    const validation = this.validateEndpointUrl(endpointUrl);
    if (!validation.valid || !validation.normalizedUrl) {
      return { success: false, responseSummary: validation.error ?? "Webhook URL validation failed" };
    }

    try {
      const response = await fetch(validation.normalizedUrl, {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": "CANSLIM-Crypto-Scanner/1.0" },
        body: JSON.stringify(this.buildPayload(channelType, event)),
        signal: AbortSignal.timeout(10_000),
      });
      const responseSummary = (await response.text()).slice(0, 500);

      return {
        success: response.ok,
        statusCode: response.status,
        responseSummary: responseSummary || (response.ok ? "Delivered" : "Webhook endpoint returned an empty error response"),
      };
    } catch (error) {
      return {
        success: false,
        responseSummary: error instanceof Error ? error.message.slice(0, 500) : "Webhook delivery failed",
      };
    }
  }
}

export default WebhookIntegrationService;
