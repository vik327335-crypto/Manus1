import { ReactNode, useEffect, useState } from "react";
import { useKeyboardShortcuts as _useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface AccessibilityProviderProps {
  children: ReactNode;
}

/**
 * Провайдер для улучшения доступности приложения
 * - Поддержка навигации с клавиатуры
 * - ARIA атрибуты
 * - Высокий контраст
 * - Увеличение размера шрифта
 */
export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "extra-large">("normal");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);

  // Проверяем предпочтения пользователя
  useEffect(() => {
    // Проверяем prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReduceMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Обработка клавиши Tab для видимого фокуса
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        setFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setFocusVisible(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  // Применяем классы доступности
  useEffect(() => {
    const root = document.documentElement;

    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    if (reduceMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    if (focusVisible) {
      root.classList.add("focus-visible");
    } else {
      root.classList.remove("focus-visible");
    }

    // Применяем размер шрифта
    if (fontSize === "large") {
      root.style.fontSize = "18px";
    } else if (fontSize === "extra-large") {
      root.style.fontSize = "20px";
    } else {
      root.style.fontSize = "16px";
    }
  }, [highContrast, fontSize, reduceMotion, focusVisible]);

  return (
    <div
      role="application"
      aria-label="CAN SLIM Crypto Scanner"
      className={`
        ${highContrast ? "high-contrast" : ""}
        ${reduceMotion ? "reduce-motion" : ""}
        ${focusVisible ? "focus-visible" : ""}
      `}
    >
      {children}

      {/* Скрытая кнопка для доступа к настройкам доступности */}
      <AccessibilityMenu
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        fontSize={fontSize}
        setFontSize={setFontSize}
        reduceMotion={reduceMotion}
      />
    </div>
  );
}

interface AccessibilityMenuProps {
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  fontSize: "normal" | "large" | "extra-large";
  setFontSize: (value: "normal" | "large" | "extra-large") => void;
  reduceMotion: boolean;
}

/**
 * Меню настроек доступности
 */
function AccessibilityMenu({
  highContrast,
  setHighContrast,
  fontSize,
  setFontSize,
  reduceMotion,
}: AccessibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        aria-label="Настройки доступности"
        aria-expanded={isOpen}
        aria-controls="accessibility-menu"
      >
        <AccessibilityIcon className="h-6 w-6" />
      </button>

      {isOpen && (
        <div
          id="accessibility-menu"
          className="absolute bottom-16 right-0 bg-background border border-border rounded-lg shadow-lg p-4 w-64 space-y-4"
          role="menu"
        >
          <h3 className="font-semibold text-sm">Настройки доступности</h3>

          {/* Высокий контраст */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              className="w-4 h-4"
              aria-label="Высокий контраст"
            />
            <span className="text-sm">Высокий контраст</span>
          </label>

          {/* Размер шрифта */}
          <div>
            <label htmlFor="font-size" className="text-sm font-medium block mb-2">
              Размер шрифта
            </label>
            <select
              id="font-size"
              value={fontSize}
              onChange={(e) =>
                setFontSize(e.target.value as "normal" | "large" | "extra-large")
              }
              className="w-full px-2 py-1 border border-border rounded text-sm"
              aria-label="Выберите размер шрифта"
            >
              <option value="normal">Нормальный (16px)</option>
              <option value="large">Большой (18px)</option>
              <option value="extra-large">Очень большой (20px)</option>
            </select>
          </div>

          {/* Информация о prefers-reduced-motion */}
          {reduceMotion && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Анимации отключены согласно вашим предпочтениям системы.
            </div>
          )}

          {/* Справка */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Используйте Tab для навигации</p>
            <p>• Используйте Enter для активации кнопок</p>
            <p>• Используйте Стрелки для навигации в меню</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Иконка доступности
 */
function AccessibilityIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="8" r="1.5" />
      <path d="M12 11v4" />
      <path d="M9 14h6" />
    </svg>
  );
}
