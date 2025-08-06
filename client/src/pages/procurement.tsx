import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import SupplierCard from "@/components/supplier-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, MessageCircle, Download } from "lucide-react";

const negotiationSchema = z.object({
  supplierId: z.string().min(1, "请选择供应商"),
  productId: z.string().min(1, "请选择产品"),
  requestedPrice: z.number().positive("价格必须大于0"),
  quantity: z.number().int().positive("数量必须大于0"),
});

export default function Procurement() {
  const { toast } = useToast();
  const [negotiationDialogOpen, setNegotiationDialogOpen] = useState(false);

  const { data: suppliers = [], isLoading: suppliersLoading, error: suppliersError } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const negotiationForm = useForm({
    resolver: zodResolver(negotiationSchema),
    defaultValues: {
      supplierId: "",
      productId: "",
      requestedPrice: 0,
      quantity: 1,
    },
  });

  const negotiationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof negotiationSchema>) => {
      const response = await apiRequest("POST", "/api/negotiation", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "谈判完成",
        description: data.dealClosed ? `成交价格：¥${data.finalPrice}` : "谈判未成功，请调整策略",
      });
      setNegotiationDialogOpen(false);
      negotiationForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "谈判失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (suppliersLoading || ordersLoading) {
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
        <Header title="采购管理" breadcrumb="采购管理" />
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-800">采购管理</h2>
                <p className="text-neutral-600 mt-2">供应商管理、谈判模拟和合同管理</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  className="bg-success text-success-foreground hover:bg-success/90"
                  data-testid="button-export-procurement"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/export/orders?taskId=default&orderType=purchase', {
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
                      a.download = `procurement-report-${new Date().toISOString().split('T')[0]}.xlsx`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      
                      toast({
                        title: "导出成功",
                        description: "采购数据已成功导出为Excel文件",
                      });
                    } catch (error) {
                      console.error('Export error:', error);
                      toast({
                        title: "导出失败",
                        description: "无法导出采购数据，请稍后重试",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出数据
                </Button>
                <Button 
                  className="bg-primary text-white hover:bg-primary/90"
                  data-testid="button-create-order"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新增采购订单
                </Button>
              </div>
            </div>
          </div>
          
          {/* Procurement Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">供应商概况</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">合作供应商</span>
                    <span className="font-semibold text-neutral-800" data-testid="text-total-suppliers">12家</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">优质供应商</span>
                    <span className="font-semibold text-success" data-testid="text-quality-suppliers">8家</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">新供应商</span>
                    <span className="font-semibold text-warning" data-testid="text-new-suppliers">3家</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">采购统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">本月采购额</span>
                    <span className="font-semibold text-neutral-800 font-mono" data-testid="text-monthly-procurement">¥45,200</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">节省成本</span>
                    <span className="font-semibold text-success font-mono" data-testid="text-cost-savings">¥6,800</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">采购订单</span>
                    <span className="font-semibold text-neutral-800" data-testid="text-order-count">24笔</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">谈判成果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">谈判成功率</span>
                    <span className="font-semibold text-success" data-testid="text-negotiation-success">85%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">平均折扣</span>
                    <span className="font-semibold text-success" data-testid="text-average-discount">12%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">谈判轮次</span>
                    <span className="font-semibold text-neutral-800" data-testid="text-negotiation-rounds">平均3轮</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Suppliers and Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>供应商列表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suppliers.length > 0 ? (
                    suppliers.map((supplier: any) => (
                      <SupplierCard
                        key={supplier.id}
                        supplier={supplier}
                        testId={`supplier-${supplier.id}`}
                      />
                    ))
                  ) : (
                    <p className="text-center text-neutral-500 py-4">暂无供应商数据</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>最近订单</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.length > 0 ? (
                    orders.map((order: any) => (
                      <div 
                        key={order.id}
                        className="p-4 border rounded-lg"
                        data-testid={`order-${order.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-neutral-800">采购订单 #{order.orderNumber || order.id}</h4>
                          <Badge className={order.status === 'completed' ? 'bg-success text-success-foreground' : 'bg-info text-info-foreground'}>
                            {order.status === 'completed' ? '已完成' : '进行中'}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-600 mb-2">供应商：{order.supplierName || '未知'}</p>
                        <p className="text-sm text-neutral-600 mb-2">商品：{order.description || order.productId}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-neutral-800">¥{(order.totalAmount || order.amount || 0).toLocaleString()}</span>
                          <span className="text-xs text-neutral-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-neutral-500 py-4">暂无订单数据</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Negotiation Simulation */}
          <Card>
            <CardHeader>
              <CardTitle>智能谈判模拟</CardTitle>
              <p className="text-sm text-neutral-600">与AI供应商进行采购谈判练习</p>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-neutral-800 mb-2">当前谈判：蓝牙耳机采购</h4>
                <p className="text-sm text-neutral-600 mb-3">与ABC电子科技谈判100件AirPods Pro采购价格</p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-start" data-testid="message-ai">
                    <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-xs">AI</div>
                    <div className="flex-1 bg-white p-3 rounded-lg">
                      <p className="text-sm text-neutral-800">我们的标准价格是每件¥1,200，考虑到您的采购量，我们可以给到¥1,150的价格。</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-end" data-testid="message-user">
                    <div className="flex-1 bg-primary text-white p-3 rounded-lg mr-3">
                      <p className="text-sm">考虑到长期合作关系，我们希望价格能够控制在¥1,000以内，这样对双方都有利。</p>
                    </div>
                    <div className="bg-neutral-800 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs">你</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex space-x-3">
                    <Input 
                      type="text"
                      placeholder="输入您的谈判回复..."
                      className="flex-1"
                      data-testid="input-negotiation"
                    />
                    <Button 
                      className="bg-primary text-white hover:bg-primary/90"
                      data-testid="button-send-message"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      发送
                    </Button>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex space-x-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        data-testid="button-mention-cooperation"
                      >
                        提及长期合作
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        data-testid="button-emphasize-volume"
                      >
                        强调采购量
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        data-testid="button-payment-terms"
                      >
                        要求分期付款
                      </Button>
                    </div>
                    <span className="text-xs text-neutral-500" data-testid="text-negotiation-progress">谈判进度：第2轮</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Negotiation Dialog */}
      <Dialog open={negotiationDialogOpen} onOpenChange={setNegotiationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>采购谈判</DialogTitle>
            <DialogDescription>
              与供应商进行价格谈判
            </DialogDescription>
          </DialogHeader>
          <Form {...negotiationForm}>
            <form onSubmit={negotiationForm.handleSubmit((data) => negotiationMutation.mutate(data))} className="space-y-4">
              <FormField
                control={negotiationForm.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>选择供应商</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full px-3 py-2 border rounded-md"
                        data-testid="select-supplier"
                      >
                        <option value="">请选择</option>
                        {suppliers.map((supplier: any) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={negotiationForm.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>选择产品</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full px-3 py-2 border rounded-md"
                        data-testid="select-product"
                      >
                        <option value="">请选择</option>
                        {products.map((product: any) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={negotiationForm.control}
                name="requestedPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>期望价格 (¥)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-requested-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={negotiationForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>数量</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setNegotiationDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={negotiationMutation.isPending}>
                  {negotiationMutation.isPending ? "谈判中..." : "开始谈判"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
