import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/useMobile";
import { ResponsiveHidden } from "./ResponsiveGrid";
import {
  LayoutDashboard,
  Search,
  BarChart3,
  Wallet,
  Heart,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Scanner", path: "/scanner", icon: <Search className="h-5 w-5" /> },
  { label: "Analytics", path: "/analytics", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Portfolio", path: "/portfolio", icon: <Wallet className="h-5 w-5" /> },
  { label: "Watchlist", path: "/watchlist", icon: <Heart className="h-5 w-5" /> },
  { label: "Settings", path: "/settings", icon: <Settings className="h-5 w-5" /> },
];

/**
 * Мобильная навигация с иконками в нижней части экрана
 */
export function MobileNavigation() {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <ResponsiveHidden hideOn={["md", "lg", "xl"]}>
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm z-40">
        <div className="flex items-center justify-around h-16">
          {navItems.map(item => {
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </ResponsiveHidden>
  );
}

/**
 * Padding для контента на мобильных устройствах (чтобы не перекрывалась навигация)
 */
export function MobileNavigationPadding() {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return <div className="h-20" />;
}
