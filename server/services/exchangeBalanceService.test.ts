import { describe, expect, it } from "vitest";
import { parseBinanceBalances, parseCoinbaseBalances, parseKrakenBalances } from "./exchangeBalanceService";

describe("read-only exchange balance parsers", () => {
  it("keeps non-zero Binance free and locked balances only", () => {
    expect(parseBinanceBalances({ balances: [{ asset: "BTC", free: "1.2", locked: "0" }, { asset: "ZERO", free: "0", locked: "0" }, { asset: "ETH", free: "0", locked: "0.1" }] })).toEqual([{ asset: "BTC", available: "1.2", held: "0", provider: "binance" }, { asset: "ETH", available: "0", held: "0.1", provider: "binance" }]);
  });
  it("keeps non-zero Coinbase and Kraken balances only", () => {
    expect(parseCoinbaseBalances({ accounts: [{ currency: "USD", available_balance: { value: "20" }, hold: { value: "1" } }, { currency: "EMPTY", available_balance: { value: "0" }, hold: { value: "0" } }] })).toEqual([{ asset: "USD", available: "20", held: "1", provider: "coinbase" }]);
    expect(parseKrakenBalances({ result: { XXBT: "0.5", ZUSD: "0" } })).toEqual([{ asset: "XXBT", available: "0.5", held: "0", provider: "kraken" }]);
  });
});
