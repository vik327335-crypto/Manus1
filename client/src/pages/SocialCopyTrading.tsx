import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SocialCopyTrading() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Social Copy Trading Research</h1>
        <p className="mt-2 text-muted-foreground">
          This research-only area does not execute, subscribe to, pause, resume, or copy trades.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Social-copying data is unavailable until it is independently auditable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This screen does not show trader profiles, win rates, returns, followers, risk scores,
            subscription performance, copied-trade profit or loss, ROI, suggested allocations, or
            expected returns without a verified dataset.
          </p>
          <p>
            Any future research record must declare trader identity and consent, complete trade
            universe, reporting methodology, source provenance, timestamp, freshness, fees,
            slippage, and independently reviewable performance assumptions. It must also remain
            separate from order execution.
          </p>
          <p className="font-medium text-amber-700 dark:text-amber-400">
            No social-copying metrics, allocation recommendations, subscriptions, or automated trade
            actions are inferred, simulated, or enabled from this screen.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trader evidence</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No consent-backed trader identity or complete, timestamped trade universe is currently
            available for research review.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance evidence</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No auditable methodology, fees, slippage, valuation policy, or freshness metadata is
            available to calculate performance or risk measures.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Execution boundary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Research records, if added later, will not create orders, transfers, withdrawals, or
            copy-trading subscriptions.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
