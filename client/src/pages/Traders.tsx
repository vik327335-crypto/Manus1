import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Traders() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Social Trading Research</h1>
        <p className="mt-2 text-muted-foreground">
          Trader discovery is research-only. This application does not execute copied trades or
          provide personal trading advice.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Trader performance data is unavailable until it is auditable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This screen does not display win rates, returns, drawdowns, trade counts, followers,
            copied-trade totals, ratings, verified badges, or trader profiles from static examples.
            It also does not expose Follow or Copy Trades actions.
          </p>
          <p>
            A future research dataset must declare the trader identity and consent basis, reporting
            methodology, complete trade universe, source provenance, timestamp, freshness, and
            independently reviewable performance assumptions before any such information can be
            shown.
          </p>
          <p className="font-medium text-amber-700 dark:text-amber-400">
            No trader-performance values are inferred, simulated, ranked, or used for copy-trading
            from this screen.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile provenance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No verified trader identity, profile source, or consent record is currently available.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance methodology</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No complete, timestamped, independently reviewable trade history is available for
            calculating performance metrics.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Copying status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Copy-trading and follow actions remain unavailable. The project supports no trade
            execution from this research page.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
