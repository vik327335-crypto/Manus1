import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2, Bell, TrendingUp, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { websocketService } from "@/services/websocketService";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Watchlist</h1>
              <p className="text-muted-foreground mt-1">
                Track and monitor your favorite cryptocurrencies
              </p>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats */}
        {watchlist.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="card-elevated p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Items</p>
              <p className="text-3xl font-bold">{watchlist.length}</p>
            </Card>
            <Card className="card-elevated p-6">
              <p className="text-sm text-muted-foreground mb-2">Average Score</p>
              <p className="text-3xl font-bold text-blue-600">{avgScore}</p>
            </Card>
            <Card className="card-elevated p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Value</p>
              <p className="text-3xl font-bold">${(totalValue / 100).toFixed(2)}</p>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search watchlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Watchlist Items */}
        {filteredWatchlist.length > 0 ? (
          <div className="space-y-4">
            {filteredWatchlist.map((item) => (
              <Card key={item.id} className="card-elevated p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Asset Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={item.logo}
                      alt={item.name}
                      className="h-12 w-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{item.ticker}</h3>
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                          Score: {item.totalScore}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added {item.addedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-semibold">${(item.currentPrice / 100).toFixed(2)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">24h Change</p>
                      <p
                        className={cn(
                          "font-semibold",
                          item.priceChange24h > 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {item.priceChange24h > 0 ? "+" : ""}
                        {(item.priceChange24h / 100).toFixed(2)}%
                      </p>
                    </div>

                    {/* Alert Threshold */}
                    <div className="text-right min-w-[140px]">
                      {editingId === item.id ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={newThreshold}
                            onChange={(e) => setNewThreshold(e.target.value)}
                            placeholder="Alert price"
                            className="h-8 text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateThreshold(item.id, newThreshold)}
                            className="h-8"
                          >
                            Set
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">Alert at</p>
                          <p className="font-semibold">
                            ${(item.alertThreshold || 0).toFixed(2)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(item.id);
                              setNewThreshold(item.alertThreshold?.toString() || "");
                            }}
                            className="mt-1 h-6 text-xs"
                          >
                            Edit
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Set price alert"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleRemove(item.id)}
                        title="Remove from watchlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {watchlist.length === 0 ? (
              <>
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">Your watchlist is empty</p>
                <Button onClick={() => navigate("/dashboard")}>
                  Browse Assets
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">No assets match your search</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
