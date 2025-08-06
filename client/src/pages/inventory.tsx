import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import InventoryAlert from "@/components/inventory-alert";
import LineChart from "@/components/charts/line-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Warehouse, Package, AlertTriangle, RotateCcw } from "lucide-react";

export default function Inventory() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "未授权",
        description: "您已退出登录，正在重新登录...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory"],
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
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const inventoryTrendData = {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    datasets: [
      {
        label: '入库',
        data: [320, 432, 301, 334, 390, 330],
        borderColor: 'hsl(var(--success))',
        backgroundColor: 'hsl(var(--success) / 0.1)',
      },
      {
        label: '出库',
        data: [220, 282, 201, 234, 290, 430],
        borderColor: 'hsl(var(--destructive))',
        backgroundColor: 'hsl(var(--destructive) / 0.1)',
      },
    ],
  };

  const inventoryAlerts = [
    {
      id: '1',
      type: 'shortage',
      title: '蓝牙耳机库存不足',
      description: '当前库存：15件，安全库存：30件',
      severity: 'high',
    },
    {
      id: '2',
      type: 'expiry',
      title: '智能手表即将过期',
      description: '库存：25件，预计7天内过保质期',
      severity: 'medium',
    },
    {
      id: '3',
      type: 'trend',
      title: '手机壳销量增长',
      description: '销量环比增长35%，建议增加备货',
      severity: 'low',
    },
  ];

  const mockInventoryItems = [
    {
      id: '1',
      sku: 'PHC-001',
      name: 'iPhone 15 Pro Max 手机壳',
      category: '电子产品',
      currentStock: 85,
      safetyStock: 50,
      unitPrice: 85,
      status: 'normal',
    },
    {
      id: '2',
      sku: 'BTE-002',
      name: 'AirPods Pro 蓝牙耳机',
      category: '电子产品',
      currentStock: 15,
      safetyStock: 30,
      unitPrice: 1200,
      status: 'shortage',
    },
  ];

  const inventoryItems = inventory || mockInventoryItems;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge className="bg-success text-success-foreground">正常</Badge>;
      case 'shortage':
        return <Badge className="bg-destructive text-destructive-foreground">库存不足</Badge>;
      case 'overstocked':
        return <Badge className="bg-warning text-warning-foreground">库存过多</Badge>;
      default:
        return <Badge className="bg-secondary text-secondary-foreground">{status}</Badge>;
    }
  };

  if (isLoading || inventoryLoading) {
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
        <Header title="库存管理" breadcrumb="库存管理" />
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-800">库存管理</h2>
                <p className="text-neutral-600 mt-2">库存监控、预警系统和优化建议</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  className="bg-success text-success-foreground hover:bg-success/90"
                  data-testid="button-inbound"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  入库
                </Button>
                <Button 
                  className="bg-warning text-warning-foreground hover:bg-warning/90"
                  data-testid="button-outbound"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  出库
                </Button>
              </div>
            </div>
          </div>
          
          {/* Inventory Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-600">库存总值</h3>
                  <Warehouse className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-neutral-800 font-mono" data-testid="text-inventory-value">¥45,600</p>
                <p className="text-xs text-destructive mt-1">
                  <span className="mr-1">↓</span>-2.1%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-600">商品种类</h3>
                  <Package className="h-5 w-5 text-info" />
                </div>
                <p className="text-2xl font-bold text-neutral-800" data-testid="text-product-types">28</p>
                <p className="text-xs text-success mt-1">
                  <span className="mr-1">↑</span>+3种
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-600">预警商品</h3>
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <p className="text-2xl font-bold text-neutral-800" data-testid="text-alert-items">5</p>
                <p className="text-xs text-warning mt-1">需要补货</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-600">周转率</h3>
                  <RotateCcw className="h-5 w-5 text-success" />
                </div>
                <p className="text-2xl font-bold text-neutral-800" data-testid="text-turnover-rate">4.2</p>
                <p className="text-xs text-success mt-1">次/月</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Inventory Charts and Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>库存趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <LineChart data={inventoryTrendData} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>库存预警</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryAlerts.map((alert) => (
                    <InventoryAlert
                      key={alert.id}
                      alert={alert}
                      testId={`alert-${alert.id}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Inventory Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>库存明细</CardTitle>
              <div className="flex items-center space-x-3">
                <Input 
                  type="text"
                  placeholder="搜索商品..."
                  className="w-64"
                  data-testid="input-search-inventory"
                />
                <Select>
                  <SelectTrigger className="w-32" data-testid="select-category">
                    <SelectValue placeholder="全部分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    <SelectItem value="electronics">电子产品</SelectItem>
                    <SelectItem value="home">家居用品</SelectItem>
                    <SelectItem value="clothing">服装配饰</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-inventory">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">商品信息</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">当前库存</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">安全库存</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">单价</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">库存价值</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventoryItems.map((item: any) => (
                      <tr key={item.id} data-testid={`row-inventory-${item.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-neutral-900">{item.name}</div>
                              <div className="text-sm text-neutral-500">SKU: {item.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${item.status === 'shortage' ? 'text-destructive' : 'text-neutral-900'}`}>
                            {item.currentStock}件
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-neutral-600">{item.safetyStock}件</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-neutral-900">¥{item.unitPrice}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-neutral-900">¥{(item.currentStock * item.unitPrice).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button 
                            variant="link" 
                            className="text-primary hover:text-primary/80 mr-3"
                            data-testid={`button-adjust-${item.id}`}
                          >
                            {item.status === 'shortage' ? '补货' : '调整'}
                          </Button>
                          <Button 
                            variant="link" 
                            className="text-neutral-600 hover:text-neutral-800"
                            data-testid={`button-details-${item.id}`}
                          >
                            详情
                          </Button>
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
