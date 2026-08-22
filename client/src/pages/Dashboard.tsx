import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import { PriceTicker } from "@/components/PriceTicker";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const balanceSummary = trpc.exchangeConnections.balances.useQuery(undefined, {
    enabled: false,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient">CAN SLIM Crypto Scanner</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Research workspace with explicit data-quality boundaries
              </p>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            )}
          </div>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/watchlist")}
              className="mt-4 gap-2"
            >
              My Watchlist
            </Button>
          )}
        </div>
      </header>

      <main className="container space-y-8 py-8">
        <section aria-labelledby="verified-ticker-heading">
          <h2 id="verified-ticker-heading" className="mb-2 text-lg font-semibold">
            Verified Price Ticker
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Prices appear only when a provider-backed quote is available. An unavailable quote is
            withheld rather than replaced with a placeholder.
          </p>
          <PriceTicker tickers={["BTC", "ETH", "ADA"]} />
        </section>

        {user && (
          <section aria-labelledby="exchange-balances-heading">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="exchange-balances-heading" className="text-lg font-semibold">
                  Connected exchange balances
                </h2>
                <p className="text-sm text-muted-foreground">
                  Read-only account data. Refreshing does not submit trades, transfers, or
                  withdrawals.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={balanceSummary.isFetching}
                onClick={() => balanceSummary.refetch()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {balanceSummary.isFetching ? "Refreshing…" : "Refresh balances"}
              </Button>
            </div>

            {balanceSummary.error ? (
              <Card className="p-4 text-sm text-destructive">
                Balances could not be retrieved. Verify that an active connection has the required
                account-read permission.
              </Card>
            ) : !balanceSummary.data ? (
              <Card className="p-4 text-sm text-muted-foreground">
                Select “Refresh balances” to retrieve current data from active read-only
                connections.
              </Card>
            ) : balanceSummary.data.connections.length ? (
              <>
                <Card className="mb-4 p-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">USD estimate of priced balances</p>
                      <p className="text-3xl font-semibold">
                        {balanceSummary.data.valuation.totalUsd.toLocaleString(undefined, {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        {balanceSummary.data.valuation.pricedBalanceCount} priced balance
                        {balanceSummary.data.valuation.pricedBalanceCount === 1 ? "" : "s"}
                      </p>
                      <p>
                        Quote time:{" "}
                        {new Date(balanceSummary.data.valuation.priceRetrievedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {balanceSummary.data.valuation.unpricedAssets.length > 0 && (
                    <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
                      Not included in USD estimate: {balanceSummary.data.valuation.unpricedAssets.join(", ")}.
                    </p>
                  )}
                </Card>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {balanceSummary.data.connections.map((connection) => (
                    <Card key={connection.id} className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          <span className="font-medium capitalize">{connection.provider}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{connection.keyMasked}</span>
                      </div>
                      {connection.status === "error" ? (
                        <p className="text-sm text-destructive">{connection.message}</p>
                      ) : connection.balances.length ? (
                        <>
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground">
                              USD estimate for priced balances
                            </p>
                            <p className="text-xl font-semibold">
                              {connection.valuedTotalUsd.toLocaleString(undefined, {
                                style: "currency",
                                currency: "USD",
                                maximumFractionDigits: 2,
                              })}
                            </p>
                            {connection.unpricedAssets.length > 0 && (
                              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                                Excluded: {connection.unpricedAssets.join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            {connection.balances.map((balance) => (
                              <div
                                key={`${balance.provider}-${balance.asset}`}
                                className="flex justify-between gap-4 text-sm"
                              >
                                <span>{balance.asset}</span>
                                <span className="text-right">
                                  <span className="block font-medium">
                                    {Number(balance.available).toLocaleString(undefined, {
                                      maximumFractionDigits: 8,
                                    })}
                                    {Number(balance.held)
                                      ? ` + ${Number(balance.held).toLocaleString(undefined, {
                                          maximumFractionDigits: 8,
                                        })} held`
                                      : ""}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {balance.usdValue === null
                                      ? "Unpriced"
                                      : balance.usdValue.toLocaleString(undefined, {
                                          style: "currency",
                                          currency: "USD",
                                          maximumFractionDigits: 2,
                                        })}
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No non-zero balances returned.</p>
                      )}
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="p-4 text-sm text-muted-foreground">
                No active read-only exchange connections are available. Add one at Exchange
                Connections.
              </Card>
            )}

            {balanceSummary.data && (
              <p className="mt-3 text-xs text-muted-foreground">
                Balances retrieved {new Date(balanceSummary.data.retrievedAt).toLocaleString()}. USD
                estimates use {balanceSummary.data.valuation.priceSource}; quote freshness is shown
                above. Unpriced assets are excluded rather than estimated. This is research-only
                account reporting, not personalized financial advice.
              </p>
            )}
          </section>
        )}

        <section aria-labelledby="market-overview-heading">
          <h2 id="market-overview-heading" className="mb-2 text-lg font-semibold">
            Market overview
          </h2>
          <Card className="p-6">
            <h3 className="text-base font-semibold">Unavailable until the market dataset is auditable</h3>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              This dashboard does not display BTC trend, dominance, Fear &amp; Greed, CAN SLIM scores,
              asset prices, 24-hour changes, market capitalisation, rankings, or market exports from
              static examples. These fields remain unavailable until a dataset declares its asset
              universe, source provenance, timestamp, freshness, scoring methodology, and export
              eligibility.
            </p>
            <p className="mt-4 text-sm text-amber-700 dark:text-amber-400">
              No market or score values are inferred, simulated, or exported from this screen.
            </p>
          </Card>
        </section>

        <section aria-labelledby="asset-research-heading">
          <h2 id="asset-research-heading" className="mb-2 text-lg font-semibold">
            Asset research queue
          </h2>
          <Card className="p-6 text-sm text-muted-foreground">
            No verified dashboard asset universe is currently available. Search, category filters,
            score sorting, asset cards, and market-data export remain disabled to avoid presenting
            synthetic values as current research results.
          </Card>
        </section>
      </main>
    </div>
  );
}
