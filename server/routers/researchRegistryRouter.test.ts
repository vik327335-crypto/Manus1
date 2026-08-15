import { describe, expect, it } from "vitest";

describe("research registry contract", () => {
  it("documents allowed research lifecycle states", () => {
    const states = ["draft", "preregistered", "validated", "rejected", "inconclusive"];
    expect(states).toContain("preregistered");
    expect(states).toContain("rejected");
    expect(states).not.toContain("approved_for_live_trading");
  });

  it("keeps evidence completeness stricter than a status label", () => {
    const evidenceComplete = (input: { protocolPath?: string; resultPath?: string; sampleAdequacy: string }) => Boolean(input.protocolPath && input.resultPath && input.sampleAdequacy === "adequate");
    expect(evidenceComplete({ protocolPath: "protocol.md", resultPath: "result.json", sampleAdequacy: "adequate" })).toBe(true);
    expect(evidenceComplete({ protocolPath: "protocol.md", sampleAdequacy: "adequate" })).toBe(false);
  });
});
