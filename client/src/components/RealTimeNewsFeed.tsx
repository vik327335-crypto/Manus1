import { useEffect as _useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RealTimeNewsFeedProps {
  ticker: string;
  name: string;
}

export default function RealTimeNewsFeed({ ticker, name }: RealTimeNewsFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch news with sentiment analysis
  const { data, isLoading, error, refetch } = trpc.news.analyzeWithSentiment.useQuery(
    { ticker, name },
    { staleTime: 5 * 60 * 1000 } // 5 minute cache
  );

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800";
      case "negative":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="w-4 h-4" />;
      case "negative":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Real-Time News Feed</CardTitle>
          <CardDescription>Latest news with AI sentiment analysis</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2">Fetching news...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Real-Time News Feed</CardTitle>
          <CardDescription>Latest news with AI sentiment analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 py-4">
            Failed to fetch news. {error.message}
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const newsItems = data?.data || [];
  const analysis = data?.analysis;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Real-Time News Feed</CardTitle>
            <CardDescription>Latest news with AI sentiment analysis</CardDescription>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Sentiment Analysis */}
        {analysis && (
          <div className={`p-4 rounded-lg border ${getSentimentColor(analysis.sentiment)}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold flex items-center gap-2">
                {getSentimentIcon(analysis.sentiment)}
                Overall Sentiment: {analysis.sentiment.toUpperCase()}
              </h4>
              <span className="text-sm font-bold">
                Score: {(analysis.score * 100).toFixed(0)}%
              </span>
            </div>
            {analysis.summary && (
              <p className="text-sm mb-2">{analysis.summary}</p>
            )}
            {analysis.catalysts && analysis.catalysts.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold mb-1">Key Catalysts:</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.catalysts.map((catalyst: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {catalyst}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* News Items */}
        {newsItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No news found for {ticker}
          </div>
        ) : (
          <div className="space-y-3">
            {newsItems.map((item: any) => (
              <div
                key={item.id}
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm mb-1">{item.title}</h5>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {item.source}
                      </Badge>
                      {item.sentiment && (
                        <Badge className={`text-xs ${getSentimentColor(item.sentiment)}`}>
                          {item.sentiment}
                        </Badge>
                      )}
                      {item.score && (
                        <span className="text-xs text-gray-600">
                          {(item.score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {new Date(item.pubDate).toLocaleString()}
                    </p>
                  </div>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Expanded Content */}
                {expandedId === item.id && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                    {item.catalysts && item.catalysts.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Catalysts:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.catalysts.map((catalyst: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {catalyst}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 pt-2 border-t">
          Found {newsItems.length} news items for {ticker}
        </div>
      </CardContent>
    </Card>
  );
}
