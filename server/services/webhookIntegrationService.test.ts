import { afterEach, describe, expect, it, vi } from "vitest";
import WebhookIntegrationService from "./webhookIntegrationService";

describe("WebhookIntegrationService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("разрешает только безопасные публичные HTTPS endpoint-ы", () => {
    expect(WebhookIntegrationService.validateEndpointUrl("https://hooks.example.com/notify")).toMatchObject({ valid: true });
    expect(WebhookIntegrationService.validateEndpointUrl("http://hooks.example.com/notify")).toMatchObject({ valid: false, error: "Webhook URL must use HTTPS" });
    expect(WebhookIntegrationService.validateEndpointUrl("https://localhost/callback")).toMatchObject({ valid: false });
    expect(WebhookIntegrationService.validateEndpointUrl("https://10.0.0.1/internal")).toMatchObject({ valid: false });
  });

  it("создаёт payload для Discord и generic webhook с каноническими полями события", () => {
    const event = { type: "price_alert" as const, title: "BTC threshold", message: "Price threshold reached", occurredAt: new Date("2026-08-12T12:00:00.000Z") };
    const discordPayload = WebhookIntegrationService.buildPayload("discord", event);
    const genericPayload = WebhookIntegrationService.buildPayload("generic", event);

    expect(discordPayload).toMatchObject({ content: "**BTC threshold**\nPrice threshold reached", event: "price_alert" });
    expect(genericPayload).toMatchObject({ source: "CAN SLIM Crypto Scanner", title: "BTC threshold", occurredAt: "2026-08-12T12:00:00.000Z" });
  });

  it("фиксирует успешную доставку из ответа endpoint-а", async () => {
    const mockedFetch = vi.fn().mockResolvedValue(new Response("accepted", { status: 202 }));
    vi.stubGlobal("fetch", mockedFetch);

    const result = await WebhookIntegrationService.deliver(
      "https://hooks.example.com/notify",
      "slack",
      { type: "system_health", title: "Service healthy", message: "All systems nominal" }
    );

    expect(result).toEqual({ success: true, statusCode: 202, responseSummary: "accepted", attemptCount: 1, retried: false });
    expect(mockedFetch).toHaveBeenCalledWith(
      "https://hooks.example.com/notify",
      expect.objectContaining({ method: "POST", headers: expect.objectContaining({ "content-type": "application/json" }) })
    );
  });

  it("повторяет временную ошибку endpoint-а и возвращает успешный итоговый статус", async () => {
    const mockedFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("temporarily unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response("delivered", { status: 200 }));
    vi.stubGlobal("fetch", mockedFetch);

    const result = await WebhookIntegrationService.deliver(
      "https://hooks.example.com/notify",
      "generic",
      { type: "system_health", title: "Retry test", message: "Retry test" },
      { baseDelayMs: 0 }
    );

    expect(result).toEqual({ success: true, statusCode: 200, responseSummary: "delivered", attemptCount: 2, retried: true });
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it("не повторяет неустранимую клиентскую ошибку endpoint-а", async () => {
    const mockedFetch = vi.fn().mockResolvedValue(new Response("bad request", { status: 400 }));
    vi.stubGlobal("fetch", mockedFetch);

    const result = await WebhookIntegrationService.deliver(
      "https://hooks.example.com/notify",
      "generic",
      { type: "system_health", title: "Client error", message: "Client error" },
      { baseDelayMs: 0 }
    );

    expect(result).toMatchObject({ success: false, statusCode: 400, attemptCount: 1, retried: false });
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it("не выполняет запрос при невалидном endpoint-е", async () => {
    const mockedFetch = vi.fn();
    vi.stubGlobal("fetch", mockedFetch);

    const result = await WebhookIntegrationService.deliver(
      "https://127.0.0.1/internal",
      "generic",
      { type: "system_health", title: "Test", message: "Test" }
    );

    expect(result.success).toBe(false);
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});
