import { createHash, createHmac } from "crypto";
import { generateJwt } from "@coinbase/cdp-sdk/auth";
import { decryptExchangeCredential } from "./exchangeConnectionCrypto";

export type ReadOnlyBalance = { asset: string; available: string; held: string; provider: "binance" | "coinbase" | "kraken" };
type Provider = ReadOnlyBalance["provider"];
type EncryptedConnection = { provider: Provider; apiKeyCiphertext: string; apiSecretCiphertext: string; apiPassphraseCiphertext: string | null };

async function readOnlyFetch(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`Provider balance request failed with HTTP ${response.status}`);
    return response.json() as Promise<unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

export function parseBinanceBalances(payload: { balances?: Array<{ asset?: string; free?: string; locked?: string }> }) {
  return (payload.balances ?? []).filter((balance) => Number(balance.free ?? 0) !== 0 || Number(balance.locked ?? 0) !== 0).map((balance) => ({ asset: balance.asset ?? "UNKNOWN", available: balance.free ?? "0", held: balance.locked ?? "0", provider: "binance" as const }));
}

export function parseCoinbaseBalances(payload: { accounts?: Array<{ currency?: string; available_balance?: { value?: string }; hold?: { value?: string } }> }) {
  return (payload.accounts ?? []).filter((balance) => Number(balance.available_balance?.value ?? 0) !== 0 || Number(balance.hold?.value ?? 0) !== 0).map((balance) => ({ asset: balance.currency ?? "UNKNOWN", available: balance.available_balance?.value ?? "0", held: balance.hold?.value ?? "0", provider: "coinbase" as const }));
}

export function parseKrakenBalances(payload: { result?: Record<string, string> }) {
  return Object.entries(payload.result ?? {}).filter(([, amount]) => Number(amount) !== 0).map(([asset, amount]) => ({ asset, available: amount, held: "0", provider: "kraken" as const }));
}

async function getBinanceBalances(apiKey: string, apiSecret: string) {
  const query = new URLSearchParams({ timestamp: String(Date.now()), recvWindow: "5000" }).toString();
  const signature = createHmac("sha256", apiSecret).update(query).digest("hex");
  const payload = await readOnlyFetch(`https://api.binance.com/api/v3/account?${query}&signature=${signature}`, { headers: { "X-MBX-APIKEY": apiKey } });
  return parseBinanceBalances(payload as { balances?: Array<{ asset?: string; free?: string; locked?: string }> });
}

async function getCoinbaseBalances(apiKey: string, apiSecret: string) {
  const requestPath = "/api/v3/brokerage/accounts";
  const token = await generateJwt({ apiKeyId: apiKey, apiKeySecret: apiSecret, requestMethod: "GET", requestHost: "api.coinbase.com", requestPath, expiresIn: 120 });
  const payload = await readOnlyFetch(`https://api.coinbase.com${requestPath}`, { headers: { Authorization: `Bearer ${token}` } });
  return parseCoinbaseBalances(payload as { accounts?: Array<{ currency?: string; available_balance?: { value?: string }; hold?: { value?: string } }> });
}

async function getKrakenBalances(apiKey: string, apiSecret: string) {
  const path = "/0/private/Balance";
  const nonce = String(Date.now() * 1000);
  const body = new URLSearchParams({ nonce }).toString();
  const message = Buffer.concat([Buffer.from(path), createHash("sha256").update(`${nonce}${body}`).digest()]);
  const signature = createHmac("sha512", Buffer.from(apiSecret, "base64")).update(message).digest("base64");
  const payload = await readOnlyFetch(`https://api.kraken.com${path}`, { method: "POST", headers: { "API-Key": apiKey, "API-Sign": signature, "Content-Type": "application/x-www-form-urlencoded" }, body });
  const response = payload as { error?: string[]; result?: Record<string, string> };
  if (response.error?.length) throw new Error("Kraken rejected the read-only balance request");
  return parseKrakenBalances(response);
}

export async function retrieveReadOnlyBalances(connection: EncryptedConnection) {
  const apiKey = decryptExchangeCredential(connection.apiKeyCiphertext);
  const apiSecret = decryptExchangeCredential(connection.apiSecretCiphertext);
  if (connection.provider === "binance") return getBinanceBalances(apiKey, apiSecret);
  if (connection.provider === "coinbase") return getCoinbaseBalances(apiKey, apiSecret);
  return getKrakenBalances(apiKey, apiSecret);
}
