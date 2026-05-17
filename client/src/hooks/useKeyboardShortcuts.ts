import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Хук для обработки горячих клавиш приложения
 * Поддерживает навигацию и основные действия
 */
export function useKeyboardShortcuts() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Игнорируем если фокус на input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Cmd/Ctrl + K: Открыть поиск
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        // Будет реализовано позже с компонентом поиска
        console.log("Search shortcut triggered");
      }

      // Cmd/Ctrl + /: Показать справку
      if ((event.metaKey || event.ctrlKey) && event.key === "/") {
        event.preventDefault();
        // Будет реализовано позже с компонентом справки
        console.log("Help shortcut triggered");
      }

      // Cmd/Ctrl + D: Перейти на Dashboard
      if ((event.metaKey || event.ctrlKey) && event.key === "d") {
        event.preventDefault();
        navigate("/dashboard");
      }

      // Cmd/Ctrl + S: Перейти на Scanner
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        navigate("/scanner");
      }

      // Cmd/Ctrl + A: Перейти на Analytics
      if ((event.metaKey || event.ctrlKey) && event.key === "a") {
        event.preventDefault();
        navigate("/analytics");
      }

      // Cmd/Ctrl + P: Перейти на Portfolio
      if ((event.metaKey || event.ctrlKey) && event.key === "p") {
        event.preventDefault();
        navigate("/portfolio");
      }

      // Cmd/Ctrl + W: Перейти на Watchlist
      if ((event.metaKey || event.ctrlKey) && event.key === "w") {
        event.preventDefault();
        navigate("/watchlist");
      }

      // Cmd/Ctrl + H: Перейти на Home
      if ((event.metaKey || event.ctrlKey) && event.key === "h") {
        event.preventDefault();
        navigate("/");
      }

      // Cmd/Ctrl + ,: Перейти на Settings
      if ((event.metaKey || event.ctrlKey) && event.key === ",") {
        event.preventDefault();
        navigate("/settings");
      }

      // Escape: Закрыть модальные окна (будет реализовано позже)
      if (event.key === "Escape") {
        // Будет реализовано позже
        console.log("Escape pressed");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
}

/**
 * Получить список всех доступных горячих клавиш
 */
export const KEYBOARD_SHORTCUTS = [
  {
    key: "Cmd/Ctrl + K",
    description: "Открыть поиск",
    category: "Navigation",
  },
  {
    key: "Cmd/Ctrl + /",
    description: "Показать справку",
    category: "Help",
  },
  {
    key: "Cmd/Ctrl + D",
    description: "Перейти на Dashboard",
    category: "Navigation",
  },
  {
    key: "Cmd/Ctrl + S",
    description: "Перейти на Scanner",
    category: "Navigation",
  },
  {
    key: "Cmd/Ctrl + A",
    description: "Перейти на Analytics",
    category: "Navigation",
  },
  {
    key: "Cmd/Ctrl + P",
    description: "Перейти на Portfolio",
    category: "Navigation",
  },
  {
    key: "Cmd/Ctrl + W",
    description: "Перейти на Watchlist",
    category: "Navigation",
  },
  {
    key: "Cmd/Ctrl + H",
    description: "Перейти на Home",
    category: "Navigation",
  },
  {
    key: "Cmd/Ctrl + ,",
    description: "Перейти на Settings",
    category: "Navigation",
  },
  {
    key: "Escape",
    description: "Закрыть модальные окна",
    category: "General",
  },
];
