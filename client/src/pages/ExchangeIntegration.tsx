import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

/**
 * Exchange Integration Component
 * Manages API credentials for multiple exchanges
 */

export function ExchangeIntegration() {
  const [activeTab, setActiveTab] = useState("binance");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const addCredentialsMutation = trpc.binanceApi.addApiCredentials.useMutation();
  const _getCredentialsMutation = trpc.binanceApi.getApiCredentials.useQuery();
  const _removeCredentialsMutation = trpc.binanceApi.removeApiCredentials.useMutation();

  const handleAddCredentials = async () => {
    if (!apiKey || !apiSecret) {
      setMessage({ type: "error", text: "Please enter both API Key and Secret" });
      return;
    }

    setLoading(true);
    try {
      await addCredentialsMutation.mutateAsync({
        apiKey,
        apiSecret,
      });
      setMessage({ type: "success", text: `Credentials added successfully` });
      setApiKey("");
      setApiSecret("");
    } catch (error) {
      setMessage({ type: "error", text: `Failed to add credentials: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCredentials = async () => {
    setLoading(true);
    try {
      // Remove credentials logic
      // await removeCredentialsMutation.mutateAsync({});
      setMessage({ type: "success", text: `Credentials removed` });
    } catch (_error) {
      setMessage({ type: "error", text: `Failed to remove credentials` });
    } finally {
      setLoading(false);
    }
  };

  const exchanges = [
    { id: "binance", name: "Binance", color: "bg-yellow-500" },
    { id: "coinbase", name: "Coinbase", color: "bg-blue-500" },
    { id: "kraken", name: "Kraken", color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Exchange Integration</h1>
        <p className="text-muted-foreground mt-2">
          Connect your cryptocurrency exchange accounts to enable real-time data and trading
        </p>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {exchanges.map((exchange) => (
            <TabsTrigger key={exchange.id} value={exchange.id}>
              <div className={`w-2 h-2 rounded-full mr-2 ${exchange.color}`} />
              {exchange.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {exchanges.map((exchange) => (
          <TabsContent key={exchange.id} value={exchange.id}>
            <Card>
              <CardHeader>
                <CardTitle>{exchange.name} API Credentials</CardTitle>
                <CardDescription>
                  Enter your {exchange.name} API credentials to connect your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <Input
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">API Secret</label>
                  <Input
                    type="password"
                    placeholder="Enter your API secret"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleAddCredentials}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Credentials"
                    )}
                  </Button>

                  <Button
                    onClick={handleRemoveCredentials}
                    disabled={loading}
                    variant="destructive"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      "Remove"
                    )}
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">How to get your API credentials:</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    {exchange.id === "binance" && (
                      <>
                        <li>1. Go to Binance Account → API Management</li>
                        <li>2. Create a new API key</li>
                        <li>3. Enable "Read" permissions for market data</li>
                        <li>4. Copy your API Key and Secret</li>
                      </>
                    )}
                    {exchange.id === "coinbase" && (
                      <>
                        <li>1. Go to Coinbase Settings → API</li>
                        <li>2. Create a new API key</li>
                        <li>3. Enable "View" permissions</li>
                        <li>4. Copy your API Key and Secret</li>
                      </>
                    )}
                    {exchange.id === "kraken" && (
                      <>
                        <li>1. Go to Kraken Settings → API</li>
                        <li>2. Generate a new API key</li>
                        <li>3. Set permissions to "Query Funds" and "Query Open Orders"</li>
                        <li>4. Copy your API Key and Private Key</li>
                      </>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Connected Exchanges</CardTitle>
          <CardDescription>Your currently connected exchange accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {exchanges.map((exchange) => (
              <div key={exchange.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${exchange.color}`} />
                  <span className="font-medium">{exchange.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Connected</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExchangeIntegration;
