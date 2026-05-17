import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  BarChart3,
  Search,
  Settings,
  Home,
  Wallet,
  Heart,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  onSelect: () => void;
  group: string;
}

/**
 * Компонент Command Palette для быстрой навигации и поиска
 * Открывается по Cmd/Ctrl + K
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { theme, toggleTheme, switchable } = useTheme();

  // Открыть палитру по Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: "home",
      label: "На главную",
      description: "Перейти на главную страницу",
      icon: <Home className="h-4 w-4" />,
      onSelect: () => {
        setLocation("/");
        setOpen(false);
      },
      group: "Навигация",
    },
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Просмотр основной информации",
      icon: <LayoutDashboard className="h-4 w-4" />,
      onSelect: () => {
        setLocation("/");
        setOpen(false);
      },
      group: "Навигация",
    },
    {
      id: "scanner",
      label: "Scanner",
      description: "Сканирование криптовалют по CAN SLIM",
      icon: <Search className="h-4 w-4" />,
      onSelect: () => {
        setLocation("/scanner");
        setOpen(false);
      },
      group: "Навигация",
    },
    {
      id: "analytics",
      label: "Analytics",
      description: "Просмотр аналитики и статистики",
      icon: <BarChart3 className="h-4 w-4" />,
      onSelect: () => {
        setLocation("/analytics");
        setOpen(false);
      },
      group: "Навигация",
    },
    {
      id: "portfolio",
      label: "Portfolio",
      description: "Управление портфелем",
      icon: <Wallet className="h-4 w-4" />,
      onSelect: () => {
        setLocation("/portfolio");
        setOpen(false);
      },
      group: "Навигация",
    },
    {
      id: "watchlist",
      label: "Watchlist",
      description: "Мой список наблюдения",
      icon: <Heart className="h-4 w-4" />,
      onSelect: () => {
        setLocation("/watchlist");
        setOpen(false);
      },
      group: "Навигация",
    },
    {
      id: "settings",
      label: "Settings",
      description: "Настройки приложения",
      icon: <Settings className="h-4 w-4" />,
      onSelect: () => {
        setLocation("/settings");
        setOpen(false);
      },
      group: "Навигация",
    },

    // Theme
    ...(switchable
      ? [
          {
            id: "toggle-theme",
            label: `Переключить на ${theme === "light" ? "тёмную" : "светлую"} тему`,
            description: `Текущая тема: ${theme === "light" ? "светлая" : "тёмная"}`,
            icon:
              theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              ),
            onSelect: () => {
              toggleTheme?.();
              setOpen(false);
            },
            group: "Внешний вид",
          },
        ]
      : []),

    // Account
    {
      id: "logout",
      label: "Выход",
      description: "Выйти из аккаунта",
      icon: <LogOut className="h-4 w-4" />,
      onSelect: () => {
        logout();
        setOpen(false);
      },
      group: "Аккаунт",
    },
  ];

  // Группировка команд
  const groupedCommands = commands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.group]) {
        acc[cmd.group] = [];
      }
      acc[cmd.group].push(cmd);
      return acc;
    },
    {} as Record<string, CommandItem[]>
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Поиск команд или навигация..." />
      <CommandList>
        <CommandEmpty>Команда не найдена.</CommandEmpty>

        {Object.entries(groupedCommands).map(([group, items], index) => (
          <div key={group}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items.map(cmd => (
                <CommandItem
                  key={cmd.id}
                  value={cmd.id}
                  onSelect={cmd.onSelect}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="text-muted-foreground">{cmd.icon}</div>
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="font-medium">{cmd.label}</span>
                      {cmd.description && (
                        <span className="text-xs text-muted-foreground">
                          {cmd.description}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
