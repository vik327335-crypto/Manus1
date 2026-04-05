import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <Card className={`p-12 text-center bg-card border-border ${className}`}>
      {icon && <div className="mb-4 flex justify-center text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && <p className="text-muted-foreground mb-6">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="bg-blue-600 hover:bg-blue-700 text-white">
          {action.label}
        </Button>
      )}
    </Card>
  );
}
