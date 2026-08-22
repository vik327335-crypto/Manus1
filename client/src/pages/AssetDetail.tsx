import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreIndicator } from "@/components/ScoreIndicator";
import { ArrowLeft, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportButton } from "@/components/ExportButton";
import { InstitutionalSupport } from "@/components/InstitutionalSupport";
import { RelativeStrengthChart } from "@/components/RelativeStrengthChart";
import { SentimentNewsFeed as _SentimentNewsFeed } from "@/components/SentimentNewsFeed";
import RealTimeNewsFeed from "@/components/RealTimeNewsFeed";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useState } from "react";

interface _CriterionDetail {
  score: number;
  reason: string;
  status: "excellent" | "good" | "fair" | "poor";
}

const mockAssetDetails = {
  BTC: {
    id: 1,
    ticker: "BTC",
    name: "Bitcoin",
    logo: "https://cdn.coinbase.com/api/v2/assets/images/bitcoin.png",
    category: "Layer1",
    currentPrice: 6250000,
    priceChange24h: 250,
    marketCap: 1200000,
    volume24h: 35000,
    circulatingSupply: "21,000,000",
    totalSupply: "21,000,000",
    description: "The original cryptocurrency and largest by market cap. Bitcoin serves as digital gold and a store of value.",
    totalScore: 79,
    criteria: {
      c: {
        score: 72,
        reason: "Volume increased 45% over 7 days, steady adoption",
        status: "good" as const,
      },
      a: {
        score: 65,
        reason: "Consistent long-term growth, network expanding",
        status: "fair" as const,
      },
      n: {
        score: 58,
        reason: "Institutional adoption continues, some regulatory clarity",
        status: "fair" as const,
      },
      s: {
        score: 85,
        reason: "Fixed supply of 21M, deflationary through halving",
        status: "excellent" as const,
      },
      l: {
        score: 88,
        reason: "Market leader, outperforming altcoins significantly",
        status: "excellent" as const,
      },
      i: {
        score: 92,
        reason: "Massive institutional holdings, major funds invested",
        status: "excellent" as const,
      },
      m: {
        score: 95,
        reason: "Bitcoin above 200 EMA, bullish market structure",
        status: "excellent" as const,
      },
    },
  },
};

export default function AssetDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const [, navigate] = useLocation();
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [_livePriceChange, setLivePriceChange] = useState<number | null>(null);
  const { isConnected, subscribeToPrices, onPriceUpdate } = useWebSocket({
    autoConnect: true,
  });

  // Subscribe to live price updates
  useEffect(() => {
    if (isConnected && ticker) {
      subscribeToPrices([ticker]);
    }
  }, [isConnected, ticker, subscribeToPrices]);

  // Listen for price updates
  useEffect(() => {
    const unsubscribe = onPriceUpdate((data) => {
      if (data.ticker === ticker) {
        setLivePrice(data.price);
        setLivePriceChange(data.change24h);
      }
    });
    return unsubscribe;
  }, [ticker, onPriceUpdate]);

  const asset = mockAssetDetails[ticker as keyof typeof mockAssetDetails];

  if (!asset) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Asset not found</p>
          </div>
        </div>
      </div>
    );
  }

  const criteriaLabels = {
    c: { full: "Current Growth", description: "Quarterly earnings growth and revenue acceleration" },
    a: { full: "Annual Growth", description: "Year-over-year growth rates and consistency" },
    n: { full: "New Catalysts", description: "Recent news, partnerships, and protocol upgrades" },
    s: { full: "Supply Dynamics", description: "Token supply, inflation rate, and unlock schedules" },
    l: { full: "Relative Strength", description: "Performance vs BTC and ETH over 30/90 days" },
    i: { full: "Institutional Support", description: "Fund investments, validator participation, and whale activity" },
    m: { full: "Market Trend", description: "Bitcoin 200 EMA status and overall market conditions" },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800";
      case "good":
        return "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800";
      case "fair":
        return "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800";
      case "poor":
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <img
                src={asset.logo}
                alt={asset.name}
                className="h-16 w-16 rounded-full"
              />
              <div>
                <h1 className="text-3xl font-bold">{asset.ticker}</h1>
                <p className="text-muted-foreground">{asset.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{asset.category}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Price {isConnected && "(Live)"}</p>
              <p className="text-3xl font-bold">${(livePrice !== null ? livePrice / 100 : asset.currentPrice / 100).toFixed(2)}</p>
              <p
                className={cn(
                  "text-sm font-semibold mt-1",
                  asset.priceChange24h > 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {asset.priceChange24h > 0 ? "+" : ""}{(asset.priceChange24h / 100).toFixed(2)}% (24h)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Overview Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Overview</h2>
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="card-elevated p-6">
              <p className="text-sm text-muted-foreground mb-2">Market Cap</p>
              <p className="text-2xl font-bold">${(asset.marketCap / 1000).toFixed(0)}B</p>
            </Card>
            <Card className="card-elevated p-6">
              <p className="text-sm text-muted-foreground mb-2">24h Volume</p>
              <p className="text-2xl font-bold">${(asset.volume24h / 1000).toFixed(0)}B</p>
            </Card>
            <Card className="card-elevated p-6">
              <p className="text-sm text-muted-foreground mb-2">Circulating Supply</p>
              <p className="text-2xl font-bold">{asset.circulatingSupply}</p>
            </Card>
            <Card className="card-elevated p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Score</p>
              <p className="text-2xl font-bold text-blue-600">{asset.totalScore}/100</p>
            </Card>
          </div>
        </div>

        {/* CAN SLIM Breakdown */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">CAN SLIM Analysis</h2>

          <div className="grid gap-6 lg:grid-cols-2">
            {Object.entries(asset.criteria).map(([key, criterion]) => (
              <Card
                key={key}
                className={cn("card-elevated border-2 p-6", getStatusColor(criterion.status))}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {criteriaLabels[key as keyof typeof criteriaLabels].full}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {criteriaLabels[key as keyof typeof criteriaLabels].description}
                    </p>
                  </div>
                  <div className="text-right">
                    <ScoreIndicator
                      score={criterion.score}
                      label={key.toUpperCase()}
                      size="md"
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-background rounded-lg">
                  <p className="text-sm">{criterion.reason}</p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {(criterion.status === "excellent" || criterion.status === "good") && (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  )}
                  {criterion.status === "fair" && (
                    <div className="h-4 w-4 text-amber-600">→</div>
                  )}
                  <span className="text-xs font-medium capitalize text-muted-foreground">
                    {criterion.status} Signal
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Supply Dynamics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Supply Dynamics</h2>
          <Card className="card-elevated p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Circulating Supply</p>
                <p className="text-xl font-semibold">{asset.circulatingSupply}</p>
                <p className="text-xs text-muted-foreground mt-1">Currently in circulation</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Supply</p>
                <p className="text-xl font-semibold">{asset.totalSupply}</p>
                <p className="text-xs text-muted-foreground mt-1">Maximum supply cap</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Inflation Rate</p>
                <p className="text-xl font-semibold">0% (Fixed)</p>
                <p className="text-xs text-muted-foreground mt-1">No new issuance</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Relative Strength Charts */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Performance Analysis</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <RelativeStrengthChart
              data={[
                { date: "1 week ago", assetPerformance: -5, btcPerformance: -2, ethPerformance: -3 },
                { date: "5 days ago", assetPerformance: 0, btcPerformance: 2, ethPerformance: 1 },
                { date: "3 days ago", assetPerformance: 8, btcPerformance: 5, ethPerformance: 6 },
                { date: "1 day ago", assetPerformance: 12, btcPerformance: 8, ethPerformance: 10 },
                { date: "Today", assetPerformance: 15, btcPerformance: 10, ethPerformance: 12 },
              ]}
              assetName={asset.ticker}
              period="30d"
            />
            <RelativeStrengthChart
              data={[
                { date: "3 months ago", assetPerformance: -20, btcPerformance: -15, ethPerformance: -18 },
                { date: "2 months ago", assetPerformance: -10, btcPerformance: -5, ethPerformance: -8 },
                { date: "1 month ago", assetPerformance: 0, btcPerformance: 5, ethPerformance: 3 },
                { date: "2 weeks ago", assetPerformance: 10, btcPerformance: 12, ethPerformance: 11 },
                { date: "Today", assetPerformance: 35, btcPerformance: 25, ethPerformance: 28 },
              ]}
              assetName={asset.ticker}
              period="90d"
            />
          </div>
        </div>

        {/* Real-Time News Sentiment Analysis */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Real-Time News & Sentiment Analysis</h2>
          <RealTimeNewsFeed ticker={asset.ticker} name={asset.name} />
        </div>

        {/* Institutional Support */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Institutional Support</h2>
          <InstitutionalSupport
            funds={[
              {
                name: "Grayscale Bitcoin Trust",
                tier: "tier1",
                allocation: 2.5,
                entryDate: "2024-01-15",
              },
              {
                name: "Pantera Capital",
                tier: "tier1",
                allocation: 1.8,
                entryDate: "2024-02-20",
              },
              {
                name: "Polychain Capital",
                tier: "tier2",
                allocation: 0.9,
                entryDate: "2024-03-10",
              },
            ]}
            whales={[
              {
                address: "0x1234...5678",
                label: "Whale #1",
                balance: 50000000,
                change24h: 2.5,
                type: "accumulating",
              },
              {
                address: "0x9abc...def0",
                label: "Whale #2",
                balance: 35000000,
                change24h: -1.2,
                type: "holding",
              },
            ]}
            smartMoneyScore={78}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Button size="lg" className="gap-2">
            <Star className="h-4 w-4" />
            Add to Watchlist
          </Button>
          <Button variant="outline" size="lg">
            View on Chain
          </Button>
          <ExportButton
            assetData={{
              ticker: asset.ticker,
              name: asset.name,
              currentPrice: asset.currentPrice,
              marketCap: asset.marketCap,
              totalScore: asset.totalScore,
              criteria: {
                c: asset.criteria.c.score,
                a: asset.criteria.a.score,
                n: asset.criteria.n.score,
                s: asset.criteria.s.score,
                l: asset.criteria.l.score,
                i: asset.criteria.i.score,
                m: asset.criteria.m.score,
              },
              description: asset.description,
            }}
          />
        </div>
      </div>
    </div>
  );
}
