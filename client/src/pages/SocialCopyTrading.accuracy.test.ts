import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const socialCopySource = readFileSync(new URL("./SocialCopyTrading.tsx", import.meta.url), "utf8");

describe("SocialCopyTrading accuracy safeguards", () => {
  it("does not restore performance claims, allocation recommendations, or copy-management actions", () => {
    expect(socialCopySource).toContain("Social-copying data is unavailable until it is independently auditable");
    expect(socialCopySource).toContain("No social-copying metrics, allocation recommendations, subscriptions, or automated trade");
    expect(socialCopySource).not.toContain("getTopTraders");
    expect(socialCopySource).not.toContain("subscribeToCopyTrader");
    expect(socialCopySource).not.toContain("pauseSubscription");
    expect(socialCopySource).not.toContain("resumeSubscription");
    expect(socialCopySource).not.toContain("suggestedAllocation");
    expect(socialCopySource).not.toContain("expectedReturn");
    expect(socialCopySource).not.toContain("allocationPercent");
  });
});
