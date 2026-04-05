import { ReactNode } from "react";
import { HelpCircle } from "lucide-react";

interface TooltipProps {
  content: string;
  children?: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = "top",
  className = "",
}: TooltipProps) {
  const positionClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  };

  return (
    <div className={`relative inline-block group ${className}`}>
      {children || <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />}
      <div
        className={`
          absolute ${positionClasses[position]} left-1/2 -translate-x-1/2
          hidden group-hover:block
          px-2 py-1 bg-slate-900 dark:bg-slate-100
          text-white dark:text-slate-900
          text-xs rounded whitespace-nowrap
          z-50 pointer-events-none
          shadow-lg
        `}
      >
        {content}
        <div
          className={`
            absolute w-0 h-0
            ${
              position === "top"
                ? "top-full border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900 dark:border-t-slate-100 left-1/2 -translate-x-1/2"
                : position === "bottom"
                  ? "bottom-full border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-slate-900 dark:border-b-slate-100 left-1/2 -translate-x-1/2"
                  : position === "left"
                    ? "left-full border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-slate-900 dark:border-l-slate-100 top-1/2 -translate-y-1/2"
                    : "right-full border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-slate-900 dark:border-r-slate-100 top-1/2 -translate-y-1/2"
            }
          `}
        />
      </div>
    </div>
  );
}
