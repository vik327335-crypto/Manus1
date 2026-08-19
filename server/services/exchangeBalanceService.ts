import { createHash, createHmac } from "crypto";
import { generateJwt } from "@coinbase/cdp-sdk/auth";
import { decryptExchangeCredential } from "./exchangeConnectionCrypto";

export type ReadOnlyBalance = { asset: string; available: string; held: string; provider: "binance" | "coinbase" | "kraken" };
export type ReadOnlyPermissionDiagnostic = {
  provider: ReadOnlyBalance["provider"];
  verdict: "verified_read_only" | "unsafe_permissions_detected" | "manual_review_required";
  canView: boolean | null;
  canTrade: boolean | null;
  canTransferOrWithdraw: boolean | null;
  message: string;
};
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

export function diagnoseBinancePermissions(payload: { canTrade?: boolean; canWithdraw?: boolean }): ReadOnlyPermissionDiagnostic {
  const canTrade = payload.canTrade ?? null;
  const canTransferOrWithdraw = payload.canWithdraw ?? null;
  if (canTrade === true || canTransferOrWithdraw === true) {
    return { provider: "binance", verdict: "unsafe_permissions_detected", canView: true, canTrade, canTransferOrWithdraw, message: "The account response reported trading or withdrawal capability. Treat this connection as not verified read-only and confirm the API key restrictions in the Binance portal." };
  }
  return { provider: "binance", verdict: "manual_review_required", canView: true, canTrade, canTransferOrWithdraw, message: "The account-read endpoint succeeded, but it does not provide authoritative per-key scope attestation. Confirm that the API key has no trade or withdrawal scope in the Binance portal." };
}

export function diagnoseCoinbasePermissions(payload: { can_view?: boolean; can_trade?: boolean; can_transfer?: boolean }): ReadOnlyPermissionDiagnostic {
  const canView = payload.can_view ?? false;
  const canTrade = payload.can_trade ?? false;
  const canTransferOrWithdraw = payload.can_transfer ?? false;
  if (canTrade || canTransferOrWithdraw) {
    return { provider: "coinbase", verdict: "unsafe_permissions_detected", canView, canTrade, canTransferOrWithdraw, message: "Coinbase reported trade or transfer permission. Reconfigure the API key to view-only before using it here." };
  }
  if (canView) {
    return { provider: "coinbase", verdict: "verified_read_only", canView, canTrade, canTransferOrWithdraw, message: "Coinbase reported view permission with no trade or transfer permission." };
  }
  return { provider: "coinbase", verdict: "manual_review_required", canView, canTrade, canTransferOrWithdraw, message: "Coinbase did not report usable view permission. Verify the API key in the Coinbase portal." };
}

export function diagnoseKrakenPermissions(): ReadOnlyPermissionDiagnostic {
  return { provider: "kraken", verdict: "manual_review_required", canView: true, canTrade: null, canTransferOrWithdraw: null, message: "The Kraken balance endpoint succeeded with a funds-query request, but it does not return per-key permission metadata. Confirm that only Query Funds is enabled in the Kraken portal." };
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

async function getBinancePermissionDiagnostic(apiKey: string, apiSecret: string) {
  const query = new URLSearchParams({ timestamp: String(Date.now()), recvWindow: "5000", omitZeroBalances: "true" }).toString();
  const signature = createHmac("sha256", apiSecret).update(query).digest("hex");
  const payload = await readOnlyFetch(`https://api.binance.com/api/v3/account?${query}&signature=${signature}`, { headers: { "X-MBX-APIKEY": apiKey } });
  return diagnoseBinancePermissions(payload as { canTrade?: boolean; canWithdraw?: boolean });
}

async function getCoinbasePermissionDiagnostic(apiKey: string, apiSecret: string) {
  const requestPath = "/api/v3/brokerage/key_permissions";
  const token = await generateJwt({ apiKeyId: apiKey, apiKeySecret: apiSecret, requestMethod: "GET", requestHost: "api.coinbase.com", requestPath, expiresIn: 120 });
  const payload = await readOnlyFetch(`https://api.coinbase.com${requestPath}`, { headers: { Authorization: `Bearer ${token}` } });
  return diagnoseCoinbasePermissions(payload as { can_view?: boolean; can_trade?: boolean; can_transfer?: boolean });
}

async function getKrakenPermissionDiagnostic(apiKey: string, apiSecret: string) {
  await getKrakenBalances(apiKey, apiSecret);
  return diagnoseKrakenPermissions();
}

export async function retrieveReadOnlyBalances(connection: EncryptedConnection) {
  const apiKey = decryptExchangeCredential(connection.apiKeyCiphertext);
  const apiSecret = decryptExchangeCredential(connection.apiSecretCiphertext);
  if (connection.provider === "binance") return getBinanceBalances(apiKey, apiSecret);
  if (connection.provider === "coinbase") return getCoinbaseBalances(apiKey, apiSecret);
  return getKrakenBalances(apiKey, apiSecret);
}

export async function checkReadOnlyPermissions(connection: EncryptedConnection) {
  const apiKey = decryptExchangeCredential(connection.apiKeyCiphertext);
  const apiSecret = decryptExchangeCredential(connection.apiSecretCiphertext);
  if (connection.provider === "binance") return getBinancePermissionDiagnostic(apiKey, apiSecret);
  if (connection.provider === "coinbase") return getCoinbasePermissionDiagnostic(apiKey, apiSecret);
  return getKrakenPermissionDiagnostic(apiKey, apiSecret);
}
