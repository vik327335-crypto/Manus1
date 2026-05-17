import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  className?: string;
}

/**
 * Компонент для переключения между светлой и тёмной темой
 */
export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn("rounded-full", className)}
      title={`Переключиться на ${theme === "light" ? "тёмную" : "светлую"} тему`}
      aria-label={`Переключиться на ${theme === "light" ? "тёмную" : "светлую"} тему`}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      ) : (
        <Sun className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      )}
    </Button>
  );
}
