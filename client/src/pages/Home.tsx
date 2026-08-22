import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, TrendingUp, BarChart3, Zap, CircleAlert, Clock3 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

interface PriceData {
  symbol: string;
  name: string;
  price?: number;
  change24h?: number;
  volume24h?: number;
  marketCap?: number;
  fetchedAt?: number;
  cacheAgeMs?: number;
}

function PriceCard({ crypto }: { crypto: PriceData }) {
  if (crypto.price === undefined || crypto.change24h === undefined || crypto.volume24h === undefined || crypto.marketCap === undefined) {
    return <Card className="card-elevated p-4"><p className="font-semibold text-sm">{crypto.symbol}</p><p className="text-xs text-muted-foreground">{crypto.name}</p><div className="mt-6 flex items-start gap-2 text-sm text-muted-foreground"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />Verified market data is currently unavailable.</div></Card>;
  }

  const isPositive = crypto.change24h >= 0;

  return (
    <Card className="card-elevated p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-sm">{crypto.symbol}</p>
          <p className="text-xs text-muted-foreground">{crypto.name}</p>
        </div>
        <div
          className={`text-xs font-semibold px-2 py-1 rounded ${
            isPositive
              ? "badge-success"
              : "badge-error"
          }`}
        >
          {isPositive ? "↑" : "↓"} {Math.abs(crypto.change24h).toFixed(2)}%
        </div>
      </div>

      <p className="text-lg font-bold mb-3">
        ${crypto.price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">24h Volume</span>
          <span className="font-medium">${crypto.volume24h.toFixed(2)}B</span>
        </div>
        <div className="flex justify-between pt-2" style={{borderTop: "1px solid var(--border)"}}>
          <span className="text-muted-foreground">Market Cap</span>
          <span className="font-medium">${crypto.marketCap.toFixed(2)}B</span>
        </div>
        <div className="flex items-center justify-between pt-1 text-muted-foreground"><span>CoinGecko</span><span>{crypto.fetchedAt ? new Date(crypto.fetchedAt).toLocaleTimeString() : "—"}</span></div>
      </div>
    </Card>
  );
}

export default function Home() {
  const { user: _user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const marketDataQuery = trpc.coingecko.getMarketData.useQuery(
    { tickers: ["BTC", "ETH", "SOL", "ADA"] },
    { refetchInterval: 60_000, refetchOnWindowFocus: true }
  );

  const prices = useMemo<Record<string, PriceData>>(() => {
    const metadata = { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", ADA: "Cardano" };
    const quoteMap = new Map((marketDataQuery.data ?? []).map((quote) => [quote.ticker, quote]));
    return Object.fromEntries(Object.entries(metadata).map(([symbol, name]) => {
      const quote = quoteMap.get(symbol);
      return [symbol, quote ? { symbol, name, price: quote.price, change24h: quote.priceChangePercent24h, marketCap: quote.marketCap / 1e9, volume24h: quote.volume24h / 1e9, fetchedAt: quote.fetchedAt, cacheAgeMs: quote.cacheAgeMs } : { symbol, name }];
    }));
  }, [marketDataQuery.data]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Live Price Ticker */}
      <div className="border-b border-border bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="container py-16">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Left Content */}
            <div className="lg:col-span-2">
              <h1 className="text-5xl font-bold text-gradient mb-4">
                CAN SLIM Crypto Scanner
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Evaluate cryptocurrencies using William O'Neil's proven investment methodology. Discover high-potential digital assets with AI-powered analysis.
              </p>
              <div className="flex gap-4">
                {isAuthenticated ? (
                  <Button
                    size="lg"
                    onClick={() => navigate("/dashboard")}
                    className="gap-2"
                  >
                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => (window.location.href = getLoginUrl())}
                    className="gap-2"
                  >
                    Sign In to Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </div>

            {/* Right - Live Price Ticker */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Verified Price Ticker</h3>
                  <div className="flex items-center gap-2">
                    {marketDataQuery.isLoading ? <Skeleton className="h-4 w-4 rounded-full" /> : <><Clock3 className="h-4 w-4 text-green-500" /><span className="text-xs text-muted-foreground">Verified source</span></>}
                  </div>
                </div>
                {marketDataQuery.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-32 rounded-lg" />
                    ))}
                  </div>
                ) : (
                <div className="space-y-3">
                  {Object.entries(prices).map(([symbol, crypto]) => (
                    <PriceCard 
                      key={symbol} 
                      crypto={crypto}
                    />
                  ))}
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-20">
        <h2 className="text-3xl font-bold mb-12">Powerful Features</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="card-elevated p-6">
            <TrendingUp className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">CAN SLIM Scoring</h3>
            <p className="text-sm text-muted-foreground">
              Analyze 7 key investment criteria: Current Growth, Annual Growth, New Catalysts, Supply Dynamics, Relative Strength, Institutional Support, and Market Trend.
            </p>
          </Card>

          <Card className="card-elevated p-6">
            <BarChart3 className="h-8 w-8 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Real-Time Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track market trends, Bitcoin's 200-day EMA, dominance metrics, and Fear & Greed Index in real-time.
            </p>
          </Card>

          <Card className="card-elevated p-6">
            <Zap className="h-8 w-8 text-amber-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI Sentiment Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Detect new catalysts and market sentiment through AI-powered analysis of news, partnerships, and protocol updates.
            </p>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-border bg-card">
        <div className="container py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Next Opportunity?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Start analyzing cryptocurrencies with the CAN SLIM methodology today.
          </p>
          {isAuthenticated ? (
            <Button
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="gap-2"
            >
              Sign In Now <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
