import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import KPICard from "@/components/kpi-card";
import ActivityItem from "@/components/activity-item";
import LineChart from "@/components/charts/line-chart";
import PieChart from "@/components/charts/pie-chart";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "未授权",
        description: "您已退出登录，正在重新登录...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["/api/dashboard/kpis"],
    queryParams: { taskId: "default" },
    enabled: isAuthenticated,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "未授权",
          description: "您已退出登录，正在重新登录...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
    },
  });

  const financeData = {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    datasets: [
      {
        label: '收入',
        data: [12000, 15000, 18000, 22000, 28000, 32000],
        borderColor: 'hsl(var(--success))',
        backgroundColor: 'hsl(var(--success) / 0.1)',
      },
      {
        label: '支出',
        data: [8000, 9500, 11000, 13000, 16000, 18000],
        borderColor: 'hsl(var(--destructive))',
        backgroundColor: 'hsl(var(--destructive) / 0.1)',
      },
      {
        label: '利润',
        data: [4000, 5500, 7000, 9000, 12000, 14000],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
      },
    ],
  };

  const marketData = {
    labels: ['智能手机', '蓝牙耳机', '智能手表', '其他'],
    datasets: [
      {
        data: [35, 28, 25, 12],
        backgroundColor: [
          'hsl(var(--primary))',
          'hsl(var(--success))',
          'hsl(var(--info))',
          'hsl(var(--warning))',
        ],
      },
    ],
  };

  const recentActivities = [
    {
      icon: "shopping-cart",
      title: "完成采购订单 #P2024001",
      description: "向供应商ABC公司采购手机配件，金额：¥8,500",
      timestamp: "2分钟前",
      type: "primary" as const,
    },
    {
      icon: "chart-line",
      title: "市场分析报告已生成",
      description: "智能手机市场趋势分析完成，建议查看",
      timestamp: "15分钟前",
      type: "success" as const,
    },
    {
      icon: "alert-triangle",
      title: "库存预警提醒",
      description: "蓝牙耳机库存不足，当前剩余15件",
      timestamp: "1小时前",
      type: "warning" as const,
    },
  ];

  if (isLoading || kpisLoading) {
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
        <Header title="仪表板" breadcrumb="仪表板" />
        
        <div className="p-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="当前资金"
              value={`¥${kpis?.currentBalance?.toLocaleString() || '85,200'}`}
              change="+5.2%"
              changeType="positive"
              icon="wallet"
              color="primary"
              testId="kpi-balance"
            />
            
            <KPICard
              title="总利润"
              value={`¥${kpis?.totalProfit?.toLocaleString() || '12,850'}`}
              change="+12.5%"
              changeType="positive"
              icon="chart-line"
              color="success"
              testId="kpi-profit"
            />
            
            <KPICard
              title="库存价值"
              value={`¥${kpis?.inventoryValue?.toLocaleString() || '45,600'}`}
              change="-2.1%"
              changeType="negative"
              icon="boxes"
              color="info"
              testId="kpi-inventory"
            />
            
            <KPICard
              title="任务进度"
              value={`${Math.round(kpis?.taskProgress || 75)}%`}
              change="第8天 / 共15天"
              changeType="neutral"
              icon="tasks"
              color="warning"
              testId="kpi-progress"
            />
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">财务趋势</h3>
              <div className="h-64">
                <LineChart data={financeData} />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">市场表现</h3>
              <div className="h-64">
                <PieChart data={marketData} />
              </div>
            </div>
          </div>
          
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">最近活动</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <ActivityItem
                  key={index}
                  icon={activity.icon}
                  title={activity.title}
                  description={activity.description}
                  timestamp={activity.timestamp}
                  type={activity.type}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
