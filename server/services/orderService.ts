/**
 * Order Service - Core Business Logic
 * Handles procurement and sales order processing
 */

import { storage } from '../storage';
import { InventoryService } from './inventoryService';
import { 
  Order, 
  Supplier,
  Product,
  FinancialRecord 
} from '@shared/schema';

export class OrderService {
  /**
   * Create and process a purchase order
   */
  static async createPurchaseOrder(
    userId: string,
    taskId: string,
    supplierId: string,
    items: Array<{productId: string, quantity: number, unitPrice: number}>
  ): Promise<Order> {
    // Validate supplier
    const supplier = await storage.getSupplier(supplierId);
    if (!supplier) {
      throw new Error('供应商不存在');
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Check if user has sufficient balance
    const progress = await storage.getStudentProgress(userId, taskId);
    if (!progress || progress.length === 0) {
      throw new Error('请先开始任务');
    }

    if (Number(progress[0].currentBalance) < totalAmount) {
      throw new Error('余额不足');
    }

    // Generate order number
    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create order
    const order = await storage.createOrder({
      orderNumber,
      userId,
      taskId,
      supplierId,
      orderType: 'purchase',
      totalAmount: totalAmount.toString(),
      status: 'pending',
      orderItems: items
    });

    // Process payment and update inventory
    await this.processPurchaseOrder(order.id, userId, taskId);

    return order;
  }

  /**
   * Process a purchase order (payment and inventory update)
   */
  static async processPurchaseOrder(
    orderId: string,
    userId: string,
    taskId: string
  ): Promise<Order> {
    const orders = await storage.getOrders(userId, taskId);
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== 'pending') {
      throw new Error('订单状态不正确');
    }

    const items = order.orderItems as Array<{productId: string, quantity: number, unitPrice: number}>;

    // Process each item
    for (const item of items) {
      await InventoryService.processIncoming(
        userId,
        taskId,
        item.productId,
        item.quantity,
        item.unitPrice
      );
    }

    // Update order status
    const updatedOrder = await storage.updateOrder(orderId, {
      status: 'completed',
      completedAt: new Date()
    });

    return updatedOrder;
  }

  /**
   * Create and process a sales order
   */
  static async createSalesOrder(
    userId: string,
    taskId: string,
    customerName: string,
    items: Array<{productId: string, quantity: number, unitPrice: number}>
  ): Promise<Order> {
    // Check inventory availability
    const inventoryRecords = await storage.getInventoryRecords(userId, taskId);
    
    for (const item of items) {
      const inventory = inventoryRecords.find(r => r.productId === item.productId);
      if (!inventory || inventory.currentStock < item.quantity) {
        throw new Error(`产品库存不足: ${item.productId}`);
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Generate order number
    const orderNumber = `SO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create order
    const order = await storage.createOrder({
      orderNumber,
      userId,
      taskId,
      orderType: 'sale',
      totalAmount: totalAmount.toString(),
      status: 'pending',
      orderItems: items
    });

    // Process the sale
    await this.processSalesOrder(order.id, userId, taskId);

    return order;
  }

  /**
   * Process a sales order (inventory update and revenue recording)
   */
  static async processSalesOrder(
    orderId: string,
    userId: string,
    taskId: string
  ): Promise<Order> {
    const orders = await storage.getOrders(userId, taskId);
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== 'pending') {
      throw new Error('订单状态不正确');
    }

    const items = order.orderItems as Array<{productId: string, quantity: number, unitPrice: number}>;

    // Process each item
    for (const item of items) {
      await InventoryService.processOutgoing(
        userId,
        taskId,
        item.productId,
        item.quantity,
        item.unitPrice
      );
    }

    // Update order status
    const updatedOrder = await storage.updateOrder(orderId, {
      status: 'completed',
      completedAt: new Date()
    });

    return updatedOrder;
  }

  /**
   * Cancel an order
   */
  static async cancelOrder(
    orderId: string,
    userId: string,
    taskId: string
  ): Promise<Order> {
    const orders = await storage.getOrders(userId, taskId);
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status === 'completed') {
      throw new Error('已完成的订单无法取消');
    }

    // Update order status
    const updatedOrder = await storage.updateOrder(orderId, {
      status: 'cancelled'
    });

    // Record cancellation
    await storage.createFinancialRecord({
      userId,
      taskId,
      recordType: 'expense',
      amount: '0',
      description: `订单取消: ${order.orderNumber}`,
      category: 'operational',
      relatedOrderId: orderId
    });

    return updatedOrder;
  }

  /**
   * Get order statistics
   */
  static async getOrderStatistics(userId: string, taskId: string): Promise<any> {
    const orders = await storage.getOrders(userId, taskId);
    
    const purchaseOrders = orders.filter(o => o.orderType === 'purchase');
    const salesOrders = orders.filter(o => o.orderType === 'sale');
    
    const totalPurchaseAmount = purchaseOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalSalesAmount = salesOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const completedOrders = orders.filter(o => o.status === 'completed');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');
    
    // Calculate fulfillment rate
    const totalOrders = orders.length;
    const fulfillmentRate = totalOrders > 0 
      ? (completedOrders.length / totalOrders) * 100 
      : 0;
    
    // Calculate average order value
    const avgPurchaseValue = purchaseOrders.length > 0 
      ? totalPurchaseAmount / purchaseOrders.length 
      : 0;
    
    const avgSalesValue = salesOrders.length > 0
      ? totalSalesAmount / salesOrders.length
      : 0;
    
    return {
      totalOrders,
      purchaseOrders: purchaseOrders.length,
      salesOrders: salesOrders.length,
      pendingOrders: pendingOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalPurchaseAmount,
      totalSalesAmount,
      avgPurchaseValue,
      avgSalesValue,
      fulfillmentRate,
      grossProfit: totalSalesAmount - totalPurchaseAmount
    };
  }

  /**
   * Simulate negotiation with supplier (simple AI logic)
   */
  static async negotiatePrice(
    supplierId: string,
    productId: string,
    requestedPrice: number,
    quantity: number
  ): Promise<{accepted: boolean, finalPrice: number, message: string}> {
    const supplier = await storage.getSupplier(supplierId);
    const product = await storage.getProduct(productId);
    
    if (!supplier || !product) {
      throw new Error('供应商或产品不存在');
    }
    
    const basePrice = Number(product.unitPrice);
    const discount = (basePrice - requestedPrice) / basePrice;
    
    // Simple negotiation logic based on quantity and discount
    let accepted = false;
    let finalPrice = basePrice;
    let message = '';
    
    // Large quantity gets better discount
    const quantityFactor = Math.min(quantity / 100, 1); // Max factor at 100 units
    const maxDiscount = 0.15 + (quantityFactor * 0.10); // 15% base + up to 10% for quantity
    
    if (discount <= 0) {
      // Requesting higher price than base
      accepted = true;
      finalPrice = requestedPrice;
      message = '价格可以接受，成交！';
    } else if (discount <= maxDiscount) {
      // Acceptable discount range
      accepted = true;
      finalPrice = requestedPrice;
      message = `考虑到采购量${quantity}件，这个价格可以接受。`;
    } else if (discount <= maxDiscount + 0.05) {
      // Counter offer
      accepted = false;
      finalPrice = basePrice * (1 - maxDiscount);
      message = `这个价格太低了，我最多能给到${finalPrice.toFixed(2)}元/件。`;
    } else {
      // Reject
      accepted = false;
      finalPrice = basePrice;
      message = '这个价格远低于我们的成本，无法接受。';
    }
    
    return { accepted, finalPrice, message };
  }
}