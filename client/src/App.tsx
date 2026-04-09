import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy, useEffect } from "react";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import NotFound from "@/pages/NotFound";
import Home from "./pages/Home";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Loader2 } from "lucide-react";

// Lazy load feature pages for better initial load time
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AssetDetail = lazy(() => import("@/pages/AssetDetail"));
const Watchlist = lazy(() => import("@/pages/Watchlist"));
const PortfolioComparison = lazy(() => import("@/pages/PortfolioComparison"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const Backtesting = lazy(() => import("./pages/Backtesting"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const Settings = lazy(() => import("@/pages/Settings"));
const HistoricalDataAnalysis = lazy(() => import("@/pages/HistoricalDataAnalysis"));
const AutomatedExportReports = lazy(() => import("@/pages/AutomatedExportReports"));
const Scanner = lazy(() => import("@/pages/Scanner"));
const Portfolio = lazy(() => import("@/pages/Portfolio"));
const AlertManager = lazy(() => import("@/pages/AlertManager"));
const ReportGenerator = lazy(() => import("@/pages/ReportGenerator"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading page...</p>
      </div>
    </div>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/asset/:ticker" component={AssetDetail} />
        <Route path="/watchlist" component={Watchlist} />
        <Route path="/portfolio" component={PortfolioComparison} />
        <Route path="/notification-settings" component={NotificationSettings} />
        <Route path="/backtesting" component={Backtesting} />
        <Route path="/settings" component={Settings} />
        <Route path="/historical-analysis" component={HistoricalDataAnalysis} />
        <Route path="/export-reports" component={AutomatedExportReports} />
        <Route path="/scanner" component={Scanner} />
        <Route path="/portfolio-management" component={Portfolio} />
        <Route path="/alerts" component={AlertManager} />
        <Route path="/reports" component={ReportGenerator} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/404" component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function AppContent() {
  // Initialize Service Worker
  const swState = useServiceWorker();

  useEffect(() => {
    if (swState.isSupported && swState.isRegistered) {
      console.log('[App] Service Worker registered and ready');
    }
  }, [swState.isSupported, swState.isRegistered]);

  return (
    <TooltipProvider>
      <Toaster />
      <OfflineIndicator />
      <Router />
    </TooltipProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
