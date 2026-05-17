import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
}

const colsMap = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

const gapMap = {
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

/**
 * Адаптивная сетка для различных размеров экранов
 */
export function ResponsiveGrid({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = "md",
}: ResponsiveGridProps) {
  const gridClasses = cn(
    "grid",
    cols.xs && colsMap[cols.xs as keyof typeof colsMap],
    cols.sm && `sm:${colsMap[cols.sm as keyof typeof colsMap]}`,
    cols.md && `md:${colsMap[cols.md as keyof typeof colsMap]}`,
    cols.lg && `lg:${colsMap[cols.lg as keyof typeof colsMap]}`,
    cols.xl && `xl:${colsMap[cols.xl as keyof typeof colsMap]}`,
    gapMap[gap],
    className
  );

  return <div className={gridClasses}>{children}</div>;
}

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
};

/**
 * Адаптивный контейнер с максимальной шириной
 */
export function ResponsiveContainer({
  children,
  className,
  maxWidth = "2xl",
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto px-4 sm:px-6 md:px-8",
        maxWidthMap[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveStackProps {
  children: ReactNode;
  className?: string;
  direction?: "row" | "col";
  spacing?: "xs" | "sm" | "md" | "lg" | "xl";
  responsive?: boolean;
}

const spacingMap = {
  xs: "space-y-2",
  sm: "space-y-3",
  md: "space-y-4",
  lg: "space-y-6",
  xl: "space-y-8",
};

const spacingRowMap = {
  xs: "space-x-2",
  sm: "space-x-3",
  md: "space-x-4",
  lg: "space-x-6",
  xl: "space-x-8",
};

/**
 * Адаптивный стек для расположения элементов
 */
export function ResponsiveStack({
  children,
  className,
  direction = "col",
  spacing = "md",
  responsive = false,
}: ResponsiveStackProps) {
  const baseClasses = cn(
    "flex",
    direction === "col" ? "flex-col" : "flex-row",
    responsive && direction === "row" && "flex-col sm:flex-row",
    direction === "col"
      ? spacingMap[spacing as keyof typeof spacingMap]
      : spacingRowMap[spacing as keyof typeof spacingRowMap],
    className
  );

  return <div className={baseClasses}>{children}</div>;
}

interface ResponsiveHiddenProps {
  children: ReactNode;
  hideOn?: ("xs" | "sm" | "md" | "lg" | "xl")[];
  showOn?: ("xs" | "sm" | "md" | "lg" | "xl")[];
}

/**
 * Компонент для скрытия элементов на определённых размерах экранов
 */
export function ResponsiveHidden({
  children,
  hideOn = [],
  showOn = [],
}: ResponsiveHiddenProps) {
  const hideClasses = hideOn.map(size => {
    const sizeMap: Record<string, string> = {
      xs: "hidden",
      sm: "sm:hidden",
      md: "md:hidden",
      lg: "lg:hidden",
      xl: "xl:hidden",
    };
    return sizeMap[size];
  });

  const showClasses = showOn.map(size => {
    const sizeMap: Record<string, string> = {
      xs: "hidden",
      sm: "hidden sm:block",
      md: "hidden md:block",
      lg: "hidden lg:block",
      xl: "hidden xl:block",
    };
    return sizeMap[size];
  });

  const classes = cn(...hideClasses, ...showClasses);

  return <div className={classes}>{children}</div>;
}
