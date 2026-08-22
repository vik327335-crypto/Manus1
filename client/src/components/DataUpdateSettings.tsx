import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { dataUpdateService, UpdateNotification } from '@/lib/dataUpdateService';
import { toast } from 'sonner';

export function DataUpdateSettings() {
  const [enabled, setEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [tickers, setTickers] = useState<string[]>(['BTC', 'ETH']);
  const [newTicker, setNewTicker] = useState('');
  const [stats, setStats] = useState<ReturnType<typeof dataUpdateService.getStats> | null>(null);
  const [history, setHistory] = useState<UpdateNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial state
  useEffect(() => {
    const config = dataUpdateService.getConfig();
    setEnabled(config.enabled);
    setIntervalMinutes(config.intervalMinutes);
    setTickers(config.tickers);
    updateStats();

    // Subscribe to updates
    const unsubscribe = dataUpdateService.onUpdate((notification) => {
      setHistory(prev => [notification, ...prev].slice(0, 20));
      updateStats();
      toast[notification.status === 'success' ? 'success' : 'error'](notification.message);
    });

    return unsubscribe;
  }, []);

  const updateStats = () => {
    setStats(dataUpdateService.getStats());
    setHistory(dataUpdateService.getHistory(20));
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (checked) {
      dataUpdateService.start();
      toast.success('Automatic updates enabled');
    } else {
      dataUpdateService.stop();
      toast.info('Automatic updates disabled');
    }
    updateStats();
  };

  const handleIntervalChange = (value: string) => {
    const minutes = parseInt(value) || 60;
    setIntervalMinutes(minutes);
    dataUpdateService.setConfig({ intervalMinutes: minutes });
    toast.success('Update interval changed');
  };

  const handleAddTicker = () => {
    if (!newTicker.trim()) {
      toast.error('Please enter a ticker');
      return;
    }

    const ticker = newTicker.toUpperCase();
    if (tickers.includes(ticker)) {
      toast.error('Ticker already added');
      return;
    }

    dataUpdateService.addTicker(ticker);
    setTickers([...tickers, ticker]);
    setNewTicker('');
    toast.success(`Added ${ticker}`);
  };

  const handleRemoveTicker = (ticker: string) => {
    dataUpdateService.removeTicker(ticker);
    setTickers(tickers.filter(t => t !== ticker));
    toast.success(`Removed ${ticker}`);
  };

  const handleForceUpdate = async () => {
    setIsLoading(true);
    try {
      await dataUpdateService.forceUpdate();
      updateStats();
      toast.success('Update completed');
    } catch (_error) {
      toast.error('Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    dataUpdateService.clearHistory();
    setHistory([]);
    toast.success('History cleared');
  };

  if (!stats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Data Updates</CardTitle>
          <CardDescription>Configure background data refresh for your watched tickers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable-updates">Enable Automatic Updates</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically refresh data for selected tickers
              </p>
            </div>
            <Switch
              id="enable-updates"
              checked={enabled}
              onCheckedChange={handleToggle}
            />
          </div>

          {/* Update Interval */}
          <div>
            <Label htmlFor="interval">Update Interval (minutes)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="interval"
                type="number"
                min="5"
                max="1440"
                value={intervalMinutes}
                onChange={(e) => handleIntervalChange(e.target.value)}
                disabled={!enabled}
              />
              <span className="text-sm text-muted-foreground py-2">
                {intervalMinutes >= 60
                  ? `${Math.floor(intervalMinutes / 60)}h ${intervalMinutes % 60}m`
                  : `${intervalMinutes}m`}
              </span>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant={stats.enabled ? 'default' : 'secondary'}>
                  {stats.enabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Updates</p>
                <p className="text-lg font-bold">{stats.totalUpdates}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Success</p>
                <p className="text-lg font-bold text-green-600">{stats.successCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Errors</p>
                <p className="text-lg font-bold text-red-600">{stats.errorCount}</p>
              </div>
            </div>
          )}

          {/* Next Update */}
          {stats.nextUpdate && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium">Next Update</p>
                <p className="text-xs text-muted-foreground">
                  {stats.nextUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticker Management */}
      <Card>
        <CardHeader>
          <CardTitle>Watched Tickers</CardTitle>
          <CardDescription>Select which tickers to update automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Ticker */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter ticker (e.g., BTC, ETH)"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddTicker();
                }
              }}
            />
            <Button onClick={handleAddTicker} disabled={!enabled}>
              Add
            </Button>
          </div>

          {/* Ticker List */}
          <div className="flex flex-wrap gap-2">
            {tickers.map((ticker) => (
              <Badge key={ticker} variant="outline" className="px-3 py-2">
                {ticker}
                <button
                  onClick={() => handleRemoveTicker(ticker)}
                  className="ml-2 hover:text-red-600"
                  title="Remove ticker"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>

          {tickers.length === 0 && (
            <p className="text-sm text-muted-foreground">No tickers added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            onClick={handleForceUpdate}
            disabled={isLoading || !enabled}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Force Update Now
          </Button>
          <Button
            onClick={handleClearHistory}
            variant="outline"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </Button>
        </CardContent>
      </Card>

      {/* Update History */}
      <Card>
        <CardHeader>
          <CardTitle>Update History</CardTitle>
          <CardDescription>Recent update notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.length > 0 ? (
              history.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    notification.status === 'success'
                      ? 'bg-green-50 dark:bg-green-950'
                      : 'bg-red-50 dark:bg-red-950'
                  }`}
                >
                  {notification.status === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notification.ticker}</p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No updates yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
