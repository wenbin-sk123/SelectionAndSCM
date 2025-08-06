import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth.tsx";
import { Button } from "@/components/ui/button";
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
  LogOut,
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

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

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
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center p-2 rounded-md transition-colors",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-neutral-700 hover:bg-gray-100"
                    )}
                    data-testid={`nav-${item.name}`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gray-100 p-3 rounded-md">
          <div className="flex items-center mb-2">
            <img
              src={user?.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
              alt="用户头像"
              className="w-10 h-10 rounded-full object-cover mr-3"
              data-testid="img-user-avatar"
            />
            <div>
              <p className="font-medium text-neutral-800" data-testid="text-user-name">
                {user?.name || user?.email?.split('@')[0] || user?.phone || "用户"}
              </p>
              <p className="text-xs text-neutral-600" data-testid="text-student-id">
                学号: {user?.studentId || "N/A"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-neutral-600 hover:text-primary w-full justify-start p-0"
            data-testid="button-logout"
          >
            <LogOut className="h-3 w-3 mr-1" />
            退出登录
          </Button>
        </div>
      </div>
    </nav>
  );
}
