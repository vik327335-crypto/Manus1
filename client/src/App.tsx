import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import AssetDetail from "@/pages/AssetDetail";
import Watchlist from "@/pages/Watchlist";
import PortfolioComparison from "@/pages/PortfolioComparison";
import NotificationSettings from "./pages/NotificationSettings";
import Backtesting from "./pages/Backtesting";
import AdminDashboard from "@/pages/AdminDashboard";
import Settings from "@/pages/Settings";
import HistoricalDataAnalysis from "@/pages/HistoricalDataAnalysis";
import AutomatedExportReports from "@/pages/AutomatedExportReports";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/asset/:ticker" component={AssetDetail} />
      <Route path="/watchlist" component={Watchlist} />
      <Route path="/portfolio" component={PortfolioComparison} />
      <Route path={"/notification-settings"} component={NotificationSettings} />      <Route path={"/ backtesting"} component={Backtesting} />
      <Route path="/settings" component={Settings} />
      <Route path="/historical-analysis" component={HistoricalDataAnalysis} />
      <Route path="/export-reports" component={AutomatedExportReports} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
