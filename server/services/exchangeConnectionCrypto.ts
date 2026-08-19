import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { ENV } from "../_core/env";

function encryptionKey() {
  if (!ENV.cookieSecret) throw new Error("Managed server secret is unavailable for exchange credential encryption");
  return createHash("sha256").update(`exchange-connection:${ENV.cookieSecret}`).digest();
}

export function encryptExchangeCredential(value: string) {
  if (!value.trim()) throw new Error("Exchange credential cannot be empty");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptExchangeCredential(payload: string) {
  const [ivValue, tagValue, ciphertextValue] = payload.split(".");
  if (!ivValue || !tagValue || !ciphertextValue) throw new Error("Invalid encrypted exchange credential");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString("utf8");
}

export function fingerprintExchangeKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
}

export function maskExchangeKey(fingerprint: string) {
  return `••••${fingerprint.slice(-4)}`;
}
