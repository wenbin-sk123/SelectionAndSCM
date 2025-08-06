import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Camera, Lock } from "lucide-react";

const profileFormSchema = z.object({
  name: z.string().min(2, "姓名至少需要2个字符").max(50, "姓名不能超过50个字符"),
  studentId: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "密码至少需要6个字符"),
  newPassword: z.string().min(6, "新密码至少需要6个字符"),
  confirmPassword: z.string().min(6, "请确认新密码"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const { user, updateProfileMutation, changePasswordMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      studentId: user?.studentId || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        studentId: user.studentId || "",
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = (values: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(values);
  };

  const onPasswordSubmit = (values: z.infer<typeof passwordFormSchema>) => {
    changePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    passwordForm.reset();
    setActiveTab("profile");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>个人信息</DialogTitle>
          <DialogDescription>
            查看和编辑您的个人信息
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">基本信息</TabsTrigger>
            <TabsTrigger value="password">修改密码</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage 
                    src={user?.avatarUrl || ""} 
                    alt={user?.name || "用户"} 
                  />
                  <AvatarFallback>
                    <User className="w-12 h-12" />
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8"
                  disabled
                  title="头像上传功能即将开放"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>姓名</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入姓名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>学号</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入学号" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium">邮箱</span>
                    <span className="text-sm text-muted-foreground">
                      {user?.email || "未设置"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium">手机号</span>
                    <span className="text-sm text-muted-foreground">
                      {user?.phone || "未设置"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium">角色</span>
                    <span className="text-sm text-muted-foreground">
                      {user?.role === "teacher" ? "教师" : user?.role === "admin" ? "管理员" : "学生"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "保存中..." : "保存"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>当前密码</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="请输入当前密码" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>新密码</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="请输入新密码" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>确认新密码</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="请再次输入新密码" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      passwordForm.reset();
                      setActiveTab("profile");
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? "修改中..." : "修改密码"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}