import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, TrendingUp, Users, Copy, Pause, Play } from "lucide-react";

export default function SocialCopyTrading() {
  const [selectedTrader, setSelectedTrader] = useState<string | null>(null);
  const [allocationPercent, setAllocationPercent] = useState(25);

  // Queries
  const topTradersQuery = trpc.socialCopyTrading.getTopTraders.useQuery({ limit: 10 });
  const userSubscriptionsQuery = trpc.socialCopyTrading.getUserSubscriptions.useQuery();
  const recommendationsQuery = trpc.socialCopyTrading.getRecommendations.useQuery();

  // Mutations
  const subscribeMutation = trpc.socialCopyTrading.subscribeToCopyTrader.useMutation();
  const pauseMutation = trpc.socialCopyTrading.pauseSubscription.useMutation();
  const resumeMutation = trpc.socialCopyTrading.resumeSubscription.useMutation();

  const handleSubscribe = async (traderId: string) => {
    await subscribeMutation.mutateAsync({
      traderId,
      allocationPercent,
    });
    setSelectedTrader(null);
    userSubscriptionsQuery.refetch();
  };

  const handlePause = async (subscriptionId: string) => {
    await pauseMutation.mutateAsync({ subscriptionId });
    userSubscriptionsQuery.refetch();
  };

  const handleResume = async (subscriptionId: string) => {
    await resumeMutation.mutateAsync({ subscriptionId });
    userSubscriptionsQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Copy Trading</h1>
        <p className="text-gray-600">Copy strategies from top traders and earn passive income</p>
      </div>

      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover">Discover Traders</TabsTrigger>
          <TabsTrigger value="subscriptions">My Subscriptions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Discover Traders Tab */}
        <TabsContent value="discover" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topTradersQuery.data?.data?.map((trader) => (
              <Card key={trader.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{trader.username}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Users className="w-4 h-4" />
                        {trader.totalFollowers.toLocaleString()} followers
                      </CardDescription>
                    </div>
                    {trader.verified && (
                      <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-green-50 rounded">
                      <p className="text-xs text-gray-600">Win Rate</p>
                      <p className="text-lg font-bold text-green-600">
                        {(trader.winRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-xs text-gray-600">Avg Return</p>
                      <p className="text-lg font-bold text-blue-600">
                        {(trader.averageReturn * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <p className="text-xs text-gray-600">Monthly</p>
                      <p className="text-lg font-bold text-purple-600">
                        {(trader.monthlyReturn * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded">
                      <p className="text-xs text-gray-600">Risk Score</p>
                      <p className="text-lg font-bold text-orange-600">
                        {(trader.riskScore * 100).toFixed(0)}/100
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {trader.strategies.map((strategy) => (
                      <Badge key={strategy} variant="outline" className="text-xs">
                        {strategy}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    onClick={() => setSelectedTrader(trader.id)}
                    className="w-full"
                    disabled={subscribeMutation.isPending}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Subscribe to Copy
                  </Button>

                  {selectedTrader === trader.id && (
                    <div className="space-y-2 p-3 bg-gray-50 rounded">
                      <label className="block text-sm font-medium">
                        Allocation: {allocationPercent}%
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={allocationPercent}
                        onChange={(e) => setAllocationPercent(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSubscribe(trader.id)}
                          disabled={subscribeMutation.isPending}
                          className="flex-1"
                          size="sm"
                        >
                          Confirm
                        </Button>
                        <Button
                          onClick={() => setSelectedTrader(null)}
                          variant="outline"
                          className="flex-1"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          {userSubscriptionsQuery.data?.data && userSubscriptionsQuery.data.data.length > 0 ? (
            <div className="space-y-4">
              {userSubscriptionsQuery.data.data.map((sub) => (
                <Card key={sub.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>Trader ID: {sub.traderId}</CardTitle>
                        <CardDescription>
                          Allocation: {sub.allocationPercent}% • Copied Trades: {sub.copiedTrades}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          sub.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {sub.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Total Profit</p>
                        <p className="text-xl font-bold text-green-600">
                          ${sub.totalProfit.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Total Copied</p>
                        <p className="text-xl font-bold">${sub.totalCopied.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">ROI</p>
                        <p className="text-xl font-bold text-blue-600">
                          {((sub.totalProfit / sub.totalCopied) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {sub.status === "ACTIVE" ? (
                        <Button
                          onClick={() => handlePause(sub.id)}
                          variant="outline"
                          disabled={pauseMutation.isPending}
                          className="flex-1"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleResume(sub.id)}
                          disabled={resumeMutation.isPending}
                          className="flex-1"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </Button>
                      )}
                      <Button variant="destructive" className="flex-1">
                        Unsubscribe
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600">No active subscriptions yet. Discover traders to get started!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {recommendationsQuery.data?.data && recommendationsQuery.data.data.length > 0 ? (
            <div className="space-y-4">
              {recommendationsQuery.data.data.map((rec, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {rec.traderName}
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.round(rec.score * 5)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </CardTitle>
                        <CardDescription>{rec.reason}</CardDescription>
                      </div>
                      <Badge
                        className={
                          rec.riskLevel === "LOW"
                            ? "bg-green-100 text-green-800"
                            : rec.riskLevel === "MEDIUM"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {rec.riskLevel} Risk
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="text-xs text-gray-600">Suggested Allocation</p>
                        <p className="text-2xl font-bold text-blue-600">{rec.suggestedAllocation}%</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded">
                        <p className="text-xs text-gray-600">Expected Return</p>
                        <p className="text-2xl font-bold text-green-600">
                          {(rec.expectedReturn * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <Button className="w-full">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Subscribe with Recommended Settings
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600">No recommendations available yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
