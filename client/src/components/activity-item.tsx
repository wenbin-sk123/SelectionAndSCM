import { ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";

interface ActivityItemProps {
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  type: "primary" | "success" | "warning";
}

export default function ActivityItem({
  icon,
  title,
  description,
  timestamp,
  type,
}: ActivityItemProps) {
  const getIcon = () => {
    switch (icon) {
      case "shopping-cart":
        return <ShoppingCart className="h-4 w-4" />;
      case "chart-line":
        return <TrendingUp className="h-4 w-4" />;
      case "alert-triangle":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "primary":
        return "bg-primary text-white";
      case "success":
        return "bg-success text-white";
      case "warning":
        return "bg-warning text-white";
      default:
        return "bg-primary text-white";
    }
  };

  return (
    <div className="flex items-center p-3 bg-gray-50 rounded-lg" data-testid={`activity-${type}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm ${getIconColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="font-medium text-neutral-800">{title}</p>
        <p className="text-sm text-neutral-600">{description}</p>
      </div>
      <span className="text-xs text-neutral-500" data-testid="text-timestamp">{timestamp}</span>
    </div>
  );
}
