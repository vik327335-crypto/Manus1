import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PortfolioRebalancing() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Portfolio Allocation Research</h1>
        <p className="mt-2 text-muted-foreground">
          Research-only allocation view. It does not provide personalized financial advice or create
          trade instructions.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Allocation and rebalancing output is unavailable until holdings are auditable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This screen does not value a portfolio, calculate allocation drift, estimate fees, or
            label any asset as buy, sell, hold, target allocation, or suggested adjustment from
            user-entered or source-ambiguous values.
          </p>
          <p>
            A future research calculation requires owner-scoped holdings proof, declared price
            provider, quote timestamp, freshness, asset universe, currency and fee assumptions,
            liquidity and exchange constraints, and an explicit methodology for any allocation
            analysis.
          </p>
          <p className="font-medium text-amber-700 dark:text-amber-400">
            No portfolio value, allocation recommendation, fee estimate, or transaction action is
            inferred, simulated, or provided from this screen.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Holdings evidence</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No verified owner-scoped holdings, account scope, or complete asset universe is
            available for portfolio analysis.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Price and cost methodology</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No declared price source, timestamp, freshness, fee schedule, liquidity condition, or
            execution constraint is available for calculation.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Advice and execution boundary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Allocation guidance, trade plans, orders, transfers, and withdrawals remain unavailable.
            This page will not initiate an action.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
