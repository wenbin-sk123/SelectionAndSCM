import {
  users,
  trainingTasks,
  studentProgress,
  suppliers,
  products,
  inventoryRecords,
  orders,
  financialRecords,
  evaluationRecords,
  marketData,
  type User,
  type UpsertUser,
  type TrainingTask,
  type InsertTrainingTask,
  type StudentProgress,
  type InsertStudentProgress,
  type Supplier,
  type InsertSupplier,
  type Product,
  type InsertProduct,
  type InventoryRecord,
  type InsertInventoryRecord,
  type Order,
  type InsertOrder,
  type FinancialRecord,
  type InsertFinancialRecord,
  type EvaluationRecord,
  type InsertEvaluationRecord,
  type MarketData,
  type InsertMarketData,
  type InsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Training task operations
  getTrainingTasks(createdBy?: string): Promise<TrainingTask[]>;
  createTrainingTask(task: InsertTrainingTask): Promise<TrainingTask>;
  updateTrainingTask(id: string, updates: Partial<InsertTrainingTask>): Promise<TrainingTask>;
  getTrainingTask(id: string): Promise<TrainingTask | undefined>;
  
  // Student progress operations
  getStudentProgress(userId: string, taskId?: string): Promise<StudentProgress[]>;
  upsertStudentProgress(progress: InsertStudentProgress): Promise<StudentProgress>;
  
  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: string): Promise<Product | undefined>;
  
  // Inventory operations
  getInventoryRecords(userId: string, taskId: string): Promise<InventoryRecord[]>;
  upsertInventoryRecord(record: InsertInventoryRecord): Promise<InventoryRecord>;
  
  // Order operations
  getOrders(userId: string, taskId?: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order>;
  
  // Financial operations
  getFinancialRecords(userId: string, taskId: string): Promise<FinancialRecord[]>;
  createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord>;
  
  // Evaluation operations
  getEvaluationRecords(userId: string, taskId?: string): Promise<EvaluationRecord[]>;
  createEvaluationRecord(record: InsertEvaluationRecord): Promise<EvaluationRecord>;
  
  // Market data operations
  getMarketData(): Promise<MarketData[]>;
  updateMarketData(category: string, data: Partial<InsertMarketData>): Promise<MarketData>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Training task operations
  async getTrainingTasks(createdBy?: string): Promise<TrainingTask[]> {
    if (createdBy) {
      return await db.select().from(trainingTasks).where(eq(trainingTasks.createdBy, createdBy)).orderBy(desc(trainingTasks.createdAt));
    }
    return await db.select().from(trainingTasks).orderBy(desc(trainingTasks.createdAt));
  }

  async createTrainingTask(task: InsertTrainingTask): Promise<TrainingTask> {
    const [newTask] = await db.insert(trainingTasks).values(task).returning();
    return newTask;
  }

  async updateTrainingTask(id: string, updates: Partial<InsertTrainingTask>): Promise<TrainingTask> {
    const [updatedTask] = await db
      .update(trainingTasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trainingTasks.id, id))
      .returning();
    return updatedTask;
  }

  async getTrainingTask(id: string): Promise<TrainingTask | undefined> {
    const [task] = await db.select().from(trainingTasks).where(eq(trainingTasks.id, id));
    return task;
  }

  // Student progress operations
  async getStudentProgress(userId: string, taskId?: string): Promise<StudentProgress[]> {
    if (taskId) {
      return await db.select().from(studentProgress)
        .where(and(eq(studentProgress.userId, userId), eq(studentProgress.taskId, taskId)));
    }
    return await db.select().from(studentProgress).where(eq(studentProgress.userId, userId));
  }

  async upsertStudentProgress(progress: InsertStudentProgress): Promise<StudentProgress> {
    const [existingProgress] = await db.select().from(studentProgress)
      .where(and(eq(studentProgress.userId, progress.userId), eq(studentProgress.taskId, progress.taskId)));

    if (existingProgress) {
      const [updated] = await db
        .update(studentProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(eq(studentProgress.id, existingProgress.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(studentProgress).values(progress).returning();
      return created;
    }
  }

  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(desc(suppliers.rating));
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(asc(products.category), asc(products.name));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  // Inventory operations
  async getInventoryRecords(userId: string, taskId: string): Promise<InventoryRecord[]> {
    return await db.select().from(inventoryRecords)
      .where(and(eq(inventoryRecords.userId, userId), eq(inventoryRecords.taskId, taskId)));
  }

  async upsertInventoryRecord(record: InsertInventoryRecord): Promise<InventoryRecord> {
    const [existing] = await db.select().from(inventoryRecords)
      .where(and(
        eq(inventoryRecords.userId, record.userId),
        eq(inventoryRecords.taskId, record.taskId),
        eq(inventoryRecords.productId, record.productId)
      ));

    if (existing) {
      const [updated] = await db
        .update(inventoryRecords)
        .set({ ...record, lastUpdated: new Date() })
        .where(eq(inventoryRecords.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(inventoryRecords).values(record).returning();
      return created;
    }
  }

  // Order operations
  async getOrders(userId: string, taskId?: string): Promise<Order[]> {
    if (taskId) {
      return await db.select().from(orders)
        .where(and(eq(orders.userId, userId), eq(orders.taskId, taskId)))
        .orderBy(desc(orders.createdAt));
    }
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Financial operations
  async getFinancialRecords(userId: string, taskId: string): Promise<FinancialRecord[]> {
    return await db.select().from(financialRecords)
      .where(and(eq(financialRecords.userId, userId), eq(financialRecords.taskId, taskId)))
      .orderBy(desc(financialRecords.createdAt));
  }

  async createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord> {
    const [newRecord] = await db.insert(financialRecords).values(record).returning();
    return newRecord;
  }

  // Evaluation operations
  async getEvaluationRecords(userId: string, taskId?: string): Promise<EvaluationRecord[]> {
    if (taskId) {
      return await db.select().from(evaluationRecords)
        .where(and(eq(evaluationRecords.userId, userId), eq(evaluationRecords.taskId, taskId)));
    }
    return await db.select().from(evaluationRecords).where(eq(evaluationRecords.userId, userId));
  }

  async createEvaluationRecord(record: InsertEvaluationRecord): Promise<EvaluationRecord> {
    const [newRecord] = await db.insert(evaluationRecords).values(record).returning();
    return newRecord;
  }

  // Market data operations
  async getMarketData(): Promise<MarketData[]> {
    return await db.select().from(marketData).orderBy(asc(marketData.category));
  }

  async updateMarketData(category: string, data: Partial<InsertMarketData>): Promise<MarketData> {
    const [existing] = await db.select().from(marketData).where(eq(marketData.category, category));

    if (existing) {
      const [updated] = await db
        .update(marketData)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(marketData.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(marketData).values({ ...data, category } as InsertMarketData).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
