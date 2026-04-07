import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2, Bell, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { websocketService } from "@/services/websocketService";
import { toast } from "sonner";
import { WatchlistAlerts } from "@/components/WatchlistAlerts";

interface WatchlistItem {
  id: number;
  ticker: string;
  name: string;
  logo: string;
  currentPrice: number;
  priceChange24h: number;
  totalScore: number;
  alertThreshold?: number;
  addedAt: Date;
}

const mockWatchlist: WatchlistItem[] = [
  {
    id: 1,
    ticker: "SOL",
    name: "Solana",
    logo: "https://cdn.coinbase.com/api/v2/assets/images/solana.png",
    currentPrice: 15000,
    priceChange24h: 450,
    totalScore: 86,
    alertThreshold: 14500,
    addedAt: new Date("2026-03-25"),
  },
  {
    id: 6,
    ticker: "AI",
    name: "Artificial Intelligence",
    logo: "https://cdn.coinbase.com/api/v2/assets/images/ai.png",
    currentPrice: 850,
    priceChange24h: 680,
    totalScore: 87,
    alertThreshold: 800,
    addedAt: new Date("2026-03-26"),
  },
  {
    id: 4,
    ticker: "ARB",
    name: "Arbitrum",
    logo: "https://cdn.coinbase.com/api/v2/assets/images/arbitrum.png",
    currentPrice: 1200,
    priceChange24h: 520,
    totalScore: 82,
    addedAt: new Date("2026-03-27"),
  },
];

export default function Watchlist() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(mockWatchlist);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newThreshold, setNewThreshold] = useState<string>("");
  const [wsConnected, setWsConnected] = useState(false);
  const [alerts, setAlerts] = useState<Map<string, any>>(new Map());

  // Initialize WebSocket connection
  useEffect(() => {
    websocketService.connect().catch(console.error);

    // Listen for connection changes
    const unsubscribeConnection = websocketService.onConnectionChange((connected) => {
      setWsConnected(connected);
      if (connected) {
        console.log('[Watchlist] WebSocket connected');
        // Subscribe to alerts for all watchlist items
        watchlist.forEach((item) => {
          websocketService.subscribeToAlerts(`watchlist-${item.id}`);
          websocketService.subscribeToPriceUpdates(item.ticker);
        });
      }
    });

    // Listen for price updates
    const unsubscribePriceUpdate = websocketService.on('price_update', (message: any) => {
      if (message.ticker) {
        setWatchlist((prev) =>
          prev.map((item) =>
            item.ticker === message.ticker
              ? {
                  ...item,
                  currentPrice: message.price || item.currentPrice,
                  priceChange24h: message.change || item.priceChange24h,
                }
              : item
          )
        );
      }
    });

    // Listen for alerts
    const unsubscribeAlert = websocketService.on('alert', (message: any) => {
      const watchlistItem = watchlist.find((item) => item.ticker === message.ticker);
      if (watchlistItem) {
        setAlerts((prev) => new Map(prev).set(message.ticker, message));
        toast.error(`⚠️ Alert: ${watchlistItem.name} (${message.ticker})`, {
          description: message.message || `Price: ${message.price}`,
          duration: 5000,
        });
      }
    });

    // Listen for notifications
    const unsubscribeNotification = websocketService.on('notification', (message: any) => {
      toast.info(message.message || 'Notification', {
        duration: 4000,
      });
    });

    return () => {
      unsubscribeConnection();
      unsubscribePriceUpdate();
      unsubscribeAlert();
      unsubscribeNotification();
    };
  }, [watchlist]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please sign in to view your watchlist</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredWatchlist = watchlist.filter(
    (item) =>
      item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemove = (id: number) => {
    setWatchlist(watchlist.filter((item) => item.id !== id));
  };

  const handleUpdateThreshold = (id: number, threshold: string) => {
    if (threshold) {
      setWatchlist(
        watchlist.map((item) =>
          item.id === id
            ? { ...item, alertThreshold: parseFloat(threshold) }
            : item
        )
      );
      setEditingId(null);
      setNewThreshold("");
    }
  };

  const totalValue = watchlist.reduce((sum, item) => sum + item.currentPrice, 0);
  const avgScore = (watchlist.reduce((sum, item) => sum + item.totalScore, 0) / watchlist.length).toFixed(1);

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-border bg-white dark:bg-card">
        <div className="container px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")} 
            className="mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">My Watchlist</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Track and monitor your favorite cryptocurrencies
              </p>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container px-4 py-10">
        {/* Stats */}
        {watchlist.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3 mb-10">
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-xl">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Items</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{watchlist.length}</p>
            </Card>
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-xl">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Average Score</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{avgScore}</p>
            </Card>
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-xl">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Value</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">${(totalValue / 100).toFixed(2)}</p>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="mb-8">
          <Input
            placeholder="Search by ticker or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-base"
          />
        </div>

        {/* Watchlist Items */}
        {filteredWatchlist.length > 0 ? (
          <div className="space-y-5">
            {filteredWatchlist.map((item) => (
              <Card 
                key={item.id} 
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-6">
                  {/* Top Row - Asset Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={item.logo}
                      alt={item.name}
                      className="h-14 w-14 rounded-full border border-slate-200 dark:border-slate-700"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{item.ticker}</h3>
                        <span className="text-xs font-semibold text-white bg-blue-600 px-3 py-1 rounded-full">
                          Score: {item.totalScore}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Added {item.addedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Middle Row - Price Info */}
                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Current Price</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">${(item.currentPrice / 100).toFixed(2)}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">24h Change</p>
                      <div className="flex items-center gap-1">
                        {item.priceChange24h > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <p
                          className={cn(
                            "text-lg font-bold",
                            item.priceChange24h > 0 ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {item.priceChange24h > 0 ? "+" : ""}
                          {(item.priceChange24h / 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Alert Price</p>
                      {editingId === item.id ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={newThreshold}
                            onChange={(e) => setNewThreshold(e.target.value)}
                            placeholder="Price"
                            className="h-8 text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateThreshold(item.id, newThreshold)}
                            className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
                          >
                            Set
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            ${(item.alertThreshold || 0).toFixed(2)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(item.id);
                              setNewThreshold(item.alertThreshold?.toString() || "");
                            }}
                            className="mt-1 h-6 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row - Actions */}
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      title="Set price alert"
                    >
                      <Bell className="h-4 w-4" />
                      Alert
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => handleRemove(item.id)}
                      title="Remove from watchlist"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Alerts Section */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <WatchlistAlerts assetId={item.id} assetName={item.name} />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            {watchlist.length === 0 ? (
              <>
                <TrendingUp className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">Your watchlist is empty</p>
                <Button 
                  onClick={() => navigate("/dashboard")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Browse Assets
                </Button>
              </>
            ) : (
              <p className="text-slate-600 dark:text-slate-400">No assets match your search</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
