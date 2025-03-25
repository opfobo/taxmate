
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  title: string;
  subtitle: string;
  timestamp: string;
  status?: string;
  amount?: string;
  className?: string;
}

const ActivityItem = ({ 
  title, 
  subtitle, 
  timestamp, 
  status, 
  amount,
  className 
}: ActivityItemProps) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped": return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "canceled": return "bg-red-100 text-red-800 border-red-200";
      case "success": return "bg-green-100 text-green-800 border-green-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className={cn("flex items-center gap-4 py-3", className)}>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {status && (
          <Badge 
            variant="outline" 
            className={cn("text-xs px-2 py-0.5", getStatusColor(status))}
          >
            {status}
          </Badge>
        )}
        {amount && (
          <span className="text-sm font-medium">{amount}</span>
        )}
        <span className="text-xs text-muted-foreground">
          {formatDate(timestamp)}
        </span>
      </div>
    </div>
  );
};

export default ActivityItem;
