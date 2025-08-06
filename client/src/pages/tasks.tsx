import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function Tasks() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

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

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    
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

  const canCreateTask = user?.role === 'teacher' || user?.role === 'admin';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-info text-info-foreground';
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'draft':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'draft':
        return '草稿';
      case 'archived':
        return '已归档';
      default:
        return status;
    }
  };

  if (isLoading || tasksLoading) {
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
        <Header title="实训任务" breadcrumb="实训任务" />
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-neutral-800">实训任务管理</h2>
              {canCreateTask && (
                <Button 
                  className="bg-primary text-white hover:bg-primary/90"
                  data-testid="button-create-task"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  创建新任务
                </Button>
              )}
            </div>
          </div>
          
          {/* Task Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  进行中任务
                  <Badge className="bg-info text-info-foreground">1</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border border-info/30 rounded-lg bg-info/5" data-testid="task-active">
                    <h4 className="font-medium text-neutral-800">电子产品供应链优化</h4>
                    <p className="text-sm text-neutral-600 mt-1">目标：优化智能手机供应链，降低成本15%</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                        <span>进度</span>
                        <span>8/15天</span>
                      </div>
                      <Progress value={53} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  待开始任务
                  <Badge className="bg-warning text-warning-foreground">2</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border border-warning/30 rounded-lg bg-warning/5" data-testid="task-pending">
                    <h4 className="font-medium text-neutral-800">家居用品市场分析</h4>
                    <p className="text-sm text-neutral-600 mt-1">分析家居用品市场趋势和竞争格局</p>
                    <Button 
                      size="sm"
                      className="mt-2 bg-warning text-warning-foreground hover:bg-warning/90"
                      data-testid="button-start-task"
                    >
                      开始任务
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  已完成任务
                  <Badge className="bg-success text-success-foreground">3</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border border-success/30 rounded-lg bg-success/5" data-testid="task-completed">
                    <h4 className="font-medium text-neutral-800">服装采购策略制定</h4>
                    <p className="text-sm text-neutral-600 mt-1">评分：92分 - 优秀</p>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      data-testid="button-view-details"
                    >
                      查看详情
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Task Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>任务详情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-tasks">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">任务名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">进度</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">评分</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks && tasks.length > 0 ? (
                      tasks.map((task: any) => (
                        <tr key={task.id} data-testid={`row-task-${task.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-neutral-900">{task.name}</div>
                              <div className="text-sm text-neutral-500">初始资金：¥{parseFloat(task.initialBudget).toLocaleString()}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusIcon(task.status)}
                              <span className="ml-1">{getStatusText(task.status)}</span>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-info h-2 rounded-full" 
                                  style={{ width: task.status === 'completed' ? '100%' : '53%' }}
                                ></div>
                              </div>
                              <span className="text-sm text-neutral-600">
                                {task.status === 'completed' ? '100%' : '53%'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                            {task.status === 'completed' ? (
                              <span className="font-bold text-success">92分</span>
                            ) : '--'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button 
                              variant="link" 
                              className="text-primary hover:text-primary/80 mr-3"
                              data-testid={`button-continue-${task.id}`}
                            >
                              {task.status === 'completed' ? '复习' : '继续'}
                            </Button>
                            <Button 
                              variant="link" 
                              className="text-neutral-600 hover:text-neutral-800"
                              data-testid={`button-details-${task.id}`}
                            >
                              详情
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                          暂无任务数据
                        </td>
                      </tr>
                    )}
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
