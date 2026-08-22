import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NFTPortfolio() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">NFT Portfolio Research</h1>
        <p className="mt-2 text-muted-foreground">
          Research-only portfolio view. It does not execute transactions or provide personal
          investment recommendations.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>NFT portfolio data is unavailable until holdings and valuation are auditable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This screen does not display wallet holdings, total value, gain or loss, floor value,
            diversification, item prices, collection floors, rarity, market trends, volume changes,
            or recommendations without a verified owner-scoped holdings source and valuation
            contract.
          </p>
          <p>
            A future research record must declare wallet ownership and consent, chain and collection
            scope, token identifiers, source provenance, query timestamp, freshness, pricing venue,
            valuation methodology, currency conversion policy, and data-availability limitations.
          </p>
          <p className="font-medium text-amber-700 dark:text-amber-400">
            No NFT value, performance, rarity, trend, or recommendation is inferred, simulated, or
            displayed until these evidence requirements are met.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Holdings provenance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No verified owner-scoped wallet, chain scope, token inventory, or consent record is
            available to establish holdings completeness.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Valuation methodology</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No declared pricing venue, timestamp, floor-value policy, currency conversion, or
            liquidity assumption is available for valuation.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommendation boundary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Trend and recommendation views remain unavailable and will not initiate purchases,
            sales, transfers, or withdrawals.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
