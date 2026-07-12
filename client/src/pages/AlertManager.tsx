import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Bell, AlertCircle, TrendingUp, TrendingDown, ToggleLeft, ToggleRight } from "lucide-react";

interface Alert {
  id: string;
  type: "price_above" | "price_below" | "score_change" | "news_sentiment";
  symbol: string;
  name: string;
  threshold: number;
  currentValue: number;
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  notificationChannels: ("email" | "push" | "telegram")[];
}

// Mock alerts
const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "price_above",
    symbol: "BTC",
    name: "Bitcoin",
    threshold: 50000,
    currentValue: 45230,
    isActive: true,
    createdAt: "2026-04-01",
    notificationChannels: ["email", "push"],
  },
  {
    id: "2",
    type: "price_below",
    symbol: "ETH",
    name: "Ethereum",
    threshold: 2500,
    currentValue: 2850,
    isActive: true,
    createdAt: "2026-04-02",
    lastTriggered: "2026-04-08T14:30:00Z",
    notificationChannels: ["email"],
  },
  {
    id: "3",
    type: "score_change",
    symbol: "SOL",
    name: "Solana",
    threshold: 80,
    currentValue: 85,
    isActive: false,
    createdAt: "2026-04-03",
    notificationChannels: ["telegram"],
  },
  {
    id: "4",
    type: "news_sentiment",
    symbol: "ADA",
    name: "Cardano",
    threshold: 75,
    currentValue: 65,
    isActive: true,
    createdAt: "2026-04-04",
    notificationChannels: ["email", "push", "telegram"],
  },
];

function AlertCard({ alert, onDelete, onToggle }: { alert: Alert; onDelete: (id: string) => void; onToggle: (id: string) => void }) {
  const isTriggered = 
    (alert.type === "price_above" && alert.currentValue >= alert.threshold) ||
    (alert.type === "price_below" && alert.currentValue <= alert.threshold) ||
    (alert.type === "score_change" && alert.currentValue >= alert.threshold) ||
    (alert.type === "news_sentiment" && alert.currentValue >= alert.threshold);

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "price_above":
        return "Price Above";
      case "price_below":
        return "Price Below";
      case "score_change":
        return "Score Change";
      case "news_sentiment":
        return "News Sentiment";
      default:
        return type;
    }
  };

  const getAlertIcon = (type: string) => {
    if (type === "price_above" || type === "price_below") {
      return <TrendingUp className="h-5 w-5" />;
    }
    return <AlertCircle className="h-5 w-5" />;
  };

  return (
    <Card className={`card-elevated p-4 border-l-4 ${isTriggered ? "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20" : "border-l-blue-500"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isTriggered ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"}`}>
            {getAlertIcon(alert.type)}
          </div>
          <div>
            <p className="font-semibold">{alert.symbol}</p>
            <p className="text-xs text-muted-foreground">{getAlertTypeLabel(alert.type)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggle(alert.id)}
            className={alert.isActive ? "text-green-600" : "text-muted-foreground"}
          >
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(alert.id)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Threshold</p>
          <p className="font-semibold">{alert.threshold}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Current Value</p>
          <p className={`font-semibold ${isTriggered ? "text-orange-600" : "text-foreground"}`}>
            {alert.currentValue}
          </p>
        </div>
      </div>

      <div className="mb-3 pb-3 border-b border-border">
        <p className="text-xs text-muted-foreground mb-2">Notification Channels</p>
        <div className="flex gap-2">
          {alert.notificationChannels.map((channel) => (
            <span key={channel} className="text-xs bg-muted px-2 py-1 rounded">
              {channel.charAt(0).toUpperCase() + channel.slice(1)}
            </span>
          ))}
        </div>
      </div>

      {alert.lastTriggered && (
        <p className="text-xs text-muted-foreground">
          Last triggered: {new Date(alert.lastTriggered).toLocaleDateString()}
        </p>
      )}

      {isTriggered && (
        <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-xs text-orange-700 dark:text-orange-200">
          ⚠️ Alert condition met!
        </div>
      )}
    </Card>
  );
}

export default function AlertManager() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: "",
    type: "price_above" as const,
    threshold: "",
    channels: [] as ("email" | "push" | "telegram")[],
  });

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleToggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const handleCreateAlert = () => {
    if (!formData.symbol || !formData.threshold) {
      return;
    }

    const newAlert: Alert = {
      id: Date.now().toString(),
      type: formData.type,
      symbol: formData.symbol.toUpperCase(),
      name: formData.symbol.toUpperCase(),
      threshold: parseFloat(formData.threshold),
      currentValue: Math.random() * 100,
      isActive: true,
      createdAt: new Date().toISOString().split("T")[0],
      notificationChannels: formData.channels,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setFormData({
      symbol: "",
      type: "price_above",
      threshold: "",
      channels: [],
    });
    setShowCreateForm(false);
  };

  const toggleChannel = (channel: "email" | "push" | "telegram") => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const activeAlerts = alerts.filter((a) => a.isActive).length;
  const triggeredAlerts = alerts.filter(
    (a) =>
      (a.type === "price_above" && a.currentValue >= a.threshold) ||
      (a.type === "price_below" && a.currentValue <= a.threshold) ||
      (a.type === "score_change" && a.currentValue >= a.threshold) ||
      (a.type === "news_sentiment" && a.currentValue >= a.threshold)
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Alert Manager</h1>
        <p className="text-muted-foreground">
          Create and manage price, score, and news sentiment alerts
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Alerts</p>
          <p className="text-2xl font-bold">{alerts.length}</p>
        </Card>
        <Card className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Alerts</p>
          <p className="text-2xl font-bold text-green-600">{activeAlerts}</p>
        </Card>
        <Card className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">Triggered Alerts</p>
          <p className="text-2xl font-bold text-orange-600">{triggeredAlerts}</p>
        </Card>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card className="card-elevated p-6">
          <h2 className="text-xl font-bold mb-4">Create New Alert</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., BTC, ETH"
                  value={formData.symbol}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      symbol: e.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="type">Alert Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as any,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="price_above">Price Above</option>
                  <option value="price_below">Price Below</option>
                  <option value="score_change">Score Change</option>
                  <option value="news_sentiment">News Sentiment</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="threshold">Threshold Value</Label>
              <Input
                id="threshold"
                type="number"
                placeholder="e.g., 50000"
                value={formData.threshold}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    threshold: e.target.value,
                  }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label className="mb-3 block">Notification Channels</Label>
              <div className="flex gap-4">
                {(["email", "push", "telegram"] as const).map((channel) => (
                  <label key={channel} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.channels.includes(channel)}
                      onChange={() => toggleChannel(channel)}
                      className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm">
                      {channel.charAt(0).toUpperCase() + channel.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateAlert} className="flex-1">
                Create Alert
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Alert Button */}
      {!showCreateForm && (
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Alert
        </Button>
      )}

      {/* Alerts List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Alerts</h2>
        {alerts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDelete={handleDeleteAlert}
                onToggle={handleToggleAlert}
              />
            ))}
          </div>
        ) : (
          <Card className="card-elevated p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No alerts created yet</p>
            <Button onClick={() => setShowCreateForm(true)} variant="outline">
              Create Your First Alert
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
