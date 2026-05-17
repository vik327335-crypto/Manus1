import { useEffect, useState } from "react";

/**
 * Хук для определения, является ли экран мобильным (< 768px)
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Проверяем начальный размер
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    // Слушаем изменения размера окна
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

/**
 * Хук для определения текущего breakpoint
 */
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("md");

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setBreakpoint("xs");
      } else if (width < 768) {
        setBreakpoint("sm");
      } else if (width < 1024) {
        setBreakpoint("md");
      } else if (width < 1280) {
        setBreakpoint("lg");
      } else {
        setBreakpoint("xl");
      }
    };

    checkBreakpoint();

    window.addEventListener("resize", checkBreakpoint);
    return () => window.removeEventListener("resize", checkBreakpoint);
  }, []);

  return breakpoint;
}

/**
 * Хук для определения ориентации экрана
 */
export type Orientation = "portrait" | "landscape";

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  useEffect(() => {
    const checkOrientation = () => {
      if (window.innerHeight > window.innerWidth) {
        setOrientation("portrait");
      } else {
        setOrientation("landscape");
      }
    };

    checkOrientation();

    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  return orientation;
}
