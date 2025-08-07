import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import LineChart from "@/components/charts/line-chart";
import BarChart from "@/components/charts/bar-chart";
import { chartColors } from "@/lib/chartColors";
import { Globe, Flame, Users, TrendingUp } from "lucide-react";

export default function Market() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "未授权",
        description: "您已登出，正在重新登录...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, toast]);

  const { data: marketData = [], isLoading: marketLoading } = useQuery<any[]>({
    queryKey: ["/api/market"],
  });

  const { data: marketStats = {} } = useQuery<any>({
    queryKey: ["/api/market/statistics"],
  });

  const marketTrendData = {
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    datasets: [
      {
        label: '市场指数',
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        borderColor: chartColors.primary.blue,
        backgroundColor: chartColors.gradients.blueGradient,
      },
    ],
  };

  const competitorData = {
    labels: ['竞争对手A', '竞争对手B', '竞争对手C', '竞争对手D', '竞争对手E'],
    datasets: [
      {
        label: '市场份额 (%)',
        data: [25, 20, 18, 15, 12],
        backgroundColor: chartColors.getPieColors(5),
      },
    ],
  };

  const hotProducts = [
    { name: '智能手机', share: 32, color: 'primary' },
    { name: '蓝牙耳机', share: 28, color: 'success' },
    { name: '智能手表', share: 25, color: 'info' },
    { name: '其他', share: 15, color: 'warning' },
  ];

  const consumerPreferences = [
    { name: '价格敏感度', value: 75, color: 'destructive' },
    { name: '品质要求', value: 60, color: 'warning' },
    { name: '品牌忠诚度', value: 40, color: 'success' },
  ];

  if (marketLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header title="市场分析" breadcrumb="市场分析" />
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">市场分析</h2>
            <p className="text-neutral-600 mt-2">实时市场趋势分析和竞争情报</p>
          </div>
          
          {/* Market Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-600">市场总量</h3>
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-neutral-800" data-testid="text-market-volume">¥2.58M</p>
                <p className="text-xs text-success mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +8.2%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-600">竞争强度</h3>
                  <Flame className="h-5 w-5 text-warning" />
                </div>
                <p className="text-2xl font-bold text-neutral-800" data-testid="text-competition-level">高</p>
                <p className="text-xs text-warning mt-1">15家主要竞争对手</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-600">消费者活跃度</h3>
                  <Users className="h-5 w-5 text-info" />
                </div>
                <p className="text-2xl font-bold text-neutral-800" data-testid="text-consumer-activity">85%</p>
                <p className="text-xs text-info mt-1">购买意愿强烈</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-600">价格趋势</h3>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <p className="text-2xl font-bold text-neutral-800" data-testid="text-price-trend">稳定</p>
                <p className="text-xs text-success mt-1">预计上涨3%</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Market Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>市场趋势分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <LineChart data={marketTrendData} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>竞争对手分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <BarChart data={competitorData} />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Market Intelligence */}
          <Card>
            <CardHeader>
              <CardTitle>市场情报</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-neutral-800 mb-3">热门产品类别</h4>
                  <div className="space-y-3">
                    {hotProducts.map((product, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        data-testid={`product-${product.name}`}
                      >
                        <div className="flex items-center">
                          <div className={`w-2 h-2 bg-${product.color} rounded-full mr-3`}></div>
                          <span className="font-medium text-neutral-800">{product.name}</span>
                        </div>
                        <span className="text-sm text-neutral-600">市场占比 {product.share}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-neutral-800 mb-3">消费者偏好</h4>
                  <div className="space-y-3">
                    {consumerPreferences.map((preference, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg"
                        data-testid={`preference-${preference.name}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-neutral-800">{preference.name}</span>
                          <span className="text-sm text-neutral-600">
                            {preference.value > 70 ? '高' : preference.value > 50 ? '中等' : '低'}
                          </span>
                        </div>
                        <Progress value={preference.value} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
