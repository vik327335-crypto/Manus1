import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ErrorMessageProps {
  title: string;
  message: string;
  details?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  details,
  onDismiss,
  onRetry,
  className = "",
}: ErrorMessageProps) {
  return (
    <Card className={`p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 ${className}`}>
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-red-900 dark:text-red-100">{title}</h3>
          <p className="text-sm text-red-800 dark:text-red-200 mt-1">{message}</p>
          {details && (
            <p className="text-xs text-red-700 dark:text-red-300 mt-2 font-mono bg-red-100 dark:bg-red-900 p-2 rounded">
              {details}
            </p>
          )}
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <Button
                  size="sm"
                  onClick={onRetry}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Retry
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" variant="outline" onClick={onDismiss}>
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </Card>
  );
}
