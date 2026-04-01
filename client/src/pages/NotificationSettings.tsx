import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Send, RotateCcw } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TelegramLinking } from "@/components/TelegramLinking";
import { useAuth } from "@/_core/hooks/useAuth";

export default function NotificationSettings() {
  const [, setLocation] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  // Fetch current preferences
  const { data: preferences, isLoading } = trpc.notifications.getPreferences.useQuery();

  // Update preferences mutation
  const updatePrefsMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update preferences");
    },
  });

  // Reset preferences mutation
  const resetPrefsMutation = trpc.notifications.resetPreferences.useMutation({
    onSuccess: () => {
      toast.success("Preferences reset to defaults");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reset preferences");
    },
  });

  // Send test notification mutation
  const testNotificationMutation = trpc.notifications.sendTestNotification.useMutation({
    onSuccess: () => {
      toast.success("Test notification sent!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send test notification");
    },
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!preferences) {
    return <div className="min-h-screen bg-background flex items-center justify-center">No preferences found</div>;
  }

  const handleToggle = (key: keyof typeof preferences) => {
    const newValue = !(preferences[key] as boolean);
    updatePrefsMutation.mutate({
      [key]: newValue,
    });
  };

  const handleThresholdChange = (value: number[]) => {
    updatePrefsMutation.mutate({
      alertThreshold: value[0],
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-4xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure how you receive alerts and updates
          </p>
        </div>

        {/* Notification Channels */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
            <CardDescription>Choose how you want to receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive alerts via email</p>
              </div>
              <Switch
                checked={preferences.emailAlerts}
                onCheckedChange={() => handleToggle("emailAlerts")}
              />
            </div>

            <div className="border-t pt-6 flex items-center justify-between">
              <div>
                <p className="font-semibold">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
              </div>
              <Switch
                checked={preferences.pushAlerts}
                onCheckedChange={() => handleToggle("pushAlerts")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alert Types */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Alert Types</CardTitle>
            <CardDescription>Choose which types of alerts to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Price Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when prices move significantly
                </p>
              </div>
              <Switch
                checked={preferences.priceAlerts}
                onCheckedChange={() => handleToggle("priceAlerts")}
              />
            </div>

            <div className="border-t pt-6 flex items-center justify-between">
              <div>
                <p className="font-semibold">Score Change Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when CAN SLIM scores change
                </p>
              </div>
              <Switch
                checked={preferences.scoreAlerts}
                onCheckedChange={() => handleToggle("scoreAlerts")}
              />
            </div>

            <div className="border-t pt-6 flex items-center justify-between">
              <div>
                <p className="font-semibold">Catalyst Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when new catalysts are detected
                </p>
              </div>
              <Switch
                checked={preferences.catalystAlerts}
                onCheckedChange={() => handleToggle("catalystAlerts")}
              />
            </div>

            <div className="border-t pt-6 flex items-center justify-between">
              <div>
                <p className="font-semibold">Portfolio Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about portfolio performance updates
                </p>
              </div>
              <Switch
                checked={preferences.portfolioAlerts}
                onCheckedChange={() => handleToggle("portfolioAlerts")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alert Threshold */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Price Alert Threshold</CardTitle>
            <CardDescription>
              Minimum price change percentage to trigger an alert
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Slider
                value={[preferences.alertThreshold]}
                onValueChange={handleThresholdChange}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Trigger alert when price changes by:</p>
                <p className="text-lg font-bold">{preferences.alertThreshold}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Notifications */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Notifications</CardTitle>
            <CardDescription>Send yourself a test notification to verify settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => testNotificationMutation.mutate({ type: "email" })}
                disabled={testNotificationMutation.isPending}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Test Email
              </Button>
              <Button
                onClick={() => testNotificationMutation.mutate({ type: "push" })}
                disabled={testNotificationMutation.isPending}
                variant="outline"
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Test Push
              </Button>
              <Button
                onClick={() => testNotificationMutation.mutate({ type: "both" })}
                disabled={testNotificationMutation.isPending}
                variant="outline"
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Test Both
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Bot Integration */}
        {user && (
          <TelegramLinking
            userId={user.id}
            isLinked={(preferences as any)?.telegramLinked || false}
            telegramUsername={(preferences as any)?.telegramUsername}
          />
        )}

        {/* Reset to Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>Reset Settings</CardTitle>
            <CardDescription>Restore default notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => resetPrefsMutation.mutate()}
              disabled={resetPrefsMutation.isPending}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
