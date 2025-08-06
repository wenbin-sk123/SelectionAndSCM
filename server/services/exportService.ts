import * as XLSX from 'xlsx';
import { db } from '../db';
import { financialRecords, evaluationRecords, orders, inventoryRecords, suppliers, products } from '@shared/schema';
import { eq, and, between, desc } from 'drizzle-orm';

export class ExportService {
  /**
   * Export financial report to Excel
   */
  static async exportFinancialReport(userId: string, taskId: string, startDate?: Date, endDate?: Date) {
    try {
      // Fetch financial data
      let query = db.select().from(financialRecords).where(eq(financialRecords.userId, userId));
      
      if (taskId && taskId !== 'all') {
        query = query.where(eq(financialRecords.taskId, taskId));
      }
      
      if (startDate && endDate) {
        query = query.where(
          and(
            between(financialRecords.createdAt, startDate, endDate)
          )
        );
      }
      
      const records = await query;
      
      // Transform data for Excel
      const excelData = records.map(record => ({
        '记录ID': record.id || '',
        '任务ID': record.taskId || '',
        '类型': record.recordType === 'income' ? '收入' : 
               record.recordType === 'expense' ? '支出' : 
               record.recordType === 'investment' ? '投资' : '其他',
        '金额': record.amount || 0,
        '描述': record.description || '',
        '分类': record.category || '',
        '创建时间': record.createdAt?.toLocaleDateString('zh-CN') || '',
      }));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // If no data, create empty sheet with headers
      if (excelData.length === 0) {
        excelData.push({
          '记录ID': '',
          '任务ID': '',
          '类型': '暂无数据',
          '金额': 0,
          '描述': '',
          '分类': '',
          '创建时间': '',
        });
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, '财务报表');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      return buffer;
    } catch (error) {
      console.error('Error exporting financial report:', error);
      throw error;
    }
  }

  /**
   * Export evaluation report to Excel
   */
  static async exportEvaluationReport(userId: string, taskId?: string) {
    try {
      // Fetch evaluation data
      let query = db.select().from(evaluationRecords).where(eq(evaluationRecords.userId, userId));
      
      if (taskId && taskId !== 'all') {
        query = query.where(eq(evaluationRecords.taskId, taskId));
      }
      
      const records = await query.orderBy(desc(evaluationRecords.completedAt));
      
      // Transform data for Excel
      const excelData = records.map(record => ({
        '评估ID': record.id || '',
        '任务ID': record.taskId || '',
        '财务得分': record.financialScore || 0,
        '运营得分': record.operationalScore || 0,
        '决策得分': record.decisionScore || 0,
        '学习得分': record.learningScore || 0,
        '总分': record.totalScore || 0,
        '等级': record.grade || '',
        '评语': record.feedback || '',
        '完成时间': record.completedAt?.toLocaleDateString('zh-CN') || '',
      }));
      
      // If no data, create empty sheet with headers
      if (excelData.length === 0) {
        excelData.push({
          '评估ID': '',
          '任务ID': '',
          '财务得分': 0,
          '运营得分': 0,
          '决策得分': 0,
          '学习得分': 0,
          '总分': 0,
          '等级': '暂无数据',
          '评语': '',
          '完成时间': '',
        });
      }
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, '评估报告');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      return buffer;
    } catch (error) {
      console.error('Error exporting evaluation report:', error);
      throw error;
    }
  }

  /**
   * Export inventory report to Excel
   */
  static async exportInventoryReport(userId: string, taskId: string) {
    try {
      // Fetch inventory data
      const records = await db.select({
        id: inventoryRecords.id,
        productId: inventoryRecords.productId,
        productName: products.name,
        sku: products.sku,
        category: products.category,
        currentStock: inventoryRecords.currentStock,
        reservedStock: inventoryRecords.reservedStock,
        safetyStock: products.safetyStock,
        unitPrice: products.unitPrice,
        lastUpdated: inventoryRecords.lastUpdated,
      })
      .from(inventoryRecords)
      .leftJoin(products, eq(inventoryRecords.productId, products.id))
      .where(
        and(
          eq(inventoryRecords.userId, userId),
          eq(inventoryRecords.taskId, taskId)
        )
      );
      
      // Transform data for Excel
      const excelData = records.map(record => ({
        '库存ID': record.id || '',
        'SKU': record.sku || '',
        '商品名称': record.productName || '',
        '分类': record.category || '',
        '当前库存': record.currentStock || 0,
        '预留库存': record.reservedStock || 0,
        '安全库存': record.safetyStock || 0,
        '单价': record.unitPrice || 0,
        '库存价值': (record.currentStock || 0) * (Number(record.unitPrice) || 0),
        '状态': (record.currentStock || 0) < (record.safetyStock || 0) ? '库存不足' : '正常',
        '更新时间': record.lastUpdated?.toLocaleDateString('zh-CN') || '',
      }));
      
      // Calculate summary
      const totalValue = excelData.reduce((sum, item) => sum + (item['库存价值'] || 0), 0);
      const totalItems = excelData.reduce((sum, item) => sum + (item['当前库存'] || 0), 0);
      
      // Add summary row if there's data
      if (excelData.length > 0) {
        excelData.push({
          '库存ID': '',
          'SKU': '',
          '商品名称': '合计',
          '分类': '',
          '当前库存': totalItems,
          '预留库存': 0,
          '安全库存': 0,
          '单价': 0,
          '库存价值': totalValue,
          '状态': '',
          '更新时间': '',
        });
      }
      
      // If no data, create empty sheet with headers
      if (excelData.length === 0) {
        excelData.push({
          '库存ID': '',
          'SKU': '',
          '商品名称': '暂无数据',
          '分类': '',
          '当前库存': 0,
          '预留库存': 0,
          '安全库存': 0,
          '单价': 0,
          '库存价值': 0,
          '状态': '',
          '更新时间': '',
        });
      }
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, '库存报表');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      return buffer;
    } catch (error) {
      console.error('Error exporting inventory report:', error);
      throw error;
    }
  }

  /**
   * Export orders report to Excel
   */
  static async exportOrdersReport(userId: string, taskId: string, orderType?: 'purchase' | 'sale') {
    try {
      // Fetch orders data
      let query = db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        orderType: orders.orderType,
        supplierName: suppliers.name,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(suppliers, eq(orders.supplierId, suppliers.id))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.taskId, taskId)
        )
      );
      
      if (orderType) {
        query = query.where(eq(orders.orderType, orderType));
      }
      
      const records = await query.orderBy(desc(orders.createdAt));
      
      // Transform data for Excel
      const excelData = records.map(record => ({
        '订单ID': record.id || '',
        '订单号': record.orderNumber || '',
        '订单类型': record.orderType === 'purchase' ? '采购订单' : '销售订单',
        '供应商': record.supplierName || '-',
        '总金额': Number(record.totalAmount) || 0,
        '状态': record.status === 'pending' ? '待处理' :
                record.status === 'confirmed' ? '已确认' :
                record.status === 'completed' ? '已完成' :
                record.status === 'cancelled' ? '已取消' : record.status,
        '创建时间': record.createdAt?.toLocaleDateString('zh-CN') || '',
      }));
      
      // Calculate summary
      const totalAmount = excelData.reduce((sum, item) => sum + (item['总金额'] || 0), 0);
      const purchaseCount = excelData.filter(item => item['订单类型'] === '采购订单').length;
      const saleCount = excelData.filter(item => item['订单类型'] === '销售订单').length;
      
      // Add summary rows if there's data
      if (excelData.length > 0) {
        excelData.push({
          '订单ID': '',
          '订单号': '',
          '订单类型': '统计',
          '供应商': `采购订单: ${purchaseCount}`,
          '总金额': totalAmount,
          '状态': `总订单数: ${excelData.length}`,
          '创建时间': '',
        });
      }
      
      // If no data, create empty sheet with headers
      if (excelData.length === 0) {
        excelData.push({
          '订单ID': '',
          '订单号': '',
          '订单类型': '暂无数据',
          '供应商': '',
          '总金额': 0,
          '状态': '',
          '创建时间': '',
        });
      }
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, '订单报表');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      return buffer;
    } catch (error) {
      console.error('Error exporting orders report:', error);
      throw error;
    }
  }

  /**
   * Export comprehensive report with multiple sheets
   */
  static async exportComprehensiveReport(userId: string, taskId: string) {
    try {
      const wb = XLSX.utils.book_new();
      
      // Fetch all data
      const [financialData, evaluationData, inventoryData, ordersData] = await Promise.all([
        db.select().from(financialRecords).where(
          and(
            eq(financialRecords.userId, userId),
            eq(financialRecords.taskId, taskId)
          )
        ),
        db.select().from(evaluationRecords).where(
          and(
            eq(evaluationRecords.userId, userId),
            eq(evaluationRecords.taskId, taskId)
          )
        ),
        db.select({
          productName: products.name,
          sku: products.sku,
          category: products.category,
          currentStock: inventoryRecords.currentStock,
          reservedStock: inventoryRecords.reservedStock,
          safetyStock: products.safetyStock,
          unitPrice: products.unitPrice,
        })
        .from(inventoryRecords)
        .leftJoin(products, eq(inventoryRecords.productId, products.id))
        .where(
          and(
            eq(inventoryRecords.userId, userId),
            eq(inventoryRecords.taskId, taskId)
          )
        ),
        db.select({
          orderNumber: orders.orderNumber,
          orderType: orders.orderType,
          supplierName: suppliers.name,
          totalAmount: orders.totalAmount,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .leftJoin(suppliers, eq(orders.supplierId, suppliers.id))
        .where(
          and(
            eq(orders.userId, userId),
            eq(orders.taskId, taskId)
          )
        ),
      ]);
      
      // Add financial sheet
      if (financialData.length > 0) {
        const financialSheet = financialData.map(record => ({
          '类型': record.type,
          '金额': record.amount,
          '描述': record.description,
          '日期': record.createdAt?.toLocaleDateString('zh-CN'),
        }));
        const ws1 = XLSX.utils.json_to_sheet(financialSheet);
        XLSX.utils.book_append_sheet(wb, ws1, '财务数据');
      }
      
      // Add evaluation sheet
      if (evaluationData.length > 0) {
        const evaluationSheet = evaluationData.map(record => ({
          '总分': record.totalScore,
          '评级': record.grade,
          '财务表现': record.financialPerformance,
          '运营效率': record.operationalEfficiency,
          '市场洞察': record.marketInsight,
          '风险控制': record.riskControl,
          '学习能力': record.learningAbility,
          '日期': record.createdAt?.toLocaleDateString('zh-CN'),
        }));
        const ws2 = XLSX.utils.json_to_sheet(evaluationSheet);
        XLSX.utils.book_append_sheet(wb, ws2, '评估数据');
      }
      
      // Add inventory sheet
      if (inventoryData.length > 0) {
        const inventorySheet = inventoryData.map(record => ({
          'SKU': record.sku,
          '商品名称': record.productName,
          '分类': record.category,
          '当前库存': record.currentStock,
          '安全库存': record.safetyStock,
          '单价': record.unitPrice,
          '库存价值': (record.currentStock || 0) * (record.unitPrice || 0),
          '状态': record.status,
        }));
        const ws3 = XLSX.utils.json_to_sheet(inventorySheet);
        XLSX.utils.book_append_sheet(wb, ws3, '库存数据');
      }
      
      // Add orders sheet
      if (ordersData.length > 0) {
        const ordersSheet = ordersData.map(record => ({
          '订单类型': record.orderType === 'purchase' ? '采购' : '销售',
          '供应商/客户': record.supplierName || record.customerName || '-',
          '总金额': record.totalAmount,
          '状态': record.status,
          '日期': record.createdAt?.toLocaleDateString('zh-CN'),
        }));
        const ws4 = XLSX.utils.json_to_sheet(ordersSheet);
        XLSX.utils.book_append_sheet(wb, ws4, '订单数据');
      }
      
      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      return buffer;
    } catch (error) {
      console.error('Error exporting comprehensive report:', error);
      throw error;
    }
  }
}