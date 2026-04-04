import { AlertCondition } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit2, Trash2, Bell, Mail, Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AlertConditionsListProps {
  conditions: AlertCondition[];
  onEdit: (condition: AlertCondition) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, enabled: boolean) => void;
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

const ALERT_TYPE_COLORS: Record<string, string> = {
  price_above: "bg-green-100 text-green-800",
  price_below: "bg-red-100 text-red-800",
  price_change_percent: "bg-orange-100 text-orange-800",
  score_above: "bg-blue-100 text-blue-800",
  score_below: "bg-purple-100 text-purple-800",
  volume_surge: "bg-yellow-100 text-yellow-800",
  sentiment_change: "bg-pink-100 text-pink-800",
};

export function AlertConditionsList({
  conditions,
  onEdit,
  onDelete,
  onToggle,
  isLoading,
}: AlertConditionsListProps) {
  if (conditions.length === 0) {
    return (
      <Card className="p-8 text-center bg-card border-border">
        <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-foreground font-medium">No alerts configured</p>
        <p className="text-muted-foreground text-sm">
          Create your first alert to get notified about price and score changes
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {conditions.map((condition) => (
        <Card key={condition.id} className="p-4 bg-card border-border hover:border-accent transition-colors">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Alert Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={ALERT_TYPE_COLORS[condition.alertType] || "bg-gray-100 text-gray-800"}>
                  {ALERT_TYPE_LABELS[condition.alertType] || condition.alertType}
                </Badge>
                {condition.description && (
                  <span className="text-sm text-foreground">{condition.description}</span>
                )}
              </div>

              {/* Threshold Value */}
              {condition.threshold !== null && (
                <p className="text-sm text-muted-foreground">
                  Threshold: <span className="text-foreground font-medium">{condition.threshold}</span>
                </p>
              )}

              {/* Notification Methods */}
              <div className="flex flex-wrap gap-2 pt-1">
                {condition.notifyEmail ? (
                  <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    <Mail className="w-3 h-3" />
                    Email
                  </div>
                ) : null}
                {condition.notifyPush ? (
                  <div className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                    <Bell className="w-3 h-3" />
                    Push
                  </div>
                ) : null}
                {condition.notifyWebsocket ? (
                  <div className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                    <Radio className="w-3 h-3" />
                    Real-Time
                  </div>
                ) : null}
              </div>

              {/* Last Triggered */}
              {condition.lastTriggeredAt && (
                <p className="text-xs text-muted-foreground">
                  Last triggered: {formatDistanceToNow(new Date(condition.lastTriggeredAt), { addSuffix: true })}
                </p>
              )}
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              {/* Enable/Disable Toggle */}
              <Switch
                checked={condition.enabled === 1}
                onCheckedChange={(checked) => onToggle(condition.id, checked)}
                disabled={isLoading}
              />

              {/* Edit Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(condition)}
                disabled={isLoading}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="w-4 h-4" />
              </Button>

              {/* Delete Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(condition.id)}
                disabled={isLoading}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
