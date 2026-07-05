import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy, useEffect } from "react";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CommandPalette } from "@/components/CommandPalette";
import { OfflineIndicator } from "@/components/OfflineIndicator";
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
      <Route path="/day-trading/chart" component={DayTradingChart} />
      <Route path="/day-trading/positions" component={DayTradingPositions} />
      <Route path="/strategy-comparison" component={StrategyComparison} />
      <Route path="/strategy-dashboard" component={StrategyDashboard} />
      <Route path="/exchange-integration" component={ExchangeIntegration} />
      <Route path="/backtesting" component={BacktestingEngine} />
      <Route path="/strategy-sharing" component={StrategySharing} />
      <Route path="/community-leaderboard" component={CommunityLeaderboard} />
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
