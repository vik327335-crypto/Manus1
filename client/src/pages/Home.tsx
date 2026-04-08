import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, TrendingUp, BarChart3, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="container py-20">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold text-gradient mb-4">
              CAN SLIM Crypto Scanner
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Evaluate cryptocurrency projects using William O'Neil's proven investment methodology. Discover high-potential digital assets with AI-powered analysis.
            </p>
            <div className="flex gap-4">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  onClick={() => navigate("/dashboard")}
                  className="gap-2"
                >
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="gap-2"
                >
                  Sign In to Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-20">
        <h2 className="text-3xl font-bold mb-12">Powerful Features</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="card-elevated p-6">
            <TrendingUp className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">CAN SLIM Scoring</h3>
            <p className="text-sm text-muted-foreground">
              Analyze 7 key investment criteria: Current Growth, Annual Growth, New Catalysts, Supply Dynamics, Relative Strength, Institutional Support, and Market Trend.
            </p>
          </Card>

          <Card className="card-elevated p-6">
            <BarChart3 className="h-8 w-8 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Real-Time Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track market trends, Bitcoin's 200-day EMA, dominance metrics, and Fear & Greed Index in real-time.
            </p>
          </Card>

          <Card className="card-elevated p-6">
            <Zap className="h-8 w-8 text-amber-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI Sentiment Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Detect new catalysts and market sentiment through AI-powered analysis of news, partnerships, and protocol updates.
            </p>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-border bg-card">
        <div className="container py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Next Opportunity?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Start analyzing cryptocurrencies with the CAN SLIM methodology today.
          </p>
          {isAuthenticated ? (
            <Button
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="gap-2"
            >
              Sign In Now <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
