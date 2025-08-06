import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import SupplierCard from "@/components/supplier-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, MessageCircle } from "lucide-react";

export default function Procurement() {
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

  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ["/api/suppliers"],
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

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
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

  const mockSuppliers = [
    {
      id: '1',
      name: 'ABC电子科技',
      description: '主营：手机配件、电子产品',
      rating: 5.0,
      qualityLevel: 'high',
      cooperationYears: 2,
      isActive: true,
    },
    {
      id: '2',
      name: '智能家居有限公司',
      description: '主营：智能设备、家居用品',
      rating: 4.2,
      qualityLevel: 'medium',
      cooperationYears: 0.25,
      isActive: true,
    },
  ];

  const mockOrders = [
    {
      id: '1',
      orderNumber: 'P2024001',
      supplierId: '1',
      supplierName: 'ABC电子科技',
      description: 'iPhone 15 Pro Max 手机壳 × 100件',
      totalAmount: '8500',
      status: 'completed',
      createdAt: '2024-12-15',
    },
    {
      id: '2',
      orderNumber: 'P2024002',
      supplierId: '2',
      supplierName: '智能家居有限公司',
      description: '智能音箱 × 50件',
      totalAmount: '12000',
      status: 'pending',
      createdAt: '2024-12-16',
    },
  ];

  const supplierData = suppliers || mockSuppliers;
  const orderData = orders || mockOrders;

  if (isLoading || suppliersLoading || ordersLoading) {
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
              <Button 
                className="bg-primary text-white hover:bg-primary/90"
                data-testid="button-create-order"
              >
                <Plus className="h-4 w-4 mr-2" />
                新增采购订单
              </Button>
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
                  {supplierData.map((supplier: any) => (
                    <SupplierCard
                      key={supplier.id}
                      supplier={supplier}
                      testId={`supplier-${supplier.id}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>最近订单</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.map((order: any) => (
                    <div 
                      key={order.id}
                      className="p-4 border rounded-lg"
                      data-testid={`order-${order.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-neutral-800">采购订单 #{order.orderNumber}</h4>
                        <Badge className={order.status === 'completed' ? 'bg-success text-success-foreground' : 'bg-info text-info-foreground'}>
                          {order.status === 'completed' ? '已完成' : '进行中'}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-600 mb-2">供应商：{order.supplierName}</p>
                      <p className="text-sm text-neutral-600 mb-2">商品：{order.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-neutral-800">¥{parseFloat(order.totalAmount).toLocaleString()}</span>
                        <span className="text-xs text-neutral-500">{order.createdAt}</span>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}
