import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeFiIntegration() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">DeFi Research</h1>
        <p className="mt-2 text-muted-foreground">
          Research-only DeFi view. This application does not connect wallets, create transactions,
          lend, borrow, swap, or provide liquidity.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>DeFi market and yield data is unavailable until it is auditable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This screen does not display liquidity, volume, fees, pool TVL, APY, supply or borrow
            rates, swap outputs, slippage, rewards, yield opportunities, or route recommendations
            without a declared provider, chain and protocol scope, timestamp, freshness, valuation
            methodology, and risk disclosure.
          </p>
          <p>
            A future research dataset must disclose source provenance, block or query time, asset and
            pool identifiers, smart-contract and counterparty risks, price and oracle methodology,
            fees, liquidity assumptions, and data-availability limitations. It must remain separate
            from wallet control and transaction execution.
          </p>
          <p className="font-medium text-amber-700 dark:text-amber-400">
            No DeFi market value, yield estimate, routing result, allocation suggestion, or
            transaction action is inferred, simulated, recommended, or enabled from this screen.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data provenance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No declared chain, protocol, pool, provider timestamp, freshness policy, or oracle
            methodology is available for market data.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk evidence</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No verified disclosure covers smart-contract, liquidity, impermanent-loss, oracle,
            counterparty, or liquidation risks for a proposed action.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Execution boundary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Swaps, lending, borrowing, liquidity provision, transfers, and withdrawals remain
            unavailable. No wallet-control or signing flow is exposed.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
