
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  loading?: boolean;
  className?: string;
}

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  loading = false,
  className 
}: StatCardProps) => {
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="h-5 w-1/3 animate-pulse bg-muted rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-2/3 animate-pulse bg-muted rounded-md" />
          {description && (
            <div className="h-4 w-1/2 mt-2 animate-pulse bg-muted rounded-md" />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
      {trend && (
        <div className="bg-muted/50 px-4 py-2 border-t">
          <div 
            className={cn(
              "text-xs font-medium",
              trend.positive ? "text-green-500" : "text-red-500"
            )}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}% {trend.label}
          </div>
        </div>
      )}
    </Card>
  );
};

export default StatCard;
