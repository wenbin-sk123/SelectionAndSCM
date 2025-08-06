/**
 * Training Task Service - Core Business Logic
 * Handles task execution, progress tracking, and evaluation
 */

import { storage } from '../storage';
import { 
  TrainingTask, 
  StudentProgress, 
  FinancialRecord,
  InventoryRecord,
  Order,
  EvaluationRecord 
} from '@shared/schema';

export class TaskService {
  /**
   * Start a training task for a student
   * Initialize progress with starting capital and inventory
   */
  static async startTask(userId: string, taskId: string): Promise<StudentProgress> {
    // Get the task details
    const task = await storage.getTrainingTask(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    // Check if already started
    const existingProgress = await storage.getStudentProgress(userId, taskId);
    if (existingProgress.length > 0) {
      return existingProgress[0];
    }

    // Initialize student progress
    const initialProgress = {
      userId,
      taskId,
      currentBalance: Number(task.initialBudget),
      currentDay: 1,
      inventoryValue: 0,
      totalRevenue: 0,
      totalProfit: 0,
      kpiScores: {
        financial: 0,
        operational: 0,
        decision: 0,
        learning: 0
      },
      status: 'active' as const
    };

    // Create initial financial record
    await storage.createFinancialRecord({
      userId,
      taskId,
      recordType: 'income',
      amount: task.initialBudget,
      description: '初始启动资金',
      category: 'initial'
    });

    return await storage.upsertStudentProgress(initialProgress);
  }

  /**
   * Advance task to next day
   * Simulate market changes and update metrics
   */
  static async advanceDay(userId: string, taskId: string): Promise<StudentProgress> {
    const progressArray = await storage.getStudentProgress(userId, taskId);
    if (!progressArray || progressArray.length === 0) {
      throw new Error('请先开始任务');
    }

    const progress = progressArray[0];
    const task = await storage.getTrainingTask(taskId);
    
    if (!task) {
      throw new Error('任务不存在');
    }

    // Check if task is complete
    if (progress.currentDay >= task.durationDays) {
      throw new Error('任务已完成');
    }

    // Simulate daily costs (rent, salary, etc.)
    const dailyCost = Number(progress.currentBalance) * 0.01; // 1% daily operational cost
    const newBalance = Number(progress.currentBalance) - dailyCost;

    // Record daily operational cost
    await storage.createFinancialRecord({
      userId,
      taskId,
      recordType: 'expense',
      amount: dailyCost.toString(),
      description: `第${progress.currentDay}天运营成本`,
      category: 'operational'
    });

    // Update progress
    const updatedProgress = {
      ...progress,
      currentDay: progress.currentDay + 1,
      currentBalance: newBalance.toString()
    };

    // Calculate and update KPIs
    const kpiScores = await this.calculateKPIs(userId, taskId, updatedProgress);
    updatedProgress.kpiScores = kpiScores;

    return await storage.upsertStudentProgress(updatedProgress);
  }

  /**
   * Calculate KPI scores based on performance
   */
  static async calculateKPIs(
    userId: string, 
    taskId: string, 
    progress: StudentProgress
  ): Promise<any> {
    // Get all financial records
    const financialRecords = await storage.getFinancialRecords(userId, taskId);
    const orders = await storage.getOrders(userId, taskId);
    
    // Financial KPI (40% weight)
    const totalIncome = financialRecords
      .filter(r => r.recordType === 'income')
      .reduce((sum, r) => sum + Number(r.amount), 0);
    
    const totalExpense = financialRecords
      .filter(r => r.recordType === 'expense')
      .reduce((sum, r) => sum + Number(r.amount), 0);
    
    const profitMargin = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const financialScore = Math.min(100, Math.max(0, profitMargin * 2)); // Scale to 0-100

    // Operational KPI (30% weight)
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalOrders = orders.length;
    const fulfillmentRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const operationalScore = Math.min(100, fulfillmentRate);

    // Decision KPI (20% weight)
    const inventoryTurnover = await this.calculateInventoryTurnover(userId, taskId);
    const decisionScore = Math.min(100, inventoryTurnover * 10); // Scale based on turnover

    // Learning KPI (10% weight)
    const daysActive = progress.currentDay;
    const task = await storage.getTrainingTask(taskId);
    const progressRate = task ? (daysActive / task.durationDays) * 100 : 0;
    const learningScore = Math.min(100, progressRate);

    return {
      financial: Math.round(financialScore),
      operational: Math.round(operationalScore),
      decision: Math.round(decisionScore),
      learning: Math.round(learningScore),
      total: Math.round(
        financialScore * 0.4 + 
        operationalScore * 0.3 + 
        decisionScore * 0.2 + 
        learningScore * 0.1
      )
    };
  }

  /**
   * Calculate inventory turnover rate
   */
  static async calculateInventoryTurnover(userId: string, taskId: string): Promise<number> {
    const inventoryRecords = await storage.getInventoryRecords(userId, taskId);
    const orders = await storage.getOrders(userId, taskId);
    
    const salesOrders = orders.filter(o => o.orderType === 'sale' && o.status === 'completed');
    const totalSold = salesOrders.reduce((sum, order) => {
      const items = order.orderItems as any[] || [];
      return sum + items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    const avgInventory = inventoryRecords.reduce((sum, r) => sum + r.currentStock, 0) / Math.max(1, inventoryRecords.length);
    
    return avgInventory > 0 ? totalSold / avgInventory : 0;
  }

  /**
   * Complete task and generate final evaluation
   */
  static async completeTask(userId: string, taskId: string): Promise<EvaluationRecord> {
    const progressArray = await storage.getStudentProgress(userId, taskId);
    if (!progressArray || progressArray.length === 0) {
      throw new Error('任务未开始');
    }

    const progress = progressArray[0];
    const kpiScores = await this.calculateKPIs(userId, taskId, progress);
    
    // Calculate final grade
    const totalScore = kpiScores.total;
    let grade = 'F';
    if (totalScore >= 90) grade = 'A';
    else if (totalScore >= 80) grade = 'B';
    else if (totalScore >= 70) grade = 'C';
    else if (totalScore >= 60) grade = 'D';

    // Generate feedback
    const feedback = this.generateFeedback(kpiScores, grade);

    // Create evaluation record
    const evaluation = await storage.createEvaluationRecord({
      userId,
      taskId,
      financialScore: kpiScores.financial,
      operationalScore: kpiScores.operational,
      decisionScore: kpiScores.decision,
      learningScore: kpiScores.learning,
      totalScore: kpiScores.total,
      grade,
      feedback
    });

    // Update progress status
    await storage.upsertStudentProgress({
      ...progress,
      status: 'completed'
    });

    return evaluation;
  }

  /**
   * Generate personalized feedback based on performance
   */
  static generateFeedback(kpiScores: any, grade: string): string {
    const feedback = [`综合评级: ${grade}`];

    // Financial feedback
    if (kpiScores.financial >= 80) {
      feedback.push('财务管理优秀，利润率控制得当');
    } else if (kpiScores.financial >= 60) {
      feedback.push('财务表现良好，但仍有提升空间');
    } else {
      feedback.push('需要加强成本控制和利润管理');
    }

    // Operational feedback
    if (kpiScores.operational >= 80) {
      feedback.push('运营效率高，订单履约率优秀');
    } else if (kpiScores.operational >= 60) {
      feedback.push('运营管理合格，可以优化流程');
    } else {
      feedback.push('运营效率需要改进，关注订单完成率');
    }

    // Decision feedback
    if (kpiScores.decision >= 80) {
      feedback.push('决策能力强，库存周转优秀');
    } else if (kpiScores.decision >= 60) {
      feedback.push('决策水平良好，可以优化库存管理');
    } else {
      feedback.push('需要改进采购和库存决策');
    }

    // Learning feedback
    if (kpiScores.learning >= 80) {
      feedback.push('学习进度优秀，任务完成度高');
    } else if (kpiScores.learning >= 60) {
      feedback.push('学习进度正常');
    } else {
      feedback.push('需要加快学习进度');
    }

    return feedback.join('\n');
  }

  /**
   * Get task statistics for dashboard
   */
  static async getTaskStatistics(userId: string, taskId: string): Promise<any> {
    const progress = await storage.getStudentProgress(userId, taskId);
    if (!progress || progress.length === 0) {
      return null;
    }

    const financialRecords = await storage.getFinancialRecords(userId, taskId);
    const orders = await storage.getOrders(userId, taskId);
    const inventoryRecords = await storage.getInventoryRecords(userId, taskId);

    const totalRevenue = financialRecords
      .filter(r => r.recordType === 'income' && r.category !== 'initial')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const totalCost = financialRecords
      .filter(r => r.recordType === 'expense')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;

    const totalInventoryValue = inventoryRecords.reduce((sum, r) => {
      // This would need product price lookup in real implementation
      return sum + (r.currentStock * 100); // Placeholder calculation
    }, 0);

    return {
      currentBalance: Number(progress[0].currentBalance),
      currentDay: progress[0].currentDay,
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      pendingOrders,
      completedOrders,
      totalInventoryValue,
      kpiScores: progress[0].kpiScores
    };
  }
}