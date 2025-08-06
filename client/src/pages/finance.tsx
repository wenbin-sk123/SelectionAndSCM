import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import LineChart from "@/components/charts/line-chart";
import PieChart from "@/components/charts/pie-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, PieChart as PieChartIcon, Download } from "lucide-react";

export default function Finance() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // 获取财务记录
  const { data: financialRecords = [], isLoading: recordsLoading } = useQuery<any[]>({
    queryKey: ["/api/financial"],
  });

  // 获取订单统计用于计算收入
  const { data: orderStats = {} } = useQuery<any>({
    queryKey: ["/api/orders/statistics"],
  });

  // 获取库存成本数据
  const { data: inventoryData = [] } = useQuery<any[]>({
    queryKey: ["/api/inventory"],
  });

  // 处理财务数据
  const processedFinancialData = useMemo(() => {
    if (!financialRecords.length) {
      return {
        revenueData: null,
        profitData: null,
        summary: {
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          profitMargin: 0,
        },
        costStructure: [],
      };
    }

    // 按月份分组财务记录
    const monthlyData = financialRecords.reduce((acc: any, record: any) => {
      const month = new Date(record.createdAt).getMonth();
      if (!acc[month]) {
        acc[month] = { revenue: 0, cost: 0 };
      }
      if (record.type === 'income') {
        acc[month].revenue += record.amount;
      } else {
        acc[month].cost += record.amount;
      }
      return acc;
    }, {});

    // 准备图表数据
    const labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const currentMonth = new Date().getMonth();
    const displayLabels = labels.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
    
    const revenueArray = displayLabels.map((_, idx) => {
      const monthIdx = currentMonth - 5 + idx;
      return monthlyData[monthIdx]?.revenue || 0;
    });
    
    const costArray = displayLabels.map((_, idx) => {
      const monthIdx = currentMonth - 5 + idx;
      return monthlyData[monthIdx]?.cost || 0;
    });

    // 计算成本结构
    const costByCategory = financialRecords
      .filter((r: any) => r.type === 'expense')
      .reduce((acc: any, record: any) => {
        const category = record.category || '其他费用';
        acc[category] = (acc[category] || 0) + record.amount;
        return acc;
      }, {});

    const totalCost = Object.values(costByCategory).reduce((sum: any, val: any) => sum + val, 0) as number;
    
    const costStructure = Object.entries(costByCategory).map(([name, amount]: [string, any]) => ({
      name,
      amount,
      percentage: totalCost > 0 ? Math.round((amount / totalCost) * 100) : 0,
      color: name === '采购成本' ? 'primary' : 
             name === '运营成本' ? 'success' : 
             name === '人员成本' ? 'warning' : 'info'
    }));

    // 计算总计
    const totalRevenue = financialRecords
      .filter((r: any) => r.type === 'income')
      .reduce((sum: number, r: any) => sum + r.amount, 0);
    
    const totalExpense = financialRecords
      .filter((r: any) => r.type === 'expense')
      .reduce((sum: number, r: any) => sum + r.amount, 0);

    const totalProfit = totalRevenue - totalExpense;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      revenueData: {
        labels: displayLabels,
        datasets: [
          {
            label: '收入',
            data: revenueArray,
            borderColor: 'hsl(var(--success))',
            backgroundColor: 'hsl(var(--success) / 0.1)',
          },
          {
            label: '成本',
            data: costArray,
            borderColor: 'hsl(var(--destructive))',
            backgroundColor: 'hsl(var(--destructive) / 0.1)',
          },
        ],
      },
      profitData: {
        labels: costStructure.map(c => c.name),
        datasets: [
          {
            data: costStructure.map(c => c.percentage),
            backgroundColor: costStructure.map(c => 
              c.color === 'primary' ? 'hsl(var(--primary))' :
              c.color === 'success' ? 'hsl(var(--success))' :
              c.color === 'warning' ? 'hsl(var(--warning))' :
              'hsl(var(--info))'
            ),
          },
        ],
      },
      summary: {
        totalRevenue,
        totalCost: totalExpense,
        totalProfit,
        profitMargin,
      },
      costStructure,
    };
  }, [financialRecords]);

  const { revenueData, profitData, summary, costStructure } = processedFinancialData;

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
                    <p className="text-2xl font-bold text-neutral-800 font-mono" data-testid="text-total-revenue">
                      ¥{summary.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-success mt-1">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      本月
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
                    <p className="text-2xl font-bold text-neutral-800 font-mono" data-testid="text-total-costs">
                      ¥{summary.totalCost.toLocaleString()}
                    </p>
                    <p className="text-xs text-destructive mt-1">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      本月
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
                    <p className="text-2xl font-bold text-neutral-800 font-mono" data-testid="text-net-profit">
                      ¥{summary.totalProfit.toLocaleString()}
                    </p>
                    <p className="text-xs text-success mt-1">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      本月
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
                    <p className="text-2xl font-bold text-neutral-800" data-testid="text-profit-margin">
                      {summary.profitMargin.toFixed(1)}%
                    </p>
                    <p className="text-xs text-success mt-1">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      本月
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
                  {revenueData ? (
                    <LineChart data={revenueData} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-500">
                      暂无数据
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>成本结构分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {profitData ? (
                    <PieChart data={profitData} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-500">
                      暂无数据
                    </div>
                  )}
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
                    <tr data-testid="row-financial-revenue">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">营业收入</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-900">
                        ¥{summary.totalRevenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-600">
                        ¥0
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className="text-success">+0%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-900">
                        ¥{summary.totalRevenue.toLocaleString()}
                      </td>
                    </tr>
                    <tr data-testid="row-financial-cost">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">营业成本</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-900">
                        ¥{summary.totalCost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-600">
                        ¥0
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className="text-success">+0%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-900">
                        ¥{summary.totalCost.toLocaleString()}
                      </td>
                    </tr>
                    <tr data-testid="row-financial-profit">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">毛利润</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-900">
                        ¥{summary.totalProfit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-600">
                        ¥0
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className="text-success">+0%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-900">
                        ¥{summary.totalProfit.toLocaleString()}
                      </td>
                    </tr>
                    <tr data-testid="row-financial-margin">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">毛利率</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-900">
                        {summary.profitMargin.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-600">
                        0%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className="text-success">+0%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-neutral-900">
                        {summary.profitMargin.toFixed(1)}%
                      </td>
                    </tr>
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
