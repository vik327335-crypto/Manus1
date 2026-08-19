import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy, useEffect } from "react";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CommandPalette } from "@/components/CommandPalette";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { BacktestNotifications } from "@/components/BacktestNotifications";
import NotFound from "@/pages/NotFound";
import Home from "./pages/Home";
import { Route, Switch } from "wouter";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Scanner = lazy(() => import("./pages/Scanner"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const Settings = lazy(() => import("./pages/Settings"));
const Traders = lazy(() => import("./pages/Traders"));
const LearningHub = lazy(() => import("./pages/LearningHub"));
const PaperTrading = lazy(() => import("./pages/PaperTrading"));
const DayTradingChart = lazy(() => import("./pages/DayTradingChart"));
const DayTradingPositions = lazy(() => import("./pages/DayTradingPositions"));
const StrategyComparison = lazy(() => import("./pages/StrategyComparison").then(m => ({ default: m.StrategyComparison })));
const StrategyDashboard = lazy(() => import("./pages/StrategyDashboard").then(m => ({ default: m.StrategyDashboard })));
const ExchangeIntegration = lazy(() => import("./pages/ExchangeIntegration").then(m => ({ default: m.ExchangeIntegration })));
const BacktestingEngine = lazy(() => import("./pages/BacktestingEngine").then(m => ({ default: m.BacktestingEngine })));
const StrategySharing = lazy(() => import("./pages/StrategySharing").then(m => ({ default: m.StrategySharing })));
const CommunityLeaderboard = lazy(() => import("./pages/CommunityLeaderboard").then(m => ({ default: m.CommunityLeaderboard })));
const SchedulerManager = lazy(() => import("./pages/SchedulerManager").then(m => ({ default: m.SchedulerManager })));
const PortfolioTracker = lazy(() => import("./pages/PortfolioTracker"));
const DeFiIntegration = lazy(() => import("./pages/DeFiIntegration"));
const SocialCopyTrading = lazy(() => import("./pages/SocialCopyTrading"));
const NFTPortfolio = lazy(() => import("./pages/NFTPortfolio"));
const PerformanceMonitoringDashboard = lazy(() => import("./pages/PerformanceMonitoringDashboard"));
const PortfolioRebalancing = lazy(() => import("./pages/PortfolioRebalancing"));
const WebhookIntegrations = lazy(() => import("./pages/WebhookIntegrations"));
const PaperTradingMonitoring = lazy(() => import("./pages/PaperTradingMonitoring"));
const ResearchRegistry = lazy(() => import("./pages/ResearchRegistry"));
const ExchangeConnections = lazy(() => import("./pages/ExchangeConnections"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/watchlist" component={Watchlist} />
      <Route path="/traders" component={Traders} />
      <Route path="/learning" component={LearningHub} />
      <Route path="/paper-trading" component={PaperTrading} />
      <Route path="/paper-trading-monitoring" component={PaperTradingMonitoring} />
      <Route path="/research-registry" component={ResearchRegistry} />
      <Route path="/exchange-connections" component={ExchangeConnections} />
      <Route path="/day-trading/chart" component={DayTradingChart} />
      <Route path="/day-trading/positions" component={DayTradingPositions} />
      <Route path="/strategy-comparison" component={StrategyComparison} />
      <Route path="/strategy-dashboard" component={StrategyDashboard} />
      <Route path="/exchange-integration" component={ExchangeIntegration} />
      <Route path="/backtesting" component={BacktestingEngine} />
      <Route path="/strategy-sharing" component={StrategySharing} />
      <Route path="/community-leaderboard" component={CommunityLeaderboard} />
      <Route path="/scheduler" component={SchedulerManager} />
      <Route path="/portfolio-tracker" component={PortfolioTracker} />
      <Route path="/defi-integration" component={DeFiIntegration} />
      <Route path="/social-copy-trading" component={SocialCopyTrading} />
      <Route path="/nft-portfolio" component={NFTPortfolio} />
      <Route path="/performance-monitoring" component={PerformanceMonitoringDashboard} />
      <Route path="/portfolio-rebalancing" component={PortfolioRebalancing} />
      <Route path="/webhook-integrations" component={WebhookIntegrations} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function AppContent() {
  // Initialize Service Worker
  const swState = useServiceWorker();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    if (swState.isSupported && swState.isRegistered) {
      console.log('[App] Service Worker registered and ready');
    }
  }, [swState.isSupported, swState.isRegistered]);

  return (
    <TooltipProvider>
      <CommandPalette />
      <Toaster />
      <OfflineIndicator />
      <BacktestNotifications />
      <Suspense fallback={<div>Loading...</div>}>
        <Router />
      </Suspense>
    </TooltipProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
