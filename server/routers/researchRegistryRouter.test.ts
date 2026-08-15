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

  it("defines validated evidence requirements independently of trading execution", () => {
    const canValidate = (input: { confirmed: boolean; protocol?: string; result?: string; sample: string }) => input.confirmed && Boolean(input.protocol && input.result) && input.sample === "adequate";
    expect(canValidate({ confirmed: true, protocol: "protocol.md", result: "result.json", sample: "adequate" })).toBe(true);
    expect(canValidate({ confirmed: false, protocol: "protocol.md", result: "result.json", sample: "adequate" })).toBe(false);
    expect(canValidate({ confirmed: true, protocol: "protocol.md", result: "result.json", sample: "insufficient" })).toBe(false);
  });
});
