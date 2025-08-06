import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";

interface InventoryAlert {
  id: string;
  type: "shortage" | "expiry" | "trend";
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

interface InventoryAlertProps {
  alert: InventoryAlert;
  testId?: string;
}

export default function InventoryAlert({ alert, testId }: InventoryAlertProps) {
  const getIcon = () => {
    switch (alert.type) {
      case "shortage":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "expiry":
        return <Clock className="h-5 w-5 text-warning" />;
      case "trend":
        return <TrendingUp className="h-5 w-5 text-info" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
    }
  };

  const getBorderColor = () => {
    switch (alert.type) {
      case "shortage":
        return "border-destructive/30 bg-destructive/5";
      case "expiry":
        return "border-warning/30 bg-warning/5";
      case "trend":
        return "border-info/30 bg-info/5";
      default:
        return "border-destructive/30 bg-destructive/5";
    }
  };

  const getButtonColor = () => {
    switch (alert.type) {
      case "shortage":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "expiry":
        return "bg-warning text-warning-foreground hover:bg-warning/90";
      case "trend":
        return "bg-info text-info-foreground hover:bg-info/90";
      default:
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
    }
  };

  const getButtonText = () => {
    switch (alert.type) {
      case "shortage":
        return "补货";
      case "expiry":
        return "处理";
      case "trend":
        return "查看";
      default:
        return "处理";
    }
  };

  return (
    <div
      className={`flex items-center p-3 border rounded-lg ${getBorderColor()}`}
      data-testid={testId}
    >
      {getIcon()}
      <div className="flex-1 ml-3">
        <h4 className="font-medium text-neutral-800" data-testid="text-alert-title">{alert.title}</h4>
        <p className="text-sm text-neutral-600" data-testid="text-alert-description">{alert.description}</p>
      </div>
      <Button
        size="sm"
        className={getButtonColor()}
        data-testid="button-alert-action"
      >
        {getButtonText()}
      </Button>
    </div>
  );
}
