import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  integer,
  text,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['student', 'teacher', 'admin']);

// User storage table with conventional authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  role: userRoleEnum("role").default('student'),
  studentId: varchar("student_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training tasks table
export const trainingTasks = pgTable("training_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  initialBudget: decimal("initial_budget", { precision: 15, scale: 2 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  marketScenario: jsonb("market_scenario"),
  targetKpis: jsonb("target_kpis"),
  createdBy: varchar("created_by").references(() => users.id),
  status: varchar("status").default('draft'), // draft, active, completed, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student progress table
export const studentProgress = pgTable("student_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  taskId: varchar("task_id").references(() => trainingTasks.id).notNull(),
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).notNull(),
  currentDay: integer("current_day").default(1),
  inventoryValue: decimal("inventory_value", { precision: 15, scale: 2 }).default('0'),
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).default('0'),
  totalProfit: decimal("total_profit", { precision: 15, scale: 2 }).default('0'),
  kpiScores: jsonb("kpi_scores"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  products: jsonb("products"), // Array of product categories
  rating: decimal("rating", { precision: 2, scale: 1 }).default('0'),
  reliability: integer("reliability").default(0), // 0-100
  qualityLevel: varchar("quality_level").default('medium'), // low, medium, high
  cooperationYears: integer("cooperation_years").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products/Inventory table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: varchar("sku", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  safetyStock: integer("safety_stock").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory records table
export const inventoryRecords = pgTable("inventory_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  taskId: varchar("task_id").references(() => trainingTasks.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  currentStock: integer("current_stock").default(0),
  reservedStock: integer("reserved_stock").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Orders table (procurement and sales)
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number", { length: 50 }).unique().notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  taskId: varchar("task_id").references(() => trainingTasks.id).notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  orderType: varchar("order_type").notNull(), // purchase, sale
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status").default('pending'), // pending, confirmed, completed, cancelled
  orderItems: jsonb("order_items"), // Array of {productId, quantity, unitPrice}
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Financial records table
export const financialRecords = pgTable("financial_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  taskId: varchar("task_id").references(() => trainingTasks.id).notNull(),
  recordType: varchar("record_type").notNull(), // income, expense, investment
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  category: varchar("category"), // procurement, sales, operational, etc.
  relatedOrderId: varchar("related_order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Evaluation records table
export const evaluationRecords = pgTable("evaluation_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  taskId: varchar("task_id").references(() => trainingTasks.id).notNull(),
  financialScore: integer("financial_score"), // 0-100
  operationalScore: integer("operational_score"), // 0-100
  decisionScore: integer("decision_score"), // 0-100
  learningScore: integer("learning_score"), // 0-100
  totalScore: integer("total_score"), // 0-100
  grade: varchar("grade"), // A, B, C, D, F
  feedback: text("feedback"),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Market data table (for simulation)
export const marketData = pgTable("market_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: varchar("category", { length: 100 }).notNull(),
  demandLevel: integer("demand_level"), // 0-100
  competitionLevel: integer("competition_level"), // 0-100
  priceIndex: decimal("price_index", { precision: 5, scale: 2 }).default('1.00'),
  trendDirection: varchar("trend_direction").default('stable'), // rising, falling, stable
  marketEvents: jsonb("market_events"), // Array of current market events
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(trainingTasks),
  progress: many(studentProgress),
  orders: many(orders),
  financialRecords: many(financialRecords),
  evaluations: many(evaluationRecords),
  inventoryRecords: many(inventoryRecords),
}));

export const trainingTasksRelations = relations(trainingTasks, ({ one, many }) => ({
  creator: one(users, {
    fields: [trainingTasks.createdBy],
    references: [users.id],
  }),
  progress: many(studentProgress),
  orders: many(orders),
  financialRecords: many(financialRecords),
  evaluations: many(evaluationRecords),
  inventoryRecords: many(inventoryRecords),
}));

export const studentProgressRelations = relations(studentProgress, ({ one }) => ({
  user: one(users, {
    fields: [studentProgress.userId],
    references: [users.id],
  }),
  task: one(trainingTasks, {
    fields: [studentProgress.taskId],
    references: [trainingTasks.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  task: one(trainingTasks, {
    fields: [orders.taskId],
    references: [trainingTasks.id],
  }),
  supplier: one(suppliers, {
    fields: [orders.supplierId],
    references: [suppliers.id],
  }),
}));

export const inventoryRecordsRelations = relations(inventoryRecords, ({ one }) => ({
  user: one(users, {
    fields: [inventoryRecords.userId],
    references: [users.id],
  }),
  task: one(trainingTasks, {
    fields: [inventoryRecords.taskId],
    references: [trainingTasks.id],
  }),
  product: one(products, {
    fields: [inventoryRecords.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("请输入有效的邮箱地址").optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号码").optional(),
  password: z.string().min(6, "密码至少6个字符"),
  name: z.string().min(1, "请输入姓名").optional(),
}).refine(data => data.email || data.phone, {
  message: "请提供邮箱或手机号",
  path: ["email"],
});

export const insertTrainingTaskSchema = createInsertSchema(trainingTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentProgressSchema = createInsertSchema(studentProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertInventoryRecordSchema = createInsertSchema(inventoryRecords).omit({
  id: true,
  lastUpdated: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertFinancialRecordSchema = createInsertSchema(financialRecords).omit({
  id: true,
  createdAt: true,
});

export const insertEvaluationRecordSchema = createInsertSchema(evaluationRecords).omit({
  id: true,
  completedAt: true,
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  id: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type TrainingTask = typeof trainingTasks.$inferSelect;
export type InsertTrainingTask = z.infer<typeof insertTrainingTaskSchema>;
export type StudentProgress = typeof studentProgress.$inferSelect;
export type InsertStudentProgress = z.infer<typeof insertStudentProgressSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InventoryRecord = typeof inventoryRecords.$inferSelect;
export type InsertInventoryRecord = z.infer<typeof insertInventoryRecordSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type FinancialRecord = typeof financialRecords.$inferSelect;
export type InsertFinancialRecord = z.infer<typeof insertFinancialRecordSchema>;
export type EvaluationRecord = typeof evaluationRecords.$inferSelect;
export type InsertEvaluationRecord = z.infer<typeof insertEvaluationRecordSchema>;
export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;
