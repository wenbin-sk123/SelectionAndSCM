import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth.tsx";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Upload, User, Lock, Mail, Phone } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UploadResult } from "@uppy/core";
import { Redirect } from "wouter";

const profileSchema = z.object({
  name: z.string().min(2, "姓名至少2个字符"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "密码至少6位"),
  newPassword: z.string().min(6, "新密码至少6位"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次密码输入不一致",
  path: ["confirmPassword"],
});

export default function ProfilePage() {
  const { user, isLoading, updateProfileMutation, changePasswordMutation } = useAuth();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
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
      });
      setAvatarUrl(user.avatarUrl || null);
    }
  }, [user, profileForm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const onUpdateProfile = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const onChangePassword = (data: z.infer<typeof passwordSchema>) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    }, {
      onSuccess: () => {
        passwordForm.reset();
      },
    });
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleAvatarUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      
      // Update avatar on server
      const response = await apiRequest("PUT", "/api/avatar", {
        avatarURL: uploadURL,
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.objectPath);
        toast({
          title: "头像上传成功",
          description: "您的头像已更新",
        });
      } else {
        toast({
          title: "头像上传失败",
          description: "请重试",
          variant: "destructive",
        });
      }
    }
  };

  const getUserInitials = () => {
    if (user.name) {
      return user.name.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "用户";
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-profile-title">个人中心</h1>
        <p className="text-muted-foreground">管理您的账户信息和偏好设置</p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>头像</CardTitle>
          <CardDescription>上传您的个人头像</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={avatarUrl || undefined} 
                alt={user.name || "用户头像"}
                data-testid="img-avatar"
              />
              <AvatarFallback className="text-lg">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5 * 1024 * 1024} // 5MB
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleAvatarUploadComplete}
                buttonClassName="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                <span>上传新头像</span>
              </ObjectUploader>
              <p className="text-sm text-muted-foreground">
                支持 JPG, PNG 格式，最大 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>更新您的个人信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>姓名</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="请输入您的姓名"
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>邮箱</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm" data-testid="text-email">
                      {user.email || "未设置"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>手机号</Label>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm" data-testid="text-phone">
                      {user.phone || "未设置"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>角色</Label>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm" data-testid="text-role">
                      {user.role === "teacher" ? "教师" : user.role === "admin" ? "管理员" : "学生"}
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
                data-testid="button-update-profile"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存更改"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
          <CardDescription>定期更新密码以保护账户安全</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>当前密码</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password"
                        data-testid="input-current-password"
                      />
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
                      <Input 
                        {...field} 
                        type="password"
                        data-testid="input-new-password"
                      />
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
                      <Input 
                        {...field} 
                        type="password"
                        data-testid="input-confirm-new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={changePasswordMutation.isPending}
                data-testid="button-change-password"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    修改中...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    修改密码
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}