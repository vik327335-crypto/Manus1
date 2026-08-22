import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sharingSource = readFileSync(new URL("./StrategySharing.tsx", import.meta.url), "utf8");

describe("StrategySharing accuracy safeguards", () => {
  it("does not restore source-ambiguous public discovery, social proof, or copying actions", () => {
    expect(sharingSource).toContain("Public strategy sharing is unavailable until creator data is auditable");
    expect(sharingSource).toContain("No social proof, public strategy quality signal, sharing action, or copying action");
    expect(sharingSource).not.toContain("shareStrategy");
    expect(sharingSource).not.toContain("getSharedStrategies");
    expect(sharingSource).not.toContain("searchStrategies");
    expect(sharingSource).not.toContain("likeStrategy");
    expect(sharingSource).not.toContain("copyStrategy");
    expect(sharingSource).not.toContain("strategy.rating");
  });
});
