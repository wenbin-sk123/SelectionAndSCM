import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import LineChart from "@/components/charts/line-chart";
import PieChart from "@/components/charts/pie-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, PieChart as PieChartIcon, Download } from "lucide-react";

export default function Finance() {
  const { toast } = useToast();

  const { data: financialRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ["/api/financial"],
    queryParams: { taskId: "default" },
    
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

  const revenueData = {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    datasets: [
      {
        label: '收入',
        data: [12000, 15000, 18000, 22000, 28000, 32000],
        borderColor: 'hsl(var(--success))',
        backgroundColor: 'hsl(var(--success) / 0.1)',
      },
      {
        label: '成本',
        data: [8000, 9500, 11000, 13000, 16000, 18000],
        borderColor: 'hsl(var(--destructive))',
        backgroundColor: 'hsl(var(--destructive) / 0.1)',
      },
    ],
  };

  const profitData = {
    labels: ['采购成本', '运营成本', '人员成本', '其他费用'],
    datasets: [
      {
        data: [66, 19, 12, 3],
        backgroundColor: [
          'hsl(var(--primary))',
          'hsl(var(--success))',
          'hsl(var(--warning))',
          'hsl(var(--info))',
        ],
      },
    ],
  };

  const financialData = [
    { item: '营业收入', current: 156800, previous: 132400, change: 18.4, yearly: 1245600 },
    { item: '营业成本', current: 98650, previous: 87800, change: 12.4, yearly: 786200 },
    { item: '毛利润', current: 58150, previous: 44600, change: 30.4, yearly: 459400 },
    { item: '毛利率', current: 37.1, previous: 33.7, change: 3.4, yearly: 36.9, isPercentage: true },
  ];

  const costStructure = [
    { name: '采购成本', amount: 65200, percentage: 66, color: 'primary' },
    { name: '运营成本', amount: 18500, percentage: 19, color: 'success' },
    { name: '人员成本', amount: 12000, percentage: 12, color: 'warning' },
    { name: '其他费用', amount: 2950, percentage: 3, color: 'info' },
  ];

  if (recordsLoading) {
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
        <Header title="财务分析" breadcrumb="财务分析" />
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">财务分析</h2>
            <p className="text-neutral-600 mt-2">成本控制、利润分析和现金流监控</p>
          </div>
          
          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-success">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-600 text-sm">总收入</p>
                    <p className="text-2xl font-bold text-neutral-800 font-mono" data-testid="text-total-revenue">¥156,800</p>
                    <p className="text-xs text-success mt-1">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      +18.5%
                    </p>
                  </div>
                  <div className="bg-success/10 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-destructive">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-600 text-sm">总成本</p>
                    <p className="text-2xl font-bold text-neutral-800 font-mono" data-testid="text-total-costs">¥98,650</p>
                    <p className="text-xs text-destructive mt-1">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      +12.3%
                    </p>
                  </div>
                  <div className="bg-destructive/10 p-3 rounded-full">
                    <PieChartIcon className="h-6 w-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-600 text-sm">净利润</p>
                    <p className="text-2xl font-bold text-neutral-800 font-mono" data-testid="text-net-profit">¥58,150</p>
                    <p className="text-xs text-success mt-1">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      +25.7%
                    </p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-warning">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-600 text-sm">利润率</p>
                    <p className="text-2xl font-bold text-neutral-800" data-testid="text-profit-margin">37.1%</p>
                    <p className="text-xs text-success mt-1">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      +4.2%
                    </p>
                  </div>
                  <div className="bg-warning/10 p-3 rounded-full">
                    <span className="text-2xl font-bold text-warning">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Financial Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>收入与成本趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <LineChart data={revenueData} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>成本结构分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <PieChart data={profitData} />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Cash Flow and Cost Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>现金流分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                    <div>
                      <h4 className="font-medium text-neutral-800">经营现金流</h4>
                      <p className="text-sm text-neutral-600">本月净现金流入</p>
                    </div>
                    <span className="text-lg font-bold text-success font-mono" data-testid="text-operating-cash">+¥42,500</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <div>
                      <h4 className="font-medium text-neutral-800">投资现金流</h4>
                      <p className="text-sm text-neutral-600">设备和库存投资</p>
                    </div>
                    <span className="text-lg font-bold text-destructive font-mono" data-testid="text-investment-cash">-¥28,000</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <div>
                      <h4 className="font-medium text-neutral-800">自由现金流</h4>
                      <p className="text-sm text-neutral-600">可用于分配的现金</p>
                    </div>
                    <span className="text-lg font-bold text-primary font-mono" data-testid="text-free-cash">+¥14,500</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>成本结构分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costStructure.map((cost, index) => (
                    <div key={index} className="flex items-center justify-between" data-testid={`cost-${cost.name}`}>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 bg-${cost.color} rounded-full mr-3`}></div>
                        <span className="text-neutral-700">{cost.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-mono text-neutral-800 mr-2">¥{cost.amount.toLocaleString()}</span>
                        <span className="text-xs text-neutral-500">({cost.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Financial Reports */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>财务报表</CardTitle>
              <Button className="bg-primary text-white hover:bg-primary/90" data-testid="button-export-report">
                <Download className="h-4 w-4 mr-2" />
                导出报表
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-financial-report">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">项目</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">本月</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">上月</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">变化</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">年累计</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {financialData.map((item, index) => (
                      <tr key={index} data-testid={`row-financial-${item.item}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{item.item}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-900">
                          {item.isPercentage ? `${item.current}%` : `¥${item.current.toLocaleString()}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-600">
                          {item.isPercentage ? `${item.previous}%` : `¥${item.previous.toLocaleString()}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={item.change > 0 ? 'text-success' : 'text-destructive'}>
                            {item.change > 0 ? '+' : ''}{item.change}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-900">
                          {item.isPercentage ? `${item.yearly}%` : `¥${item.yearly.toLocaleString()}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
