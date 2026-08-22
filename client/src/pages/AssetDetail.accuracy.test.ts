import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./AssetDetail.tsx", import.meta.url), "utf8");

describe("AssetDetail accuracy disclosure", () => {
  it("labels the static asset view as a research preview and blocks its export", () => {
    expect(source).toContain("static research preview");
    expect(source).toContain("Verified current quote");
    expect(source).toContain("Export unavailable for static research preview");
    expect(source).not.toContain("Current Price {isConnected");
  });
});
