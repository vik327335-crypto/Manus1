import { ReactNode } from "react";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "main" | "article";
}

export function ResponsiveContainer({
  children,
  className = "",
  as: Component = "div",
}: ResponsiveContainerProps) {
  return (
    <Component
      className={`
        w-full
        px-4 sm:px-6 lg:px-8
        py-4 sm:py-6 lg:py-8
        mx-auto max-w-7xl
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: "small" | "medium" | "large";
  className?: string;
}

const gapClasses = {
  small: "gap-2 sm:gap-3 lg:gap-4",
  medium: "gap-4 sm:gap-6 lg:gap-8",
  large: "gap-6 sm:gap-8 lg:gap-12",
};

export function ResponsiveGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "medium",
  className = "",
}: ResponsiveGridProps) {
  const gridColsClass = `
    grid-cols-${columns.mobile}
    sm:grid-cols-${columns.tablet}
    lg:grid-cols-${columns.desktop}
  `;

  return (
    <div className={`grid ${gridColsClass} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}
