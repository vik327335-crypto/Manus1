import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, TrendingUp, BarChart3, Zap, Wifi, WifiOff } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useState, useEffect, useCallback } from "react";

// Mock live price data - в реальном приложении будет из API
const mockPrices = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 45230,
    change24h: 2.50,
    high24h: 46100,
    low24h: 44500,
    volume24h: 28.50,
    marketCap: 890.00,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: 2850,
    change24h: -1.20,
    high24h: 2950,
    low24h: 2800,
    volume24h: 15.20,
    marketCap: 342.00,
  },
  {
    symbol: "SOL",
    name: "Solana",
    price: 145.50,
    change24h: 5.75,
    high24h: 150.00,
    low24h: 138.00,
    volume24h: 2.10,
    marketCap: 68.50,
  },
  {
    symbol: "ADA",
    name: "Cardano",
    price: 0.98,
    change24h: 1.30,
    high24h: 1.02,
    low24h: 0.95,
    volume24h: 0.85,
    marketCap: 35.20,
  },
];

interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
}

function PriceCard({ crypto, isUpdating }: { crypto: PriceData; isUpdating?: boolean }) {
  const isPositive = crypto.change24h >= 0;

  return (
    <Card className={`card-elevated p-4 hover:shadow-md transition-all ${
      isUpdating ? "ring-2 ring-blue-500" : ""
    }`}>
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

      <p className="text-lg font-bold mb-3 transition-colors">
        ${crypto.price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">High 24h</span>
          <span className="font-medium">
            ${crypto.high24h.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Low 24h</span>
          <span className="font-medium">
            ${crypto.low24h.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">24h Volume</span>
          <span className="font-medium">${crypto.volume24h.toFixed(2)}B</span>
        </div>
        <div className="flex justify-between pt-2" style={{borderTop: "1px solid var(--border)"}}>
          <span className="text-muted-foreground">Market Cap</span>
          <span className="font-medium">${crypto.marketCap.toFixed(2)}B</span>
        </div>
      </div>
    </Card>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { isConnected, onPriceUpdate, subscribeToPrices } = useWebSocket({ autoConnect: true });
  const [prices, setPrices] = useState<Record<string, PriceData>>({
    BTC: mockPrices[0],
    ETH: mockPrices[1],
    SOL: mockPrices[2],
    ADA: mockPrices[3],
  });
  const [updatingSymbol, setUpdatingSymbol] = useState<string | null>(null);

  // Subscribe to price updates when connected
  useEffect(() => {
    if (isConnected) {
      subscribeToPrices(Object.keys(prices));
      console.log("[Home] Subscribed to price updates");
    }
  }, [isConnected, subscribeToPrices, prices]);

  // Listen to price updates from WebSocket
  useEffect(() => {
    const unsubscribe = onPriceUpdate((data) => {
      console.log("[Home] Price update received:", data);
      const { ticker, price, change } = data;
      
      if (ticker && prices[ticker]) {
        setUpdatingSymbol(ticker);
        setPrices((prev) => ({
          ...prev,
          [ticker]: {
            ...prev[ticker],
            price: price || prev[ticker].price,
            change24h: change !== undefined ? change : prev[ticker].change24h,
          },
        }));
        
        setTimeout(() => setUpdatingSymbol(null), 500);
      }
    });

    return () => unsubscribe?.();
  }, [onPriceUpdate, prices]);

  // Fallback: simulate price updates if WebSocket is not connected
  useEffect(() => {
    if (isConnected) return; // Don't simulate if connected

    const interval = setInterval(() => {
      setPrices((prev) => {
        const updated = { ...prev };
        const symbols = Object.keys(updated);
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        const crypto = updated[randomSymbol];
        
        // Simulate price change
        const priceChange = (Math.random() - 0.5) * 100;
        const newPrice = Math.max(crypto.price + priceChange, 1);
        const changePercent = ((newPrice - crypto.price) / crypto.price) * 100;
        
        updated[randomSymbol] = {
          ...crypto,
          price: newPrice,
          change24h: crypto.change24h + changePercent,
          high24h: Math.max(crypto.high24h, newPrice),
          low24h: Math.min(crypto.low24h, newPrice),
        };
        
        setUpdatingSymbol(randomSymbol);
        setTimeout(() => setUpdatingSymbol(null), 500);
        
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected]);

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
                  <h3 className="text-lg font-bold">Live Price Ticker</h3>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <Wifi className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-4 w-4 text-red-500" />
                        <span className="text-xs text-red-600 dark:text-red-400">Offline</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.entries(prices).map(([symbol, crypto]) => (
                    <PriceCard 
                      key={symbol} 
                      crypto={crypto}
                      isUpdating={updatingSymbol === symbol}
                    />
                  ))}
                </div>
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
