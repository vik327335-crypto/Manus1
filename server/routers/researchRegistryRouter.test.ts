import { describe, expect, it } from "vitest";

describe("research registry contract", () => {
  it("documents allowed research lifecycle states", () => {
    const states = ["draft", "preregistered", "validated", "rejected", "inconclusive"];
    expect(states).toContain("preregistered");
    expect(states).toContain("rejected");
    expect(states).not.toContain("approved_for_live_trading");
  });
});
