import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { UserProfileDialog } from "@/components/user-profile-dialog";
import { Bell, Settings, User, LogOut, ChevronDown, Mail, Phone, CreditCard } from "lucide-react";

interface HeaderProps {
  title: string;
  breadcrumb: string;
}

export default function Header({ title, breadcrumb }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name?: string | null, email?: string | null, phone?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    if (phone) {
      return phone.slice(-2);
    }
    return "U";
  };

  return (
    <>
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100"
                  data-testid="button-user-menu"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={user?.avatarUrl || ""} 
                      alt={user?.name || "用户"} 
                    />
                    <AvatarFallback className="bg-primary text-white text-sm">
                      {getInitials(user?.name, user?.email, user?.phone)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium text-neutral-800" data-testid="text-user-name">
                      {user?.name || user?.email?.split('@')[0] || user?.phone || "用户"}
                    </p>
                    <p className="text-xs text-neutral-600" data-testid="text-user-role">
                      {user?.role === "teacher" ? "教师用户" : user?.role === "admin" ? "管理员" : "学生用户"}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-neutral-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || user?.email?.split('@')[0] || user?.phone || "用户"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.role === "teacher" ? "教师用户" : user?.role === "admin" ? "管理员" : "学生用户"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {user?.studentId && (
                  <DropdownMenuItem disabled>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>学号: {user.studentId}</span>
                  </DropdownMenuItem>
                )}
                
                {user?.email && (
                  <DropdownMenuItem disabled>
                    <Mail className="mr-2 h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </DropdownMenuItem>
                )}
                
                {user?.phone && (
                  <DropdownMenuItem disabled>
                    <Phone className="mr-2 h-4 w-4" />
                    <span>{user.phone}</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>个人信息</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>账号设置</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      <UserProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
      />
    </>
  );
}
