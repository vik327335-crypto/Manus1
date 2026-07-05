import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Share2, Heart, Copy, Search } from "lucide-react";

/**
 * Strategy Sharing Component
 * Allows users to share and discover trading strategies
 */

export function StrategySharing() {
  const [tab, setTab] = useState<"share" | "discover">("discover");
  const [strategyName, setStrategyName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const shareStrategyMutation = trpc.social.shareStrategy.useMutation();
  const getSharedStrategiesQuery = trpc.social.getSharedStrategies.useQuery({
    limit: 50,
  });
  const likeStrategyMutation = trpc.social.likeStrategy.useMutation();
  const copyStrategyMutation = trpc.social.copyStrategy.useMutation();
  const searchStrategiesQuery = trpc.social.searchStrategies.useQuery(
    { query: searchQuery, limit: 50 },
    { enabled: searchQuery.length > 0 }
  );

  const handleShareStrategy = async () => {
    if (!strategyName || !description) {
      return;
    }

    setLoading(true);
    try {
      await shareStrategyMutation.mutateAsync({
        strategyId: `strategy-${Date.now()}`,
        strategyName,
        description,
        parameters: {},
        tags,
        isPublic: true,
      });
      setStrategyName("");
      setDescription("");
      setTags([]);
    } catch (error) {
      console.error("Failed to share strategy:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const strategies = searchQuery.length > 0 ? searchStrategiesQuery.data : getSharedStrategiesQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Strategy Community</h1>
        <p className="text-muted-foreground mt-2">
          Share your trading strategies and discover strategies from other traders
        </p>
      </div>

      <div className="flex gap-2 border-b">
        <Button
          variant={tab === "discover" ? "default" : "ghost"}
          onClick={() => setTab("discover")}
          className="rounded-none"
        >
          <Search className="mr-2 h-4 w-4" />
          Discover
        </Button>
        <Button
          variant={tab === "share" ? "default" : "ghost"}
          onClick={() => setTab("share")}
          className="rounded-none"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share Strategy
        </Button>
      </div>

      {tab === "share" && (
        <Card>
          <CardHeader>
            <CardTitle>Share Your Strategy</CardTitle>
            <CardDescription>
              Share your trading strategy with the community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Strategy Name</label>
              <Input
                placeholder="e.g., Golden Cross SMA"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your strategy, how it works, and when to use it..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tags (e.g., momentum, mean-reversion)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                />
                <Button onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleShareStrategy} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Strategy
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "discover" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search strategies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="grid gap-4">
            {strategies?.map((strategy) => (
              <Card key={strategy.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{strategy.strategyName}</CardTitle>
                      <CardDescription>{strategy.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{strategy.rating ? (strategy.rating / 100).toFixed(1) : "0"} ⭐</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {strategy.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="font-semibold">{strategy.views || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Copies</p>
                      <p className="font-semibold">{strategy.copies || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ratings</p>
                      <p className="font-semibold">{strategy.ratingCount || 0}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => likeStrategyMutation.mutate({ sharedId: strategy.id })}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Like
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => copyStrategyMutation.mutate({ sharedId: strategy.id })}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StrategySharing;
