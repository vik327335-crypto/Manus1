import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

export interface AlertConditionFormData {
  alertType: string;
  threshold?: number | null;
  secondaryThreshold?: number | null;
  notifyEmail: boolean | number | null;
  notifyPush: boolean | number | null;
  notifyWebsocket: boolean | number | null;
  cooldownMinutes: number | null;
  description?: string | null;
}

interface AlertConditionFormProps {
  onSubmit: (data: AlertConditionFormData) => void;
  onCancel: () => void;
  initialData?: AlertConditionFormData;
  isLoading?: boolean;
}

const ALERT_TYPES = [
  { value: "price_above", label: "Price Above" },
  { value: "price_below", label: "Price Below" },
  { value: "price_change_percent", label: "Price Change %" },
  { value: "score_above", label: "CAN SLIM Score Above" },
  { value: "score_below", label: "CAN SLIM Score Below" },
  { value: "volume_surge", label: "Volume Surge" },
  { value: "sentiment_change", label: "Sentiment Change" },
];

export function AlertConditionForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading,
}: AlertConditionFormProps) {
  const [formData, setFormData] = useState<AlertConditionFormData>(
    initialData || {
      alertType: "price_below",
      threshold: undefined,
      notifyEmail: true as any,
      notifyPush: true as any,
      notifyWebsocket: true as any,
      cooldownMinutes: 60,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const selectedType = ALERT_TYPES.find((t) => t.value === formData.alertType);
  const requiresThreshold = ![
    "volume_surge",
    "sentiment_change",
  ].includes(formData.alertType);

  return (
    <Card className="p-6 bg-card border-border">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Alert Type */}
        <div className="space-y-2">
          <Label htmlFor="alertType" className="text-foreground">
            Alert Type
          </Label>
          <Select value={formData.alertType} onValueChange={(value) => setFormData({ ...formData, alertType: value })}>
            <SelectTrigger id="alertType" className="bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALERT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Threshold */}
        {requiresThreshold && (
          <div className="space-y-2">
            <Label htmlFor="threshold" className="text-foreground">
              {selectedType?.label.includes("Score") ? "Score Threshold (0-100)" : "Threshold Value"}
            </Label>
            <Input
              id="threshold"
              type="number"
              value={formData.threshold || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  threshold: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="Enter threshold value"
              className="bg-background border-border text-foreground"
            />
          </div>
        )}

        {/* Notification Preferences */}
        <div className="space-y-3">
          <Label className="text-foreground">Notification Methods</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyEmail"
                checked={Boolean(formData.notifyEmail)}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notifyEmail: checked as any })
                }
              />
              <Label htmlFor="notifyEmail" className="text-foreground cursor-pointer">
                Email Notification
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyPush"
                checked={Boolean(formData.notifyPush)}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notifyPush: checked as any })
                }
              />
              <Label htmlFor="notifyPush" className="text-foreground cursor-pointer">
                Push Notification
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyWebsocket"
                checked={Boolean(formData.notifyWebsocket)}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notifyWebsocket: checked as any })
                }
              />
              <Label htmlFor="notifyWebsocket" className="text-foreground cursor-pointer">
                Real-Time Alert (WebSocket)
              </Label>
            </div>
          </div>
        </div>

        {/* Cooldown */}
        <div className="space-y-2">
          <Label htmlFor="cooldown" className="text-foreground">
            Alert Cooldown (minutes)
          </Label>
          <Input
            id="cooldown"
            type="number"
            min="5"
            max="1440"
            value={formData.cooldownMinutes || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                cooldownMinutes: parseInt(e.target.value) || 60 as any,
              })
            }
            className="bg-background border-border text-foreground"
          />
          <p className="text-xs text-muted-foreground">
            Prevents alert spam by waiting this long before triggering again
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground">
            Description (Optional)
          </Label>
          <Input
            id="description"
            type="text"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., Alert when BTC drops below $40k"
            className="bg-background border-border text-foreground"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Saving..." : "Save Alert"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-border text-foreground hover:bg-accent"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
