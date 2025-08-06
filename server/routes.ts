import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword, comparePasswords } from "./auth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { 
  insertTrainingTaskSchema,
  insertStudentProgressSchema,
  insertOrderSchema,
  insertFinancialRecordSchema,
  insertInventoryRecordSchema,
  insertEvaluationRecordSchema,
  insertSupplierSchema,
  insertProductSchema,
  insertMarketDataSchema,
  insertUserSchema,
} from "@shared/schema";
import { z } from "zod";
import passport from "passport";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Registration route
  app.post("/api/register", async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      if (userData.email) {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser) {
          return res.status(400).json({ message: "邮箱已被注册" });
        }
      }
      
      if (userData.phone) {
        const existingUser = await storage.getUserByPhone(userData.phone);
        if (existingUser) {
          return res.status(400).json({ message: "手机号已被注册" });
        }
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "注册失败" });
    }
  });

  // Login routes
  app.post("/api/login", async (req, res, next) => {
    const { email, phone, password } = req.body;
    
    if (!password || (!email && !phone)) {
      return res.status(400).json({ message: "请提供邮箱或手机号以及密码" });
    }

    const strategy = email ? 'local-email' : 'local-phone';
    
    passport.authenticate(strategy, (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "登录失败" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.put('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates: any = {};
      
      // Only allow updating certain fields
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.avatarUrl !== undefined) updates.avatarUrl = req.body.avatarUrl;
      
      const updatedUser = await storage.updateUser(userId, updates);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "更新失败" });
    }
  });

  // Change password
  app.put('/api/auth/password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "请提供当前密码和新密码" });
      }
      
      // Verify current password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "用户不存在" });
      }
      
      const isValid = await comparePasswords(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "当前密码错误" });
      }
      
      // Update password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(userId, { password: hashedPassword });
      
      res.json({ message: "密码修改成功" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "密码修改失败" });
    }
  });

  // Object storage routes for avatar upload
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/avatar", isAuthenticated, async (req: any, res) => {
    if (!req.body.avatarURL) {
      return res.status(400).json({ error: "avatarURL is required" });
    }

    const userId = req.user.id;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.avatarURL,
        {
          owner: userId,
          visibility: "public", // Avatar images are public
        },
      );

      // Update user avatar in database
      const updatedUser = await storage.updateUser(userId, { avatarUrl: objectPath });
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json({
        user: userWithoutPassword,
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting avatar:", error);
      res.status(500).json({ error: "头像上传失败" });
    }
  });

  // Training Task Routes
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = req.user;
      
      if (user?.role === 'teacher' || user?.role === 'admin') {
        const tasks = await storage.getTrainingTasks(userId);
        res.json(tasks);
      } else {
        const tasks = await storage.getTrainingTasks();
        res.json(tasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = req.user;
      
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Only teachers and admins can create tasks" });
      }

      const taskData = insertTrainingTaskSchema.parse({ ...req.body, createdBy: userId });
      const task = await storage.createTrainingTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const task = await storage.getTrainingTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  // Task execution endpoints using business logic services
  app.post("/api/tasks/:taskId/start", isAuthenticated, async (req: any, res) => {
    try {
      const { TaskService } = require('./services/taskService');
      const userId = req.user.id;
      const { taskId } = req.params;
      const progress = await TaskService.startTask(userId, taskId);
      res.json(progress);
    } catch (error: any) {
      console.error("Error starting task:", error);
      res.status(500).json({ message: error.message || "启动任务失败" });
    }
  });

  app.post("/api/tasks/:taskId/advance", isAuthenticated, async (req: any, res) => {
    try {
      const { TaskService } = require('./services/taskService');
      const userId = req.user.id;
      const { taskId } = req.params;
      const progress = await TaskService.advanceDay(userId, taskId);
      res.json(progress);
    } catch (error: any) {
      console.error("Error advancing task:", error);
      res.status(500).json({ message: error.message || "推进任务失败" });
    }
  });

  app.post("/api/tasks/:taskId/complete", isAuthenticated, async (req: any, res) => {
    try {
      const { TaskService } = require('./services/taskService');
      const userId = req.user.id;
      const { taskId } = req.params;
      const evaluation = await TaskService.completeTask(userId, taskId);
      res.json(evaluation);
    } catch (error: any) {
      console.error("Error completing task:", error);
      res.status(500).json({ message: error.message || "完成任务失败" });
    }
  });

  app.get("/api/tasks/:taskId/statistics", isAuthenticated, async (req: any, res) => {
    try {
      const { TaskService } = require('./services/taskService');
      const userId = req.user.id;
      const { taskId } = req.params;
      const stats = await TaskService.getTaskStatistics(userId, taskId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching task statistics:", error);
      res.status(500).json({ message: error.message || "获取任务统计失败" });
    }
  });

  // Student Progress Routes
  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskId = req.query.taskId as string;
      const progress = await storage.getStudentProgress(userId, taskId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progressData = insertStudentProgressSchema.parse({ ...req.body, userId });
      const progress = await storage.upsertStudentProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Supplier Routes
  app.get("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = req.user;
      
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Only teachers and admins can create suppliers" });
      }

      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  // Product Routes
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = req.user;
      
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Only teachers and admins can create products" });
      }

      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Inventory Routes
  app.get("/api/inventory", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskId = req.query.taskId as string;
      
      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const inventory = await storage.getInventoryRecords(userId, taskId);
      res.json(inventory || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const inventoryData = insertInventoryRecordSchema.parse({ ...req.body, userId });
      const record = await storage.upsertInventoryRecord(inventoryData);
      res.json(record);
    } catch (error) {
      console.error("Error updating inventory:", error);
      res.status(500).json({ message: "Failed to update inventory" });
    }
  });

  // Business Logic Inventory Endpoints
  app.post("/api/inventory/incoming", isAuthenticated, async (req: any, res) => {
    try {
      const { InventoryService } = require('./services/inventoryService');
      const userId = req.user.id;
      const { taskId, productId, quantity, unitCost } = req.body;
      const record = await InventoryService.processIncoming(userId, taskId, productId, quantity, unitCost);
      res.json(record);
    } catch (error: any) {
      console.error("Error processing incoming inventory:", error);
      res.status(500).json({ message: error.message || "入库处理失败" });
    }
  });

  app.post("/api/inventory/outgoing", isAuthenticated, async (req: any, res) => {
    try {
      const { InventoryService } = require('./services/inventoryService');
      const userId = req.user.id;
      const { taskId, productId, quantity, unitPrice } = req.body;
      const record = await InventoryService.processOutgoing(userId, taskId, productId, quantity, unitPrice);
      res.json(record);
    } catch (error: any) {
      console.error("Error processing outgoing inventory:", error);
      res.status(500).json({ message: error.message || "出库处理失败" });
    }
  });

  app.get("/api/inventory/low-stock", isAuthenticated, async (req: any, res) => {
    try {
      const { InventoryService } = require('./services/inventoryService');
      const userId = req.user.id;
      const taskId = req.query.taskId as string;
      const alerts = await InventoryService.checkLowStock(userId, taskId);
      res.json(alerts);
    } catch (error: any) {
      console.error("Error checking low stock:", error);
      res.status(500).json({ message: error.message || "库存检查失败" });
    }
  });

  app.get("/api/inventory/turnover", isAuthenticated, async (req: any, res) => {
    try {
      const { InventoryService } = require('./services/inventoryService');
      const userId = req.user.id;
      const taskId = req.query.taskId as string;
      const analysis = await InventoryService.analyzeInventoryTurnover(userId, taskId);
      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing inventory turnover:", error);
      res.status(500).json({ message: error.message || "库存周转分析失败" });
    }
  });

  app.get("/api/inventory/optimization", isAuthenticated, async (req: any, res) => {
    try {
      const { InventoryService } = require('./services/inventoryService');
      const userId = req.user.id;
      const taskId = req.query.taskId as string;
      const suggestions = await InventoryService.generateOptimizationSuggestions(userId, taskId);
      res.json(suggestions);
    } catch (error: any) {
      console.error("Error generating optimization suggestions:", error);
      res.status(500).json({ message: error.message || "优化建议生成失败" });
    }
  });

  // Order Routes
  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskId = req.query.taskId as string;
      const orders = await storage.getOrders(userId, taskId);
      res.json(orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orderData = insertOrderSchema.parse({ ...req.body, userId });
      const order = await storage.createOrder(orderData);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Business Logic Order Endpoints
  app.post("/api/orders/purchase", isAuthenticated, async (req: any, res) => {
    try {
      const { OrderService } = require('./services/orderService');
      const userId = req.user.id;
      const { taskId, supplierId, items } = req.body;
      const order = await OrderService.createPurchaseOrder(userId, taskId, supplierId, items);
      res.json(order);
    } catch (error: any) {
      console.error("Error creating purchase order:", error);
      res.status(500).json({ message: error.message || "创建采购订单失败" });
    }
  });

  app.post("/api/orders/sale", isAuthenticated, async (req: any, res) => {
    try {
      const { OrderService } = require('./services/orderService');
      const userId = req.user.id;
      const { taskId, customerName, items } = req.body;
      const order = await OrderService.createSalesOrder(userId, taskId, customerName, items);
      res.json(order);
    } catch (error: any) {
      console.error("Error creating sales order:", error);
      res.status(500).json({ message: error.message || "创建销售订单失败" });
    }
  });

  app.post("/api/orders/:orderId/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const { OrderService } = require('./services/orderService');
      const userId = req.user.id;
      const { orderId } = req.params;
      const { taskId } = req.body;
      const order = await OrderService.cancelOrder(orderId, userId, taskId);
      res.json(order);
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: error.message || "取消订单失败" });
    }
  });

  app.get("/api/orders/statistics", isAuthenticated, async (req: any, res) => {
    try {
      const { OrderService } = require('./services/orderService');
      const userId = req.user.id;
      const taskId = req.query.taskId as string;
      const stats = await OrderService.getOrderStatistics(userId, taskId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching order statistics:", error);
      res.status(500).json({ message: error.message || "获取订单统计失败" });
    }
  });

  app.post("/api/negotiation", isAuthenticated, async (req: any, res) => {
    try {
      const { OrderService } = require('./services/orderService');
      const { supplierId, productId, requestedPrice, quantity } = req.body;
      const result = await OrderService.negotiatePrice(supplierId, productId, requestedPrice, quantity);
      res.json(result);
    } catch (error: any) {
      console.error("Error negotiating price:", error);
      res.status(500).json({ message: error.message || "价格谈判失败" });
    }
  });

  // Market Routes with Dynamic Data
  app.get("/api/market", isAuthenticated, async (req, res) => {
    try {
      const { MarketService } = require('./services/marketService');
      
      // Generate dynamic market data for multiple categories
      const categories = ['电子产品', '智能家居', '配件'];
      const marketAnalysis = await MarketService.analyzeMarketTrends(categories);
      
      res.json(marketAnalysis);
    } catch (error: any) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: error.message || "获取市场数据失败" });
    }
  });

  app.get("/api/market/:category", isAuthenticated, async (req, res) => {
    try {
      const { MarketService } = require('./services/marketService');
      const { category } = req.params;
      const marketData = await MarketService.generateMarketData(category);
      res.json(marketData);
    } catch (error: any) {
      console.error("Error generating market data:", error);
      res.status(500).json({ message: error.message || "生成市场数据失败" });
    }
  });

  app.get("/api/market/competitors/:taskId", isAuthenticated, async (req: any, res) => {
    try {
      const { MarketService } = require('./services/marketService');
      const userId = req.user.id;
      const { taskId } = req.params;
      const competitors = await MarketService.simulateCompetitors(userId, taskId);
      res.json(competitors);
    } catch (error: any) {
      console.error("Error simulating competitors:", error);
      res.status(500).json({ message: error.message || "模拟竞争对手失败" });
    }
  });

  app.post("/api/market/optimal-price", isAuthenticated, async (req, res) => {
    try {
      const { MarketService } = require('./services/marketService');
      const { productId, baseCost, targetMargin } = req.body;
      const pricing = await MarketService.calculateOptimalPrice(productId, baseCost, targetMargin);
      res.json(pricing);
    } catch (error: any) {
      console.error("Error calculating optimal price:", error);
      res.status(500).json({ message: error.message || "计算最优价格失败" });
    }
  });

  // Financial Routes
  app.get("/api/financial", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskId = req.query.taskId as string;
      
      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const records = await storage.getFinancialRecords(userId, taskId);
      res.json(records || []);
    } catch (error) {
      console.error("Error fetching financial records:", error);
      res.status(500).json({ message: "Failed to fetch financial records" });
    }
  });

  app.post("/api/financial", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const recordData = insertFinancialRecordSchema.parse({ ...req.body, userId });
      const record = await storage.createFinancialRecord(recordData);
      res.json(record);
    } catch (error) {
      console.error("Error creating financial record:", error);
      res.status(500).json({ message: "Failed to create financial record" });
    }
  });

  // Evaluation Routes
  app.get("/api/evaluations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskId = req.query.taskId as string;
      const evaluations = await storage.getEvaluationRecords(userId, taskId);
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      res.status(500).json({ message: "Failed to fetch evaluations" });
    }
  });

  app.post("/api/evaluations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const evaluationData = insertEvaluationRecordSchema.parse({ ...req.body, userId });
      const evaluation = await storage.createEvaluationRecord(evaluationData);
      res.json(evaluation);
    } catch (error) {
      console.error("Error creating evaluation:", error);
      res.status(500).json({ message: "Failed to create evaluation" });
    }
  });

  // Market Data Routes
  app.get("/api/market", isAuthenticated, async (req, res) => {
    try {
      const marketData = await storage.getMarketData();
      res.json(marketData);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  app.put("/api/market/:category", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = req.user;
      
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Only teachers and admins can update market data" });
      }

      const category = req.params.category;
      const updateData = insertMarketDataSchema.partial().parse(req.body);
      const marketData = await storage.updateMarketData(category, updateData);
      res.json(marketData);
    } catch (error) {
      console.error("Error updating market data:", error);
      res.status(500).json({ message: "Failed to update market data" });
    }
  });

  // Dashboard Analytics Routes
  app.get("/api/dashboard/kpis", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskId = req.query.taskId as string;

      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      // Get current progress
      const [progress] = await storage.getStudentProgress(userId, taskId);
      
      // Get financial records
      const financialRecords = await storage.getFinancialRecords(userId, taskId);
      
      // Get inventory records
      const inventoryRecords = await storage.getInventoryRecords(userId, taskId);
      
      // Calculate KPIs
      const totalRevenue = financialRecords
        .filter(r => r.recordType === 'income')
        .reduce((sum, r) => sum + parseFloat(r.amount), 0);
      
      const totalCosts = financialRecords
        .filter(r => r.recordType === 'expense')
        .reduce((sum, r) => sum + parseFloat(r.amount), 0);

      const inventoryValue = inventoryRecords
        .reduce((sum, record) => {
          return sum + (record.currentStock || 0) * 100; // Assuming average price of 100
        }, 0);

      const kpis = {
        currentBalance: progress?.currentBalance || 0,
        totalRevenue,
        totalProfit: totalRevenue - totalCosts,
        inventoryValue,
        taskProgress: progress?.currentDay ? (progress.currentDay / 15) * 100 : 0, // Assuming 15 day tasks
      };

      res.json(kpis);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      res.status(500).json({ message: "Failed to fetch KPIs" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to training platform'
    }));

    // Handle WebSocket messages
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('Received WebSocket message:', data);

        // Handle different message types
        switch (data.type) {
          case 'subscribe':
            // Subscribe to specific data updates
            ws.send(JSON.stringify({
              type: 'subscribed',
              channel: data.channel
            }));
            break;
          
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Broadcast market updates every 30 seconds
  setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'market:update',
          data: {
            timestamp: new Date().toISOString(),
            marketVolume: Math.floor(Math.random() * 1000000) + 2500000,
            competitionLevel: Math.floor(Math.random() * 20) + 70,
            consumerActivity: Math.floor(Math.random() * 20) + 80,
          }
        }));
      }
    });
  }, 30000);

  return httpServer;
}
