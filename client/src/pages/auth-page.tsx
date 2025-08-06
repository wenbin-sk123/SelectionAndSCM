import { useState } from "react";
import { useAuth } from "@/hooks/useAuth.tsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ShoppingCart, TrendingUp, Package, Users } from "lucide-react";
import { Redirect } from "wouter";

const loginSchema = z.object({
  loginType: z.enum(["email", "phone"]),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(6, "密码至少6位"),
}).superRefine((data, ctx) => {
  if (data.loginType === "email") {
    if (!data.email || data.email.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "请输入邮箱地址",
        path: ["email"],
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "请输入有效的邮箱地址",
        path: ["email"],
      });
    }
  }
  
  if (data.loginType === "phone") {
    if (!data.phone || data.phone.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "请输入手机号",
        path: ["phone"],
      });
    } else if (!/^1[3-9]\d{9}$/.test(data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "请输入有效的手机号",
        path: ["phone"],
      });
    }
  }
});

const registerSchema = z.object({
  name: z.string().min(2, "姓名至少2个字符"),
  email: z.string().email("请输入有效的邮箱地址").optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号").optional(),
  password: z.string().min(6, "密码至少6位"),
  confirmPassword: z.string(),
  role: z.enum(["student", "teacher"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次密码输入不一致",
  path: ["confirmPassword"],
}).refine((data) => data.email || data.phone, {
  message: "请至少提供邮箱或手机号",
});

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginType: "email" as const,
      email: "",
      phone: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "student" as const,
    },
  });

  // Redirect if already logged in
  if (!isLoading && user) {
    return <Redirect to="/" />;
  }

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    console.log("Login form submitted with data:", data);
    const credentials = data.loginType === "email" 
      ? { email: data.email, password: data.password }
      : { phone: data.phone, password: data.password };
    console.log("Sending credentials:", credentials);
    loginMutation.mutate(credentials);
  };

  const onRegister = (data: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">电商实训平台</h1>
            <p className="text-muted-foreground">
              掌握电商选品与供应链管理的实战技能
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">登录</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>欢迎回来</CardTitle>
                  <CardDescription>
                    使用您的邮箱或手机号登录
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="loginType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>登录方式</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Clear the other field when switching login type
                                if (value === "email") {
                                  loginForm.setValue("phone", "");
                                } else {
                                  loginForm.setValue("email", "");
                                }
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-login-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="email" data-testid="option-email">邮箱</SelectItem>
                                <SelectItem value="phone" data-testid="option-phone">手机号</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {loginForm.watch("loginType") === "email" ? (
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>邮箱</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="email" 
                                  placeholder="your@email.com"
                                  data-testid="input-email-login"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={loginForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>手机号</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="13800138000"
                                  data-testid="input-phone-login"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>密码</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password"
                                data-testid="input-password-login"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loginMutation.isPending}
                        data-testid="button-login"
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            登录中...
                          </>
                        ) : (
                          "登录"
                        )}
                      </Button>
                      {/* Debug info */}
                      {Object.keys(loginForm.formState.errors).length > 0 && (
                        <div className="text-red-500 text-sm">
                          {JSON.stringify(loginForm.formState.errors)}
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>创建账户</CardTitle>
                  <CardDescription>
                    填写信息开始您的学习之旅
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>姓名</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="请输入您的姓名"
                                data-testid="input-name-register"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>邮箱（选填）</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email" 
                                placeholder="your@email.com"
                                data-testid="input-email-register"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>手机号（选填）</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="13800138000"
                                data-testid="input-phone-register"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>角色</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-role">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="student" data-testid="option-student">学生</SelectItem>
                                <SelectItem value="teacher" data-testid="option-teacher">教师</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>密码</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password"
                                data-testid="input-password-register"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>确认密码</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password"
                                data-testid="input-confirm-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation.isPending}
                        data-testid="button-register"
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            注册中...
                          </>
                        ) : (
                          "注册"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-primary/5">
        <div className="max-w-lg space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              全方位电商实训解决方案
            </h2>
            <p className="text-lg text-muted-foreground">
              通过真实场景模拟，掌握从市场调研到供应链管理的完整电商运营流程
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-primary/10 rounded-lg">
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">选品策略</h3>
              <p className="text-sm text-muted-foreground">
                学习市场分析与产品选择
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">数据分析</h3>
              <p className="text-sm text-muted-foreground">
                掌握销售数据分析技巧
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">库存管理</h3>
              <p className="text-sm text-muted-foreground">
                优化库存与物流策略
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">供应商谈判</h3>
              <p className="text-sm text-muted-foreground">
                提升商务谈判能力
              </p>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">为什么选择我们？</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ 真实商业场景模拟</li>
              <li>✓ AI辅助智能谈判系统</li>
              <li>✓ 多维度绩效评估体系</li>
              <li>✓ 个性化学习路径规划</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}