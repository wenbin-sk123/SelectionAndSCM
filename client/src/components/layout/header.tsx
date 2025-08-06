import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Settings } from "lucide-react";

interface HeaderProps {
  title: string;
  breadcrumb: string;
}

export default function Header({ title, breadcrumb }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b p-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800" data-testid="text-page-title">
            {title}
          </h1>
          <nav className="text-sm text-neutral-600 mt-1" data-testid="breadcrumb">
            <span>首页</span> / <span>{breadcrumb}</span>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 text-neutral-600 hover:text-primary"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center"
              data-testid="badge-notification-count"
            >
              3
            </Badge>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-neutral-600 hover:text-primary"
            data-testid="button-settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
