import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import LineChart from "@/components/charts/line-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BarChart3, Download, Calendar } from "lucide-react";

export default function Reports() {
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

  const { data: evaluations = [], isLoading: evaluationsLoading } = useQuery<any[]>({
    queryKey: ["/api/evaluations"],
  });

  const { data: taskStats = {} } = useQuery<any>({
    queryKey: ["/api/tasks/statistics"],
  });

  const performanceData = {
    labels: ['任务1', '任务2', '任务3', '任务4', '任务5'],
    datasets: [
      {
        label: '财务',
        data: [85, 88, 92, 95, 92],
        borderColor: 'hsl(var(--success))',
        backgroundColor: 'hsl(var(--success) / 0.1)',
      },
      {
        label: '运营',
        data: [78, 82, 85, 88, 85],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
      },
      {
        label: '市场',
        data: [80, 85, 88, 90, 88],
        borderColor: 'hsl(var(--info))',
        backgroundColor: 'hsl(var(--info) / 0.1)',
      },
      {
        label: '风险',
        data: [72, 75, 78, 82, 78],
        borderColor: 'hsl(var(--warning))',
        backgroundColor: 'hsl(var(--warning) / 0.1)',
      },
    ],
  };

  const kpiData = {
    labels: ['财务表现', '运营效率', '市场洞察', '风险控制', '学习能力'],
    datasets: [
      {
        data: [92, 85, 88, 78, 90],
        backgroundColor: 'hsl(var(--primary) / 0.3)',
        borderColor: 'hsl(var(--primary))',
        borderWidth: 2,
      },
    ],
  };

  const performanceKPIs = [
    {
      title: '财务表现',
      score: 92,
      grade: 'A',
      color: 'success',
      metrics: {
        profitMargin: '37.1%',
        roi: '24.5%',
        cashFlow: '良好',
      },
    },
    {
      title: '运营效率',
      score: 85,
      grade: 'B+',
      color: 'primary',
      metrics: {
        inventoryTurnover: '4.2次/月',
        orderProcessing: '1.5天',
        supplierCooperation: '优良',
      },
    },
    {
      title: '市场洞察',
      score: 88,
      grade: 'A-',
      color: 'info',
      metrics: {
        trendAnalysis: '优秀',
        competitorAnalysis: '良好',
        productSelection: '准确',
      },
    },
    {
      title: '风险控制',
      score: 78,
      grade: 'B',
      color: 'warning',
      metrics: {
        fundSafety: '中等',
        inventoryRisk: '可控',
        supplyChain: '稳定',
      },
    },
  ];

  const learningReports = [
    {
      id: '1',
      taskName: '服装采购策略制定',
      initialBudget: 80000,
      completionTime: 15,
      financialScore: 95,
      operationalScore: 88,
      decisionScore: 92,
      totalScore: 92,
      grade: '优秀',
    },
    {
      id: '2',
      taskName: '家居用品选品分析',
      initialBudget: 60000,
      completionTime: 12,
      financialScore: 76,
      operationalScore: 82,
      decisionScore: 85,
      totalScore: 81,
      grade: '良好',
    },
  ];

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
      case '优秀':
        return 'bg-success text-success-foreground';
      case 'B+':
      case 'A-':
      case '良好':
        return 'bg-primary text-primary-foreground';
      case 'B':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  if (evaluationsLoading) {
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
        <Header title="报表中心" breadcrumb="报表中心" />
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-800">报表中心</h2>
                <p className="text-neutral-600 mt-2">数据可视化、报表生成和绩效分析</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  className="bg-primary text-white hover:bg-primary/90"
                  data-testid="button-generate-report"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  生成报表
                </Button>
                <Button 
                  className="bg-success text-success-foreground hover:bg-success/90"
                  data-testid="button-export-data"
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出数据
                </Button>
              </div>
            </div>
          </div>
          
          {/* Performance KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {performanceKPIs.map((kpi, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-800">{kpi.title}</h3>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white bg-${kpi.color}`}>
                      <span className="font-bold" data-testid={`grade-${kpi.title}`}>{kpi.grade}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(kpi.metrics).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">
                          {key === 'profitMargin' ? '利润率' :
                           key === 'roi' ? 'ROI' :
                           key === 'cashFlow' ? '现金流' :
                           key === 'inventoryTurnover' ? '库存周转' :
                           key === 'orderProcessing' ? '订单处理' :
                           key === 'supplierCooperation' ? '供应商合作' :
                           key === 'trendAnalysis' ? '趋势把握' :
                           key === 'competitorAnalysis' ? '竞争分析' :
                           key === 'productSelection' ? '选品决策' :
                           key === 'fundSafety' ? '资金安全' :
                           key === 'inventoryRisk' ? '库存风险' :
                           key === 'supplyChain' ? '供应链' : key}
                        </span>
                        <span className={`font-semibold text-${kpi.color}`} data-testid={`metric-${key}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-800">综合评分</span>
                      <span className={`text-xl font-bold text-${kpi.color}`} data-testid={`score-${kpi.title}`}>{kpi.score}分</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Comprehensive Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>综合绩效趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <LineChart data={performanceData} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>KPI达成情况</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative w-48 h-48 mx-auto mb-4">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          stroke="hsl(var(--muted))"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          stroke="hsl(var(--primary))"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 45 * 0.86} ${2 * Math.PI * 45}`}
                          strokeDashoffset={`${2 * Math.PI * 45 * 0.25}`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary" data-testid="text-overall-kpi">86%</div>
                          <div className="text-sm text-neutral-600">总体KPI达成</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Detailed Reports Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>学习进度报告</CardTitle>
              <div className="flex items-center space-x-3">
                <Select>
                  <SelectTrigger className="w-32" data-testid="select-task-filter">
                    <SelectValue placeholder="全部任务" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部任务</SelectItem>
                    <SelectItem value="active">进行中任务</SelectItem>
                    <SelectItem value="completed">已完成任务</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  type="date"
                  className="w-40"
                  data-testid="input-date-filter"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-learning-progress">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">任务名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">完成时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">财务得分</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">运营得分</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">决策得分</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">总分</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">等级</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {learningReports.map((report) => (
                      <tr key={report.id} data-testid={`row-report-${report.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-neutral-900">{report.taskName}</div>
                            <div className="text-sm text-neutral-500">初始资金：¥{report.initialBudget.toLocaleString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {report.completionTime}天
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-success mr-2">{report.financialScore}分</span>
                            <div className="bg-gray-200 rounded-full h-2 w-16">
                              <div 
                                className="bg-success h-2 rounded-full" 
                                style={{ width: `${report.financialScore}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-primary mr-2">{report.operationalScore}分</span>
                            <div className="bg-gray-200 rounded-full h-2 w-16">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${report.operationalScore}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-info mr-2">{report.decisionScore}分</span>
                            <div className="bg-gray-200 rounded-full h-2 w-16">
                              <div 
                                className="bg-info h-2 rounded-full" 
                                style={{ width: `${report.decisionScore}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-success">{report.totalScore}分</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getGradeColor(report.grade)}>
                            {report.grade}
                          </Badge>
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
