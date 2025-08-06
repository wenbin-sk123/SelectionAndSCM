import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  updateProfileMutation: UseMutationResult<SelectUser, Error, UpdateProfileData>;
  changePasswordMutation: UseMutationResult<void, Error, ChangePasswordData>;
};

type LoginData = {
  email?: string;
  phone?: string;
  password: string;
};

type UpdateProfileData = {
  name?: string;
  avatarUrl?: string;
};

type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 401) {
            return null;
          }
          throw new Error(`Failed to fetch user: ${res.status}`);
        }
        return await res.json();
      } catch (error) {
        console.error("Auth check error:", error);
        return null;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "登录失败");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "登录成功",
        description: "欢迎回来！",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "登录失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "注册失败");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "注册成功",
        description: "欢迎加入！",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "注册失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      toast({
        title: "已退出登录",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "退出失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: UpdateProfileData) => {
      const res = await apiRequest("PUT", "/api/auth/user", updates);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "更新失败");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "个人信息已更新",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const res = await apiRequest("PUT", "/api/auth/password", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "密码修改失败");
      }
    },
    onSuccess: () => {
      toast({
        title: "密码修改成功",
        description: "请使用新密码登录",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "密码修改失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateProfileMutation,
        changePasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}