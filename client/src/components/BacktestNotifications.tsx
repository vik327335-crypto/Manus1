import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Clock, TrendingUp as _TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BacktestNotification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  timestamp: Date;
  backtestId?: string;
  metrics?: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
  };
}

export function BacktestNotifications() {
  const [notifications, setNotifications] = useState<BacktestNotification[]>([]);

  useEffect(() => {
    // Listen for WebSocket messages about backtest completion
    const handleBacktestComplete = (event: CustomEvent) => {
      const { backtestId, metrics, status } = event.detail;

      const notification: BacktestNotification = {
        id: `backtest-${backtestId}-${Date.now()}`,
        type: status === "success" ? "success" : "error",
        title: status === "success" ? "Backtest Completed" : "Backtest Failed",
        message:
          status === "success"
            ? `Backtest ${backtestId} completed successfully`
            : `Backtest ${backtestId} failed`,
        timestamp: new Date(),
        backtestId,
        metrics: status === "success" ? metrics : undefined,
      };

      setNotifications((prev) => [notification, ...prev].slice(0, 5));

      // Auto-remove after 10 seconds
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );
      }, 10000);
    };

    window.addEventListener(
      "backtest:complete",
      handleBacktestComplete as EventListener
    );

    return () => {
      window.removeEventListener(
        "backtest:complete",
        handleBacktestComplete as EventListener
      );
    };
  }, []);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-2 max-w-md z-50">
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          className={`${
            notification.type === "success"
              ? "border-green-200 bg-green-50"
              : notification.type === "error"
              ? "border-red-200 bg-red-50"
              : "border-blue-200 bg-blue-50"
          }`}
        >
          <div className="flex gap-3">
            {notification.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            ) : notification.type === "error" ? (
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            ) : (
              <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
            )}
            <div className="flex-1">
              <AlertTitle
                className={`${
                  notification.type === "success"
                    ? "text-green-900"
                    : notification.type === "error"
                    ? "text-red-900"
                    : "text-blue-900"
                }`}
              >
                {notification.title}
              </AlertTitle>
              <AlertDescription
                className={`${
                  notification.type === "success"
                    ? "text-green-700"
                    : notification.type === "error"
                    ? "text-red-700"
                    : "text-blue-700"
                }`}
              >
                {notification.message}
                {notification.metrics && (
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Return:</span>
                      <span className="font-semibold">
                        {notification.metrics.totalReturn.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sharpe Ratio:</span>
                      <span className="font-semibold">
                        {notification.metrics.sharpeRatio.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Win Rate:</span>
                      <span className="font-semibold">
                        {notification.metrics.winRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}
