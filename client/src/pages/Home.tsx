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
    <div className="min-h-screen bg-white dark:bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-background border-b border-slate-200 dark:border-border">
        <div className="container px-4 py-24 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-blue-600 dark:text-blue-400">
              CAN SLIM Crypto Scanner
            </h1>
            <p className="text-lg text-slate-600 dark:text-muted-foreground mb-12 leading-relaxed max-w-lg">
              Evaluate cryptocurrency projects using William O'Neil's proven investment methodology. Discover high-potential digital assets with AI-powered analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  onClick={() => navigate("/dashboard")}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8 py-3 font-semibold"
                >
                  Go to Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8 py-3 font-semibold"
                >
                  Go to Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              )}
              <Button 
                variant="outline" 
                size="lg"
                className="border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg px-8 py-3 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container px-4 py-20 md:py-28">
        <h2 className="text-4xl font-bold mb-16 text-slate-900 dark:text-white">Powerful Features</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 rounded-xl hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <TrendingUp className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">CAN SLIM Scoring</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Analyze 7 key investment criteria: Current Growth, Annual Growth, New Catalysts, Supply Dynamics, Relative Strength, Institutional Support, and Market Trend.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 rounded-xl hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <BarChart3 className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Real-Time Analytics</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Track market trends, Bitcoin's 200-day EMA, dominance metrics, and Fear & Greed Index in real-time.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 rounded-xl hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <Zap className="h-10 w-10 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">AI Sentiment Analysis</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Detect new catalysts and market sentiment through AI-powered analysis of news, partnerships, and protocol updates.
            </p>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="container px-4 py-20 md:py-28 text-center">
          <h2 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">Ready to Find Your Next Opportunity?</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Start analyzing cryptocurrencies with the CAN SLIM methodology today.
          </p>
          {isAuthenticated ? (
            <Button
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8 py-3 font-semibold"
            >
              Open Dashboard <ArrowRight className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8 py-3 font-semibold"
            >
              Sign In Now <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
