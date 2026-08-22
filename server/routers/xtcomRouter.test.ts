import { describe, it, expect, vi, beforeEach } from "vitest";
import { createXTComService } from "../services/xtcom";

vi.mock("../services/xtcom", () => ({
  createXTComService: vi.fn(),
}));

import { xtcomRouter } from "./xtcomRouter";

describe("xtcomRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createXTComService).mockReturnValue({
      getBalances: vi.fn().mockResolvedValue([{ asset: "USDT", free: 1_000, locked: 0, total: 1_000 }]),
    } as any);
  });

  describe("addCredentials", () => {
    it("должен добавить API ключи и вернуть успех", async () => {
      const result = await xtcomRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any).addCredentials({
        apiKey: "test_key",
        apiSecret: "test_secret",
        accountName: "Test Account",
      });

      expect(result.success).toBe(true);
      expect(result.accountName).toBe("Test Account");
    });

    it("должен выбросить ошибку при пустых ключах", async () => {
      await expect(async () => {
        await xtcomRouter.createCaller({
          user: { id: 1, role: "user" },
        } as any).addCredentials({
          apiKey: "",
          apiSecret: "test_secret",
          accountName: "Test Account",
        });
      }).rejects.toThrow();
    });
  });

  describe("getCredentials", () => {
    it("должен вернуть список сохранённых ключей", async () => {
      const result = await xtcomRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any).getCredentials();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("accountName");
      expect(result[0]).toHaveProperty("isConnected");
    });
  });

  describe("getBalances", () => {
    it("должен вернуть список балансов", async () => {
      const result = await xtcomRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any).getBalances({
        credentialId: "1",
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("asset");
      expect(result[0]).toHaveProperty("free");
      expect(result[0]).toHaveProperty("total");
    });
  });

  describe("getPositions", () => {
    it("должен вернуть список открытых позиций", async () => {
      const result = await xtcomRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any).getPositions({
        credentialId: "1",
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("symbol");
      expect(result[0]).toHaveProperty("quantity");
      expect(result[0]).toHaveProperty("pnl");
    });
  });

  describe("getTrades", () => {
    it("должен вернуть историю сделок", async () => {
      const result = await xtcomRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any).getTrades({
        credentialId: "1",
        limit: 100,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("symbol");
      expect(result[0]).toHaveProperty("side");
    });

    it("должен фильтровать по символу", async () => {
      const result = await xtcomRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any).getTrades({
        credentialId: "1",
        symbol: "BTC/USDT",
        limit: 50,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("importPositions", () => {
    it("должен импортировать позиции", async () => {
      const result = await xtcomRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any).importPositions({
        credentialId: "1",
      });

      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThan(0);
    });
  });

  describe("syncPortfolio", () => {
    it("должен синхронизировать портфель", async () => {
      const result = await xtcomRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any).syncPortfolio({
        credentialId: "1",
      });

      expect(result.success).toBe(true);
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe("placeOrder", () => {
    it("должен разместить ордер на покупку", async () => {
      const result = await xtcomRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any).placeOrder({
        credentialId: "1",
        symbol: "BTC/USDT",
        side: "BUY",
        quantity: 0.1,
        price: 48000,
      });

      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
      expect(result.status).toBe("PENDING");
    });

    it("должен разместить рыночный ордер", async () => {
      const result = await xtcomRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any).placeOrder({
        credentialId: "1",
        symbol: "ETH/USDT",
        side: "SELL",
        quantity: 1,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("cancelOrder", () => {
    it("должен отменить ордер", async () => {
      const result = await xtcomRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any).cancelOrder({
        credentialId: "1",
        symbol: "BTC/USDT",
        orderId: "XT_123456",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("getOrderStatus", () => {
    it("должен вернуть статус ордера", async () => {
      const result = await xtcomRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any).getOrderStatus({
        credentialId: "1",
        symbol: "BTC/USDT",
        orderId: "XT_123456",
      });

      expect(result).toHaveProperty("orderId");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("filledQuantity");
    });
  });

  describe("getPrice", () => {
    it("должен вернуть текущую цену актива", async () => {
      const result = await xtcomRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any).getPrice({
        symbol: "BTC/USDT",
      });

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });
  });
});
