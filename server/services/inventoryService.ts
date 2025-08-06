/**
 * Inventory Service - Core Business Logic
 * Handles inventory operations, stock management, and optimization
 */

import { storage } from '../storage';
import { 
  InventoryRecord, 
  Product, 
  Order,
  FinancialRecord 
} from '@shared/schema';

export class InventoryService {
  /**
   * Process incoming inventory (purchase order received)
   */
  static async processIncoming(
    userId: string,
    taskId: string,
    productId: string,
    quantity: number,
    unitCost: number
  ): Promise<InventoryRecord> {
    // Get current inventory
    const inventoryRecords = await storage.getInventoryRecords(userId, taskId);
    const existingRecord = inventoryRecords.find(r => r.productId === productId);
    
    const newStock = existingRecord 
      ? existingRecord.currentStock + quantity 
      : quantity;

    // Update inventory
    const updatedRecord = await storage.upsertInventoryRecord({
      userId,
      taskId,
      productId,
      currentStock: newStock,
      reservedStock: existingRecord?.reservedStock || 0
    });

    // Record financial transaction
    const totalCost = quantity * unitCost;
    await storage.createFinancialRecord({
      userId,
      taskId,
      recordType: 'expense',
      amount: totalCost.toString(),
      description: `采购入库 - 数量: ${quantity}`,
      category: 'procurement'
    });

    // Update student progress balance
    const progress = await storage.getStudentProgress(userId, taskId);
    if (progress && progress.length > 0) {
      const newBalance = Number(progress[0].currentBalance) - totalCost;
      await storage.upsertStudentProgress({
        ...progress[0],
        currentBalance: newBalance.toString(),
        inventoryValue: (Number(progress[0].inventoryValue) + totalCost).toString()
      });
    }

    return updatedRecord;
  }

  /**
   * Process outgoing inventory (sales order fulfilled)
   */
  static async processOutgoing(
    userId: string,
    taskId: string,
    productId: string,
    quantity: number,
    unitPrice: number
  ): Promise<InventoryRecord> {
    // Get current inventory
    const inventoryRecords = await storage.getInventoryRecords(userId, taskId);
    const existingRecord = inventoryRecords.find(r => r.productId === productId);
    
    if (!existingRecord || existingRecord.currentStock < quantity) {
      throw new Error('库存不足');
    }

    const newStock = existingRecord.currentStock - quantity;

    // Update inventory
    const updatedRecord = await storage.upsertInventoryRecord({
      ...existingRecord,
      currentStock: newStock
    });

    // Record financial transaction
    const totalRevenue = quantity * unitPrice;
    await storage.createFinancialRecord({
      userId,
      taskId,
      recordType: 'income',
      amount: totalRevenue.toString(),
      description: `销售出库 - 数量: ${quantity}`,
      category: 'sales'
    });

    // Update student progress
    const progress = await storage.getStudentProgress(userId, taskId);
    if (progress && progress.length > 0) {
      const newBalance = Number(progress[0].currentBalance) + totalRevenue;
      const inventoryCost = quantity * 50; // Placeholder cost calculation
      await storage.upsertStudentProgress({
        ...progress[0],
        currentBalance: newBalance.toString(),
        totalRevenue: (Number(progress[0].totalRevenue) + totalRevenue).toString(),
        totalProfit: (Number(progress[0].totalProfit) + (totalRevenue - inventoryCost)).toString(),
        inventoryValue: Math.max(0, Number(progress[0].inventoryValue) - inventoryCost).toString()
      });
    }

    return updatedRecord;
  }

  /**
   * Check and alert for low stock items
   */
  static async checkLowStock(userId: string, taskId: string): Promise<any[]> {
    const inventoryRecords = await storage.getInventoryRecords(userId, taskId);
    const products = await storage.getProducts();
    
    const alerts = [];
    
    for (const record of inventoryRecords) {
      const product = products.find(p => p.id === record.productId);
      if (!product) continue;
      
      const safetyStock = product.safetyStock || 10;
      
      if (record.currentStock <= safetyStock) {
        alerts.push({
          productId: record.productId,
          productName: product.name,
          currentStock: record.currentStock,
          safetyStock: safetyStock,
          severity: record.currentStock === 0 ? 'critical' : 'warning',
          recommendation: `建议补货 ${safetyStock * 2} 件`
        });
      }
    }
    
    return alerts;
  }

  /**
   * Calculate optimal reorder quantity using EOQ formula
   */
  static async calculateReorderQuantity(
    productId: string,
    averageDemand: number,
    orderingCost: number,
    holdingCost: number
  ): Promise<number> {
    // Economic Order Quantity (EOQ) formula
    // EOQ = sqrt((2 * D * S) / H)
    // D = Annual demand
    // S = Ordering cost per order
    // H = Holding cost per unit per year
    
    const annualDemand = averageDemand * 365;
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
    
    return Math.ceil(eoq);
  }

  /**
   * Get inventory turnover analysis
   */
  static async analyzeInventoryTurnover(
    userId: string,
    taskId: string
  ): Promise<any> {
    const inventoryRecords = await storage.getInventoryRecords(userId, taskId);
    const orders = await storage.getOrders(userId, taskId);
    const products = await storage.getProducts();
    
    const analysis = [];
    
    for (const record of inventoryRecords) {
      const product = products.find(p => p.id === record.productId);
      if (!product) continue;
      
      // Calculate sales for this product
      const salesOrders = orders.filter(o => 
        o.orderType === 'sale' && 
        o.status === 'completed' &&
        (o.orderItems as any[])?.some(item => item.productId === record.productId)
      );
      
      const totalSold = salesOrders.reduce((sum, order) => {
        const items = order.orderItems as any[] || [];
        const productItems = items.filter(item => item.productId === record.productId);
        return sum + productItems.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }, 0);
      
      const avgInventory = record.currentStock;
      const turnoverRate = avgInventory > 0 ? totalSold / avgInventory : 0;
      
      analysis.push({
        productId: record.productId,
        productName: product.name,
        currentStock: record.currentStock,
        totalSold,
        turnoverRate,
        performance: turnoverRate > 4 ? '优秀' : turnoverRate > 2 ? '良好' : '需改进'
      });
    }
    
    return analysis;
  }

  /**
   * Generate inventory optimization suggestions
   */
  static async generateOptimizationSuggestions(
    userId: string,
    taskId: string
  ): Promise<string[]> {
    const lowStock = await this.checkLowStock(userId, taskId);
    const turnoverAnalysis = await this.analyzeInventoryTurnover(userId, taskId);
    
    const suggestions = [];
    
    // Low stock suggestions
    if (lowStock.length > 0) {
      const criticalItems = lowStock.filter(item => item.severity === 'critical');
      if (criticalItems.length > 0) {
        suggestions.push(`紧急: ${criticalItems.length}个产品已断货，需立即补货`);
      }
      
      const warningItems = lowStock.filter(item => item.severity === 'warning');
      if (warningItems.length > 0) {
        suggestions.push(`警告: ${warningItems.length}个产品库存低于安全库存`);
      }
    }
    
    // Turnover suggestions
    const slowMoving = turnoverAnalysis.filter(item => item.performance === '需改进');
    if (slowMoving.length > 0) {
      suggestions.push(`${slowMoving.length}个产品周转率低，建议促销或减少采购`);
    }
    
    const fastMoving = turnoverAnalysis.filter(item => item.performance === '优秀');
    if (fastMoving.length > 0) {
      suggestions.push(`${fastMoving.length}个产品销售良好，可考虑增加库存`);
    }
    
    // General suggestions
    if (suggestions.length === 0) {
      suggestions.push('库存状态良好，继续保持当前管理策略');
    }
    
    return suggestions;
  }

  /**
   * Calculate inventory holding costs
   */
  static async calculateHoldingCosts(
    userId: string,
    taskId: string
  ): Promise<number> {
    const inventoryRecords = await storage.getInventoryRecords(userId, taskId);
    const products = await storage.getProducts();
    
    let totalHoldingCost = 0;
    
    for (const record of inventoryRecords) {
      const product = products.find(p => p.id === record.productId);
      if (!product) continue;
      
      // Assume holding cost is 20% of product value per year
      const unitValue = Number(product.unitPrice);
      const holdingCostPerUnit = unitValue * 0.20 / 365; // Daily holding cost
      const dailyHoldingCost = record.currentStock * holdingCostPerUnit;
      
      totalHoldingCost += dailyHoldingCost;
    }
    
    return totalHoldingCost;
  }
}