import { cn } from "@/lib/utils";

interface ScoreIndicatorProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

export function ScoreIndicator({ score, label, size = "md" }: ScoreIndicatorProps) {
  const getScoreClass = (score: number) => {
    if (score >= 80) return "score-excellent";
    if (score >= 65) return "score-good";
    if (score >= 50) return "score-fair";
    return "score-poor";
  };

  const sizeClasses = {
    sm: "w-12 h-12 text-xs",
    md: "w-16 h-16 text-sm",
    lg: "w-20 h-20 text-base",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-bold transition-transform hover:scale-105",
          getScoreClass(score),
          sizeClasses[size]
        )}
      >
        {score}
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
