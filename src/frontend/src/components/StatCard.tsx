import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variant?: "pink" | "purple" | "gold" | "success";
  subtitle?: string;
  isLoading?: boolean;
}

const variantStyles = {
  pink: "stat-card-pink",
  purple: "stat-card-purple",
  gold: "stat-card-gold",
  success: "stat-card-success",
};

const iconColors = {
  pink: "oklch(0.58 0.24 340)",
  purple: "oklch(0.75 0.18 298)",
  gold: "oklch(0.88 0.18 86)",
  success: "oklch(0.72 0.22 145)",
};

export function StatCard({
  title,
  value,
  icon,
  variant = "pink",
  subtitle,
  isLoading,
}: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <span style={{ color: iconColors[variant] }}>{icon}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-24 mb-1" />
      ) : (
        <div
          className="text-2xl font-bold tabular-nums"
          style={{ color: iconColors[variant] }}
        >
          {value}
        </div>
      )}
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      )}
    </div>
  );
}
