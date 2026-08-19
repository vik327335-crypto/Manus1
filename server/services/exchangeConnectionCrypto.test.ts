import { describe, expect, it } from "vitest";
import { decryptExchangeCredential, encryptExchangeCredential, fingerprintExchangeKey, maskExchangeKey } from "./exchangeConnectionCrypto";

describe("exchange connection credential display", () => {
  it("derives a stable non-secret fingerprint and masks it", () => {
    const fingerprint = fingerprintExchangeKey("example-read-only-api-key");
    expect(fingerprint).toHaveLength(16);
    expect(maskExchangeKey(fingerprint)).toBe(`••••${fingerprint.slice(-4)}`);
    expect(maskExchangeKey(fingerprint)).not.toContain("example-read-only-api-key");
  });

  it("encrypts credentials without exposing their plaintext in storage payloads", () => {
    const plaintext = "read-only-secret-material";
    const encrypted = encryptExchangeCredential(plaintext);
    expect(encrypted).not.toContain(plaintext);
    expect(decryptExchangeCredential(encrypted)).toBe(plaintext);
  });
});
