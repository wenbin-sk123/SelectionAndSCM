import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createTaskSchema = z.object({
  name: z.string().min(1, "任务名称不能为空"),
  description: z.string().min(1, "任务描述不能为空"),
  initialBudget: z.string().min(1, "初始预算不能为空"),
  durationDays: z.number().min(1, "持续天数必须大于0").max(90, "持续天数不能超过90天"),
  marketScenario: z.object({
    category: z.string().min(1, "请选择市场场景"),
    difficulty: z.string().min(1, "请选择难度等级"),
  }).optional(),
  targetKpis: z.object({
    revenueTarget: z.number().optional(),
    profitMargin: z.number().optional(),
    inventoryTurnover: z.number().optional(),
  }).optional(),
  status: z.string().default("draft"),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

export default function Tasks() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

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

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const canCreateTask = user?.role === 'teacher' || user?.role === 'admin';

  const form = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: "",
      description: "",
      initialBudget: "10000",
      durationDays: 7,
      marketScenario: {
        category: "",
        difficulty: "",
      },
      targetKpis: {
        revenueTarget: 0,
        profitMargin: 0,
        inventoryTurnover: 0,
      },
      status: "draft",
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskForm) => {
      return await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      toast({
        title: "任务创建成功",
        description: "新的实训任务已创建",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setCreateDialogOpen(false);
      form.reset();
    },
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
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editForm = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: "",
      description: "",
      initialBudget: "10000",
      durationDays: 7,
      marketScenario: {
        category: "",
        difficulty: "",
      },
      targetKpis: {
        revenueTarget: 0,
        profitMargin: 0,
        inventoryTurnover: 0,
      },
      status: "draft",
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskForm) => {
      if (!selectedTask) return;
      return await apiRequest("PATCH", `/api/tasks/${selectedTask.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "任务更新成功",
      });
      setEditDialogOpen(false);
      setSelectedTask(null);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "任务删除成功",
      });
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    editForm.reset({
      name: task.name,
      description: task.description || "",
      initialBudget: task.initialBudget,
      durationDays: task.durationDays,
      marketScenario: task.marketScenario || {
        category: "",
        difficulty: "",
      },
      targetKpis: task.targetKpis || {
        revenueTarget: 0,
        profitMargin: 0,
        inventoryTurnover: 0,
      },
      status: task.status,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteTask = (task: any) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

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
                  onClick={() => setCreateDialogOpen(true)}
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
                            {(user?.role === 'teacher' || user?.role === 'admin') ? (
                              <>
                                <Button 
                                  variant="link" 
                                  className="text-primary hover:text-primary/80 mr-3"
                                  data-testid={`button-edit-${task.id}`}
                                  onClick={() => handleEditTask(task)}
                                >
                                  编辑
                                </Button>
                                <Button 
                                  variant="link" 
                                  className="text-red-600 hover:text-red-800"
                                  data-testid={`button-delete-${task.id}`}
                                  onClick={() => handleDeleteTask(task)}
                                >
                                  删除
                                </Button>
                              </>
                            ) : (
                              <>
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
                              </>
                            )}
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

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建实训任务</DialogTitle>
            <DialogDescription>
              创建新的实训任务供学生练习
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(data => createTaskMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>任务名称</FormLabel>
                    <FormControl>
                      <Input placeholder="输入任务名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>任务描述</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="详细描述任务内容" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>初始预算（元）</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        placeholder="输入初始预算金额" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="marketScenario.category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>市场场景</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择场景" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="服装">服装</SelectItem>
                          <SelectItem value="电子产品">电子产品</SelectItem>
                          <SelectItem value="食品">食品</SelectItem>
                          <SelectItem value="家居用品">家居用品</SelectItem>
                          <SelectItem value="运动用品">运动用品</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marketScenario.difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>难度等级</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择难度" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">初级</SelectItem>
                          <SelectItem value="intermediate">中级</SelectItem>
                          <SelectItem value="advanced">高级</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>持续天数</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="7" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="text-sm font-medium">目标KPI（选填）</div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="targetKpis.revenueTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>营收目标</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="targetKpis.profitMargin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>利润率(%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="targetKpis.inventoryTurnover"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>库存周转率</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>任务状态</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择状态" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">草稿</SelectItem>
                        <SelectItem value="active">激活</SelectItem>
                        <SelectItem value="archived">归档</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  取消
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTaskMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {createTaskMutation.isPending ? "创建中..." : "创建任务"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑任务</DialogTitle>
            <DialogDescription>
              修改实训任务信息
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(data => updateTaskMutation.mutate(data))} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>任务名称</FormLabel>
                    <FormControl>
                      <Input placeholder="输入任务名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>任务描述</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="详细描述任务内容" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="initialBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>初始预算（元）</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        placeholder="输入初始预算金额" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="marketScenario.category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>市场场景</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择场景" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="服装">服装</SelectItem>
                          <SelectItem value="电子产品">电子产品</SelectItem>
                          <SelectItem value="食品">食品</SelectItem>
                          <SelectItem value="家居用品">家居用品</SelectItem>
                          <SelectItem value="运动用品">运动用品</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="marketScenario.difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>难度等级</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择难度" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">初级</SelectItem>
                          <SelectItem value="intermediate">中级</SelectItem>
                          <SelectItem value="advanced">高级</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>持续天数</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="7" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>任务状态</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择状态" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">草稿</SelectItem>
                        <SelectItem value="active">激活</SelectItem>
                        <SelectItem value="archived">归档</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  取消
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTaskMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {updateTaskMutation.isPending ? "更新中..." : "更新任务"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除任务 "{taskToDelete?.name}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              取消
            </Button>
            <Button 
              variant="destructive"
              onClick={() => taskToDelete && deleteTaskMutation.mutate(taskToDelete.id)}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? "删除中..." : "确认删除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
