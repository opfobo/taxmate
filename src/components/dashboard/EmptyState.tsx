
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description,
  className 
}: EmptyStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
      {Icon && <Icon className="h-10 w-10 text-muted-foreground mb-2 opacity-40" />}
      <h3 className="text-sm font-medium">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
      )}
    </div>
  );
};

export default EmptyState;
