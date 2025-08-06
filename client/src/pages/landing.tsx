import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-info/5">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">电商实训平台</h1>
            <p className="text-neutral-600">选品与供应链管理实训系统</p>
          </div>
          
          <Button 
            onClick={handleLogin}
            className="w-full bg-primary text-white hover:bg-primary/90"
            data-testid="button-login"
          >
            登录系统
          </Button>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              体验完整的电商供应链管理流程
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
