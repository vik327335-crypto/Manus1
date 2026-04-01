import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TelegramLinkingProps {
  userId: number;
  isLinked: boolean;
  telegramUsername?: string;
}

export function TelegramLinking({
  userId,
  isLinked,
  telegramUsername,
}: TelegramLinkingProps) {
  const [copied, setCopied] = useState(false);

  // Generate linking code (in production, this would come from backend)
  const linkingCode = `CAN_SLIM_${userId}_${Date.now().toString(36).toUpperCase()}`;
  const botUsername = "canslim_crypto_bot"; // Replace with actual bot username
  const telegramLink = `https://t.me/${botUsername}?start=${linkingCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(linkingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6 border border-border">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Telegram Bot Integration</h3>
          <p className="text-sm text-muted-foreground">
            Connect your Telegram account to receive real-time alerts and manage your watchlist via Telegram.
          </p>
        </div>

        {isLinked ? (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Connected to Telegram
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  Username: @{telegramUsername || "unknown"}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                  You will receive alerts and notifications via Telegram.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Not Connected
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                    Link your Telegram account to enable bot notifications.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Code Section */}
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-border">
                  <QRCodeSVG
                    value={telegramLink}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan with your phone to open Telegram
                </p>
              </div>

              {/* Manual Link Section */}
              <div className="flex flex-col justify-center space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Or use this code:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={linkingCode}
                      readOnly
                      className="flex-1 px-3 py-2 bg-muted border border-border rounded-md text-sm font-mono"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyCode}
                      className={cn(
                        "transition-colors",
                        copied && "bg-green-100 dark:bg-green-900 border-green-300"
                      )}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Steps:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Open Telegram and search for @{botUsername}</li>
                    <li>Send /start {linkingCode}</li>
                    <li>Follow the bot instructions</li>
                    <li>Your account will be linked automatically</li>
                  </ol>
                </div>

                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => window.open(telegramLink, "_blank")}
                >
                  Open Telegram Bot
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
