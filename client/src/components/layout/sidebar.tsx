import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth.tsx";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  BarChart3,
  GraduationCap,
} from "lucide-react";

const navigation = [
  { name: "仪表板", href: "/", icon: LayoutDashboard },
  { name: "实训任务", href: "/tasks", icon: ClipboardList },
  { name: "市场分析", href: "/market", icon: TrendingUp },
  { name: "采购管理", href: "/procurement", icon: ShoppingCart },
  { name: "库存管理", href: "/inventory", icon: Package },
  { name: "财务分析", href: "/finance", icon: DollarSign },
  { name: "报表中心", href: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const getRoleText = (role: string) => {
    switch (role) {
      case "teacher":
        return "教师用户";
      case "admin":
        return "管理员";
      default:
        return "学生用户";
    }
  };

  return (
    <nav className="bg-white shadow-lg w-64 min-h-screen flex-shrink-0" data-testid="sidebar">
      <div className="p-4 border-b">
        <div className="flex items-center">
          <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center mr-3">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-neutral-800">实训平台</h2>
            <p className="text-xs text-neutral-600" data-testid="text-user-role">
              {getRoleText(user?.role || "student")}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center p-2 rounded-md transition-colors block",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-neutral-700 hover:bg-gray-100"
                  )}
                  data-testid={`nav-${item.name}`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>


    </nav>
  );
}
