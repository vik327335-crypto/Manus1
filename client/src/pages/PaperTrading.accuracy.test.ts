import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const paperTradingSource = readFileSync(new URL("./PaperTrading.tsx", import.meta.url), "utf8");

describe("PaperTrading accuracy safeguards", () => {
  it("does not present static virtual balances, trades, or performance as verified results", () => {
    expect(paperTradingSource).toContain("нет проверяемого серверного источника виртуального баланса");
    expect(paperTradingSource).toContain("Интерфейс не создаёт и не отображает synthetic virtual positions");
    expect(paperTradingSource).not.toContain("mockAccounts");
    expect(paperTradingSource).not.toContain("mockTrades");
    expect(paperTradingSource).not.toContain("currentBalance");
    expect(paperTradingSource).not.toContain("totalProfit");
  });
});
