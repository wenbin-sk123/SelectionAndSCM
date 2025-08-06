import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Wallet, ChartLine, Package, ListTodo } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: "wallet" | "chart-line" | "boxes" | "tasks";
  color: "primary" | "success" | "info" | "warning";
  testId?: string;
}

export default function KPICard({
  title,
  value,
  change,
  changeType,
  icon,
  color,
  testId,
}: KPICardProps) {
  const getIcon = () => {
    switch (icon) {
      case "wallet":
        return <Wallet className="h-6 w-6" />;
      case "chart-line":
        return <ChartLine className="h-6 w-6" />;
      case "boxes":
        return <Package className="h-6 w-6" />;
      case "tasks":
        return <ListTodo className="h-6 w-6" />;
      default:
        return <Wallet className="h-6 w-6" />;
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case "positive":
        return <TrendingUp className="h-3 w-3 mr-1" />;
      case "negative":
        return <TrendingDown className="h-3 w-3 mr-1" />;
      case "neutral":
        return <Minus className="h-3 w-3 mr-1" />;
      default:
        return <TrendingUp className="h-3 w-3 mr-1" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-success";
      case "negative":
        return "text-destructive";
      case "neutral":
        return "text-neutral-600";
      default:
        return "text-success";
    }
  };

  const getBorderColor = () => {
    switch (color) {
      case "primary":
        return "border-l-primary";
      case "success":
        return "border-l-success";
      case "info":
        return "border-l-info";
      case "warning":
        return "border-l-warning";
      default:
        return "border-l-primary";
    }
  };

  const getIconColor = () => {
    switch (color) {
      case "primary":
        return "text-primary bg-primary/10";
      case "success":
        return "text-success bg-success/10";
      case "info":
        return "text-info bg-info/10";
      case "warning":
        return "text-warning bg-warning/10";
      default:
        return "text-primary bg-primary/10";
    }
  };

  return (
    <Card className={`border-l-4 ${getBorderColor()}`} data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-neutral-600 text-sm">{title}</p>
            <p className="text-2xl font-bold text-neutral-800 font-mono">{value}</p>
            <p className={`text-xs mt-1 ${getChangeColor()}`}>
              {getChangeIcon()}
              {change}
            </p>
          </div>
          <div className={`p-3 rounded-full ${getIconColor()}`}>
            {getIcon()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
