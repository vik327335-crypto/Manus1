import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number; // -1 to 1
  catalysts: string[];
  summary: string;
}

interface SentimentNewsFeedProps {
  assetName: string;
  newsItems: NewsItem[];
  isLoading?: boolean;
}

export function SentimentNewsFeed({
  assetName,
  newsItems,
  isLoading = false,
}: SentimentNewsFeedProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "negative":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "neutral":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="h-4 w-4" />;
      case "negative":
        return <TrendingDown className="h-4 w-4" />;
      case "neutral":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getScorePercentage = (score: number) => {
    return Math.round(((score + 1) / 2) * 100);
  };

  if (isLoading) {
    return (
      <Card className="card-elevated p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (newsItems.length === 0) {
    return (
      <Card className="card-elevated p-6 text-center">
        <p className="text-muted-foreground">No recent news available for {assetName}</p>
      </Card>
    );
  }

  // Рассчитать общий сентимент
  const avgSentiment = newsItems.reduce((sum, item) => sum + item.score, 0) / newsItems.length;
  const overallSentiment =
    avgSentiment > 0.2 ? "positive" : avgSentiment < -0.2 ? "negative" : "neutral";

  return (
    <div className="space-y-6">
      {/* Overall Sentiment Summary */}
      <Card className="card-elevated p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            News Sentiment Summary
          </h3>
          <Badge className={getSentimentColor(overallSentiment)}>
            {overallSentiment.charAt(0).toUpperCase() + overallSentiment.slice(1)}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Sentiment Score</span>
              <span className="text-sm font-semibold">{getScorePercentage(avgSentiment)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  avgSentiment > 0.2
                    ? "bg-green-500"
                    : avgSentiment < -0.2
                      ? "bg-red-500"
                      : "bg-amber-500"
                )}
                style={{ width: `${getScorePercentage(avgSentiment)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded text-center">
              <p className="font-semibold">
                {newsItems.filter((n) => n.sentiment === "positive").length}
              </p>
              <p className="text-xs text-muted-foreground">Positive</p>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-center">
              <p className="font-semibold">
                {newsItems.filter((n) => n.sentiment === "neutral").length}
              </p>
              <p className="text-xs text-muted-foreground">Neutral</p>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded text-center">
              <p className="font-semibold">
                {newsItems.filter((n) => n.sentiment === "negative").length}
              </p>
              <p className="text-xs text-muted-foreground">Negative</p>
            </div>
          </div>
        </div>
      </Card>

      {/* News Items */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent News</h3>
        {newsItems.map((item) => (
          <Card
            key={item.id}
            className={cn(
              "card-elevated p-6 border-l-4 hover:shadow-md transition-shadow cursor-pointer",
              item.sentiment === "positive"
                ? "border-l-green-500"
                : item.sentiment === "negative"
                  ? "border-l-red-500"
                  : "border-l-amber-500"
            )}
            onClick={() => window.open(item.url, "_blank")}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-1">{item.title}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className={cn("p-2 rounded", getSentimentColor(item.sentiment))}>
                  {getSentimentIcon(item.sentiment)}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="font-semibold">{getScorePercentage(item.score)}%</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{item.summary}</p>

            {item.catalysts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.catalysts.map((catalyst, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {catalyst}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
