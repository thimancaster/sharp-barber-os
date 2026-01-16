import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconBgClass?: string;
}

export function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconBgClass = "bg-primary/10",
}: KPICardProps) {
  return (
    <div className="card-elevated rounded-xl p-6 transition-all duration-300 hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="font-serif text-3xl font-semibold text-foreground">{value}</p>
          {change && (
            <p
              className={cn(
                "text-sm font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn("rounded-lg p-3", iconBgClass)}>
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
