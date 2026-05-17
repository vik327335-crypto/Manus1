import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EnhancedTooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  className?: string;
}

/**
 * Улучшенный компонент Tooltip с поддержкой разных позиций
 */
export function EnhancedTooltip({
  children,
  content,
  side = "top",
  align = "center",
  delayDuration = 200,
  className,
}: EnhancedTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn("max-w-xs", className)}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface TooltipIconProps {
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

/**
 * Компонент для отображения иконки справки с подсказкой
 */
export function TooltipIcon({ content, side = "top", align = "center" }: TooltipIconProps) {
  return (
    <EnhancedTooltip content={content} side={side} align={align}>
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs font-semibold cursor-help hover:bg-accent hover:text-accent-foreground transition-colors">
        ?
      </span>
    </EnhancedTooltip>
  );
}

interface TooltipLabelProps {
  label: string;
  tooltip: ReactNode;
  required?: boolean;
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Компонент для отображения label с подсказкой
 */
export function TooltipLabel({
  label,
  tooltip,
  required = false,
  side = "top",
}: TooltipLabelProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      <TooltipIcon content={tooltip} side={side} />
    </div>
  );
}

interface TooltipHelpProps {
  children: ReactNode;
  help: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Компонент для отображения элемента с подсказкой справки
 */
export function TooltipHelp({
  children,
  help,
  side = "top",
}: TooltipHelpProps) {
  return (
    <EnhancedTooltip content={help} side={side}>
      <span className="cursor-help border-b border-dotted border-muted-foreground hover:border-foreground transition-colors">
        {children}
      </span>
    </EnhancedTooltip>
  );
}

interface TooltipButtonProps {
  label: string;
  tooltip: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Компонент для отображения кнопки с подсказкой
 */
export function TooltipButton({
  label,
  tooltip,
  onClick,
  disabled = false,
  side = "top",
}: TooltipButtonProps) {
  return (
    <EnhancedTooltip content={tooltip} side={side}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {label}
      </button>
    </EnhancedTooltip>
  );
}
