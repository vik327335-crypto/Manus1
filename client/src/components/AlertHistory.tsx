import { AlertHistory as AlertHistoryType } from "@shared/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Mail, Bell, Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AlertHistoryProps {
  history: AlertHistoryType[];
  isLoading?: boolean;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  price_above: "Price Above",
  price_below: "Price Below",
  price_change_percent: "Price Change %",
  score_above: "Score Above",
  score_below: "Score Below",
  volume_surge: "Volume Surge",
  sentiment_change: "Sentiment Change",
};

export function AlertHistory({ history, isLoading: _isLoading }: AlertHistoryProps) {
  if (history.length === 0) {
    return (
      <Card className="p-8 text-center bg-card border-border">
        <p className="text-foreground font-medium">No alert history</p>
        <p className="text-muted-foreground text-sm">
          Triggered alerts will appear here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((item) => (
        <Card key={item.id} className="p-3 bg-card border-border">
          <div className="flex items-start justify-between gap-3">
            {/* Left: Alert Info */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <Badge variant="outline" className="border-border text-foreground">
                  {ALERT_TYPE_LABELS[item.alertType] || item.alertType}
                </Badge>
              </div>

              {item.message && (
                <p className="text-sm text-foreground">{item.message}</p>
              )}

              {/* Trigger Values */}
              <div className="flex gap-4 text-xs text-muted-foreground">
                {item.triggerValue !== null && (
                  <span>Trigger: <span className="text-foreground font-medium">{item.triggerValue}</span></span>
                )}
                {item.thresholdValue !== null && (
                  <span>Threshold: <span className="text-foreground font-medium">{item.thresholdValue}</span></span>
                )}
              </div>

              {/* Notification Status */}
              <div className="flex gap-2 pt-1">
                {item.emailSent ? (
                  <div className="flex items-center gap-1 text-xs text-blue-700">
                    <Mail className="w-3 h-3" />
                    Email sent
                  </div>
                ) : null}
                {item.pushSent ? (
                  <div className="flex items-center gap-1 text-xs text-green-700">
                    <Bell className="w-3 h-3" />
                    Push sent
                  </div>
                ) : null}
                {item.websocketSent ? (
                  <div className="flex items-center gap-1 text-xs text-purple-700">
                    <Radio className="w-3 h-3" />
                    Real-time sent
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right: Timestamp */}
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
