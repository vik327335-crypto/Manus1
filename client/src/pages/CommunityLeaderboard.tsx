import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Users, BarChart3 } from "lucide-react";

/**
 * Community Leaderboard Component
 * Displays top strategies and community statistics
 */

export function CommunityLeaderboard() {
  const [tab, setTab] = useState("leaderboard");

  const leaderboardQuery = trpc.community.getLeaderboard.useQuery({ limit: 50 });
  const communityStatsQuery = trpc.community.getCommunityStats.useQuery();
  const trendingCategoriesQuery = trpc.community.getTrendingCategories.useQuery();

  const leaderboard = leaderboardQuery.data || [];
  const stats = communityStatsQuery.data;
  const categories = trendingCategoriesQuery.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Community Leaderboard</h1>
        <p className="text-muted-foreground mt-2">
          Discover the best performing strategies from our community
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStrategies}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Shared by community members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Contributing strategies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Copies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCopies}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Strategy adoptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(2)} ⭐</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {stats.totalRatings} ratings
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard">
            <Trophy className="mr-2 h-4 w-4" />
            Top Strategies
          </TabsTrigger>
          <TabsTrigger value="categories">
            <BarChart3 className="mr-2 h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="mr-2 h-4 w-4" />
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Strategies</CardTitle>
              <CardDescription>
                Ranked by rating, copies, and community engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.slice(0, 10).map((strategy, index) => (
                  <div
                    key={strategy.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{strategy.strategyName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {strategy.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {strategy.tags?.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {strategy.rating ? (strategy.rating / 100).toFixed(1) : "0"} ⭐
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {strategy.copies || 0} copies
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Categories</CardTitle>
              <CardDescription>
                Most popular strategy categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.category}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold capitalize">
                          {category.category}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {category.count} strategies
                        </p>
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        {category.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trending">
          <Card>
            <CardHeader>
              <CardTitle>Trending Now</CardTitle>
              <CardDescription>
                Most copied and liked strategies this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.slice(0, 5).map((strategy) => (
                  <div
                    key={strategy.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{strategy.strategyName}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {strategy.description}
                        </p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Rating: </span>
                        <span className="font-semibold">
                          {strategy.rating ? (strategy.rating / 100).toFixed(1) : "0"} ⭐
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Copies: </span>
                        <span className="font-semibold">{strategy.copies || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Views: </span>
                        <span className="font-semibold">{strategy.views || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CommunityLeaderboard;
