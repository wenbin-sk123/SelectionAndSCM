import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import InventoryAlert from "@/components/inventory-alert";
import LineChart from "@/components/charts/line-chart";
import { chartColors } from "@/lib/chartColors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Warehouse, Package, AlertTriangle, RotateCcw, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function Inventory() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [inboundDialogOpen, setInboundDialogOpen] = useState(false);
  const [outboundDialogOpen, setOutboundDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    description: "",
    unitPrice: "",
    safetyStock: "",
    sku: "",
  });
  
  // Get current task ID - using 'default' as fallback
  const taskId = 'default';

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

  const { data: inventoryItems = [], isLoading: inventoryLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/inventory?taskId=${taskId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 400) {
          // If taskId is required but missing, return empty array
          return [];
        }
        throw new Error('Failed to fetch inventory');
      }
      return response.json();
    },
    enabled: !!taskId,
  });

  const { data: inventoryStats = {} } = useQuery<any>({
    queryKey: ["/api/inventory/statistics"],
  });
  
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const inventoryTrendData = {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    datasets: [
      {
        label: '入库',
        data: [320, 432, 301, 334, 390, 330],
        borderColor: chartColors.primary.green,
        backgroundColor: chartColors.gradients.greenGradient,
      },
      {
        label: '出库',
        data: [220, 282, 201, 234, 290, 430],
        borderColor: chartColors.primary.orange,
        backgroundColor: chartColors.gradients.orangeGradient,
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

  if (inventoryLoading) {
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
                  className="bg-primary text-white hover:bg-primary/90"
                  data-testid="button-manage-products"
                  onClick={() => setProductDialogOpen(true)}
                >
                  <Package className="h-4 w-4 mr-2" />
                  商品管理
                </Button>
                <Button 
                  className="bg-success text-success-foreground hover:bg-success/90"
                  data-testid="button-inbound"
                  onClick={() => setInboundDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  入库
                </Button>
                <Button 
                  className="bg-warning text-warning-foreground hover:bg-warning/90"
                  data-testid="button-outbound"
                  onClick={() => setOutboundDialogOpen(true)}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  出库
                </Button>
                <Button 
                  className="bg-primary text-white hover:bg-primary/90"
                  data-testid="button-export-inventory"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/export/inventory?taskId=default', {
                        method: 'GET',
                        credentials: 'include',
                      });
                      
                      if (!response.ok) {
                        throw new Error('导出失败');
                      }
                      
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.xlsx`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      
                      toast({
                        title: "导出成功",
                        description: "库存数据已成功导出为Excel文件",
                      });
                    } catch (error) {
                      console.error('Export error:', error);
                      toast({
                        title: "导出失败",
                        description: "无法导出库存数据，请稍后重试",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出数据
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
                <p className="text-2xl font-bold text-neutral-800 font-mono" data-testid="text-inventory-value">
                  ¥{(inventoryStats.totalValue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  库存总额
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-600">商品种类</h3>
                  <Package className="h-5 w-5 text-info" />
                </div>
                <p className="text-2xl font-bold text-neutral-800" data-testid="text-product-types">
                  {inventoryStats.totalProducts || inventoryItems.length}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  商品数量
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-600">预警商品</h3>
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <p className="text-2xl font-bold text-neutral-800" data-testid="text-alert-items">
                  {inventoryStats.lowStockCount || 0}
                </p>
                <p className="text-xs text-warning mt-1">需要补货</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-600">周转率</h3>
                  <RotateCcw className="h-5 w-5 text-success" />
                </div>
                <p className="text-2xl font-bold text-neutral-800" data-testid="text-turnover-rate">
                  {(inventoryStats.turnoverRate || 0).toFixed(1)}
                </p>
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
      
      {/* 入库对话框 */}
      <Dialog open={inboundDialogOpen} onOpenChange={setInboundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>商品入库</DialogTitle>
            <DialogDescription>
              请输入入库商品信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inbound-product">选择商品</Label>
              <Select onValueChange={(value) => setSelectedProduct(value)}>
                <SelectTrigger id="inbound-product">
                  <SelectValue placeholder="选择商品" />
                </SelectTrigger>
                <SelectContent>
                  {products.length > 0 ? (
                    products.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      暂无商品，请先添加商品
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="inbound-quantity">入库数量</Label>
              <Input
                id="inbound-quantity"
                type="number"
                placeholder="请输入数量"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="inbound-price">单位成本（元）</Label>
              <Input
                id="inbound-price"
                type="number"
                placeholder="请输入单位成本"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setInboundDialogOpen(false);
                  setQuantity("");
                  setUnitPrice("");
                  setSelectedProduct(null);
                }}
              >
                取消
              </Button>
              <Button
                className="bg-success text-success-foreground"
                onClick={async () => {
                  if (!selectedProduct || !quantity || !unitPrice) {
                    toast({
                      title: "请填写完整信息",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  try {
                    await apiRequest('/api/inventory/incoming', {
                      method: 'POST',
                      body: JSON.stringify({
                        taskId,
                        productId: selectedProduct,
                        quantity: parseInt(quantity),
                        unitCost: parseFloat(unitPrice),
                      }),
                    });
                    
                    toast({
                      title: "入库成功",
                      description: `商品已成功入库 ${quantity} 件`,
                    });
                    
                    // 刷新库存数据
                    queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/inventory/statistics"] });
                    
                    setInboundDialogOpen(false);
                    setQuantity("");
                    setUnitPrice("");
                    setSelectedProduct(null);
                  } catch (error) {
                    toast({
                      title: "入库失败",
                      description: "请稍后重试",
                      variant: "destructive",
                    });
                  }
                }}
              >
                确认入库
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 出库对话框 */}
      <Dialog open={outboundDialogOpen} onOpenChange={setOutboundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>商品出库</DialogTitle>
            <DialogDescription>
              请输入出库商品信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="outbound-product">选择商品</Label>
              <Select onValueChange={(value) => setSelectedProduct(value)}>
                <SelectTrigger id="outbound-product">
                  <SelectValue placeholder="选择商品" />
                </SelectTrigger>
                <SelectContent>
                  {products.length > 0 ? (
                    products.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      暂无商品，请先添加商品
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="outbound-quantity">出库数量</Label>
              <Input
                id="outbound-quantity"
                type="number"
                placeholder="请输入数量"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="outbound-price">单位售价（元）</Label>
              <Input
                id="outbound-price"
                type="number"
                placeholder="请输入单位售价"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOutboundDialogOpen(false);
                  setQuantity("");
                  setUnitPrice("");
                  setSelectedProduct(null);
                }}
              >
                取消
              </Button>
              <Button
                className="bg-warning text-warning-foreground"
                onClick={async () => {
                  if (!selectedProduct || !quantity || !unitPrice) {
                    toast({
                      title: "请填写完整信息",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  try {
                    await apiRequest('/api/inventory/outgoing', {
                      method: 'POST',
                      body: JSON.stringify({
                        taskId,
                        productId: selectedProduct,
                        quantity: parseInt(quantity),
                        unitPrice: parseFloat(unitPrice),
                      }),
                    });
                    
                    toast({
                      title: "出库成功",
                      description: `商品已成功出库 ${quantity} 件`,
                    });
                    
                    // 刷新库存数据
                    queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/inventory/statistics"] });
                    
                    setOutboundDialogOpen(false);
                    setQuantity("");
                    setUnitPrice("");
                    setSelectedProduct(null);
                  } catch (error) {
                    toast({
                      title: "出库失败",
                      description: "请稍后重试",
                      variant: "destructive",
                    });
                  }
                }}
              >
                确认出库
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 商品管理对话框 */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>商品管理</DialogTitle>
            <DialogDescription>
              管理系统中的商品信息，可以新增商品到商品库
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 新增商品表单 */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-lg">新增商品</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-name">商品名称</Label>
                  <Input
                    id="product-name"
                    placeholder="请输入商品名称"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="product-sku">商品编码(SKU)</Label>
                  <Input
                    id="product-sku"
                    placeholder="请输入商品编码"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="product-category">商品分类</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct({...newProduct, category: value})}
                  >
                    <SelectTrigger id="product-category">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">电子产品</SelectItem>
                      <SelectItem value="clothing">服装配饰</SelectItem>
                      <SelectItem value="home">家居用品</SelectItem>
                      <SelectItem value="beauty">美妆个护</SelectItem>
                      <SelectItem value="food">食品饮料</SelectItem>
                      <SelectItem value="sports">运动户外</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product-price">单位价格（元）</Label>
                  <Input
                    id="product-price"
                    type="number"
                    placeholder="请输入单位价格"
                    value={newProduct.unitPrice}
                    onChange={(e) => setNewProduct({...newProduct, unitPrice: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="product-safety">安全库存</Label>
                  <Input
                    id="product-safety"
                    type="number"
                    placeholder="请输入安全库存数量"
                    value={newProduct.safetyStock}
                    onChange={(e) => setNewProduct({...newProduct, safetyStock: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="product-desc">商品描述</Label>
                  <Input
                    id="product-desc"
                    placeholder="请输入商品描述"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  />
                </div>
              </div>
              <Button
                className="w-full bg-primary text-white"
                onClick={async () => {
                  if (!newProduct.name || !newProduct.category || !newProduct.unitPrice) {
                    toast({
                      title: "请填写必要信息",
                      description: "商品名称、分类和价格为必填项",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  try {
                    await apiRequest('/api/products', {
                      method: 'POST',
                      body: JSON.stringify({
                        name: newProduct.name,
                        category: newProduct.category,
                        description: newProduct.description || '',
                        sku: newProduct.sku || `SKU${Date.now()}`,
                        unitPrice: parseFloat(newProduct.unitPrice),
                        safetyStock: parseInt(newProduct.safetyStock) || 0,
                      }),
                    });
                    
                    toast({
                      title: "商品添加成功",
                      description: `${newProduct.name} 已成功添加到商品库`,
                    });
                    
                    // 刷新商品列表
                    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                    
                    // 清空表单
                    setNewProduct({
                      name: "",
                      category: "",
                      description: "",
                      unitPrice: "",
                      safetyStock: "",
                      sku: "",
                    });
                  } catch (error) {
                    toast({
                      title: "添加失败",
                      description: "请检查您的权限或稍后重试",
                      variant: "destructive",
                    });
                  }
                }}
              >
                添加商品
              </Button>
            </div>
            
            {/* 现有商品列表 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-3">现有商品列表</h3>
              <div className="max-h-64 overflow-y-auto">
                {products.length > 0 ? (
                  <div className="space-y-2">
                    {products.map((product: any) => (
                      <div key={product.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            分类: {product.category} | SKU: {product.sku} | 价格: ¥{product.unitPrice}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">暂无商品，请先添加商品</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setProductDialogOpen(false);
                setNewProduct({
                  name: "",
                  category: "",
                  description: "",
                  unitPrice: "",
                  safetyStock: "",
                  sku: "",
                });
              }}
            >
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
