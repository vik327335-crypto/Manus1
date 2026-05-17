import { useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  BarChart3,
  Wallet,
  Heart,
  Settings,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  description?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Основное",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: <LayoutDashboard className="h-4 w-4" />,
        description: "Основная информация",
      },
      {
        label: "Scanner",
        path: "/scanner",
        icon: <Search className="h-4 w-4" />,
        description: "Сканирование активов",
      },
    ],
  },
  {
    label: "Анализ",
    items: [
      {
        label: "Analytics",
        path: "/analytics",
        icon: <BarChart3 className="h-4 w-4" />,
        description: "Аналитика и статистика",
      },
      {
        label: "Portfolio",
        path: "/portfolio",
        icon: <Wallet className="h-4 w-4" />,
        description: "Мой портфель",
      },
      {
        label: "Watchlist",
        path: "/watchlist",
        icon: <Heart className="h-4 w-4" />,
        description: "Список наблюдения",
      },
    ],
  },
  {
    label: "Настройки",
    items: [
      {
        label: "Settings",
        path: "/settings",
        icon: <Settings className="h-4 w-4" />,
        description: "Параметры приложения",
      },
    ],
  },
];

/**
 * Улучшенная навигация с группировкой и описаниями
 */
export function EnhancedNavigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const allItems = navGroups.flatMap(group => group.items);
  const currentItem = allItems.find(item => item.path === location);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        {navGroups.map((group, idx) => (
          <div key={group.label} className="flex items-center gap-1">
            {idx > 0 && <div className="w-px h-6 bg-border mx-1" />}

            {group.items.length === 1 ? (
              <NavLink item={group.items[0]} isActive={location === group.items[0].path} />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                  >
                    {group.label}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {group.items.map(item => (
                    <DropdownMenuItem
                      key={item.path}
                      asChild
                      className={cn(
                        "cursor-pointer",
                        location === item.path && "bg-accent"
                      )}
                    >
                      <a href={item.path} className="flex items-center gap-2">
                        {item.icon}
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{item.label}</span>
                          {item.description && (
                            <span className="text-xs text-muted-foreground">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </nav>

      {/* Mobile Navigation Toggle */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="gap-2"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{currentItem?.label || "Menu"}</span>
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-background border-b shadow-lg z-50">
          <div className="p-4 space-y-4">
            {navGroups.map(group => (
              <div key={group.label}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.items.map(item => (
                    <a
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                        location === item.path
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {item.icon}
                      <div className="flex flex-col gap-0.5 flex-1">
                        <span className="font-medium text-sm">{item.label}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
}

function NavLink({ item, isActive }: NavLinkProps) {
  return (
    <a
      href={item.path}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
      title={item.description}
    >
      {item.icon}
      <span>{item.label}</span>
    </a>
  );
}
