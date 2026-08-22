import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp as _TrendingUp, TrendingDown as _TrendingDown, Zap as _Zap } from "lucide-react";

interface SentimentData {
  source: "twitter" | "reddit" | "news" | "telegram" | "discord";
  ticker: string;
  sentiment: "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "VERY_NEGATIVE";
  score: number;
  confidence: number;
  timestamp: Date;
}

export default function SentimentAnalyzer() {
  const [text, setText] = useState("");
  const [selectedTicker, setSelectedTicker] = useState("BTC");
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([
    {
      source: "twitter",
      ticker: "BTC",
      sentiment: "POSITIVE",
      score: 0.65,
      confidence: 0.8,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      source: "reddit",
      ticker: "BTC",
      sentiment: "VERY_POSITIVE",
      score: 0.82,
      confidence: 0.75,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      source: "news",
      ticker: "BTC",
      sentiment: "NEUTRAL",
      score: 0.1,
      confidence: 0.6,
      timestamp: new Date(),
    },
  ]);

  // Analyze sentiment mutation
  const analyzeSentimentMutation = trpc.sentiment.analyzeSentiment.useQuery(
    { text },
    { enabled: false }
  );

  const handleAnalyzeSentiment = async () => {
    if (text.trim()) {
      try {
        const result = await analyzeSentimentMutation.refetch();
        if (result.data?.data) {
          setSentimentData([
            ...sentimentData,
            {
              source: "twitter",
              ticker: selectedTicker,
              sentiment: result.data.data.sentiment,
              score: result.data.data.score,
              confidence: result.data.data.confidence,
              timestamp: new Date(),
            },
          ]);
          setText("");
        }
      } catch (error) {
        console.error("Failed to analyze sentiment:", error);
      }
    }
  };

  // Calculate aggregate sentiment
  const aggregateSentiment =
    sentimentData.reduce((sum, d) => sum + d.score * d.confidence, 0) /
    sentimentData.reduce((sum, d) => sum + d.confidence, 0);

  const averageConfidence =
    sentimentData.reduce((sum, d) => sum + d.confidence, 0) / sentimentData.length;

  // Sentiment distribution
  const distribution: Record<string, number> = {};
  sentimentData.forEach((d) => {
    distribution[d.sentiment] = (distribution[d.sentiment] || 0) + 1;
  });

  const distributionData = Object.entries(distribution).map(([sentiment, count]) => ({
    name: sentiment,
    value: count,
  }));

  // Sentiment by source
  const bySource: Record<string, number> = {};
  sentimentData.forEach((d) => {
    bySource[d.source] = (bySource[d.source] || 0) + d.score;
  });

  const bySourceData = Object.entries(bySource).map(([source, score]) => ({
    name: source,
    score: score / sentimentData.filter((d) => d.source === source).length,
  }));

  // Timeline data
  const timelineData = sentimentData
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((d, _i) => ({
      time: new Date(d.timestamp).toLocaleTimeString(),
      score: d.score,
      confidence: d.confidence,
    }));

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "VERY_POSITIVE":
        return "text-green-600";
      case "POSITIVE":
        return "text-green-500";
      case "NEUTRAL":
        return "text-gray-500";
      case "NEGATIVE":
        return "text-red-500";
      case "VERY_NEGATIVE":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sentiment Analyzer</h1>
        <p className="text-gray-600">Analyze sentiment from social media, news, and other sources</p>
      </div>

      {/* Sentiment Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                aggregateSentiment > 0.3
                  ? "text-green-600"
                  : aggregateSentiment < -0.3
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {aggregateSentiment.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">-1 (Very Negative) to 1 (Very Positive)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(averageConfidence * 100).toFixed(0)}%</div>
            <p className="text-xs text-gray-500">Analysis confidence level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Mentions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentimentData.length}</div>
            <p className="text-xs text-gray-500">Analyzed mentions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Dominant Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSentimentColor(Object.entries(distribution).sort(([, a], [, b]) => b - a)[0]?.[0] || "NEUTRAL")}`}>
              {Object.entries(distribution).sort(([, a], [, b]) => b - a)[0]?.[0] || "NEUTRAL"}
            </div>
            <p className="text-xs text-gray-500">Most common sentiment</p>
          </CardContent>
        </Card>
      </div>

      {/* Analyze Text */}
      <Card>
        <CardHeader>
          <CardTitle>Analyze Text</CardTitle>
          <CardDescription>Enter text to analyze sentiment and extract ticker mentions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Ticker</Label>
              <Input
                placeholder="BTC"
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <Label>Text to Analyze</Label>
              <Textarea
                placeholder="Enter text to analyze sentiment..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={handleAnalyzeSentiment} className="w-full">
              Analyze Sentiment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bySourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#8884d8" name="Sentiment Score" />
              <Line type="monotone" dataKey="confidence" stroke="#82ca9d" name="Confidence" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Mentions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Mentions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sentimentData
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 10)
              .map((data, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{data.source.toUpperCase()}</span>
                      <span className={`text-sm font-semibold ${getSentimentColor(data.sentiment)}`}>
                        {data.sentiment}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(data.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{data.score.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{(data.confidence * 100).toFixed(0)}% confidence</div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
