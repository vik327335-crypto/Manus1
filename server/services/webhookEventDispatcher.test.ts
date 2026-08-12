import { describe, expect, it } from "vitest";
import { parseWebhookEventTypes, selectSubscribedWebhookChannels } from "./webhookEventDispatcher";

describe("WebhookEventDispatcher", () => {
  it("разбирает только корректный массив типов событий из конфигурации канала", () => {
    expect(parseWebhookEventTypes('["price_alert","trading_signal"]')).toEqual(["price_alert", "trading_signal"]);
    expect(parseWebhookEventTypes("not-json")).toEqual([]);
    expect(parseWebhookEventTypes('{"event":"price_alert"}')).toEqual([]);
  });

  it("выбирает только активные каналы, подписанные на передаваемое событие", () => {
    const channels = [
      { id: 1, enabled: 1, eventTypes: '["price_alert"]' },
      { id: 2, enabled: 0, eventTypes: '["price_alert","trading_signal"]' },
      { id: 3, enabled: 1, eventTypes: '["trading_signal"]' },
      { id: 4, enabled: 1, eventTypes: "invalid" },
    ];

    expect(selectSubscribedWebhookChannels(channels, "price_alert").map((channel) => channel.id)).toEqual([1]);
    expect(selectSubscribedWebhookChannels(channels, "trading_signal").map((channel) => channel.id)).toEqual([3]);
  });
});
