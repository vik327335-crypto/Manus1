import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const leaderboardSource = readFileSync(new URL("./CommunityLeaderboard.tsx", import.meta.url), "utf8");

describe("CommunityLeaderboard accuracy safeguards", () => {
  it("does not restore source-ambiguous community rankings or social proof", () => {
    expect(leaderboardSource).toContain("Community rankings are unavailable until participation data is auditable");
    expect(leaderboardSource).toContain("No social proof, community ranking, popularity signal, or copy-trading implication");
    expect(leaderboardSource).not.toContain("getLeaderboard");
    expect(leaderboardSource).not.toContain("getCommunityStats");
    expect(leaderboardSource).not.toContain("getTrendingCategories");
    expect(leaderboardSource).not.toContain("leaderboardQuery");
    expect(leaderboardSource).not.toContain("strategy.rating");
    expect(leaderboardSource).not.toContain("strategy.copies");
  });
});
