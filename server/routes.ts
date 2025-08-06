import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Training Task Routes
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
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

  // Student Progress Routes
  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
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
      const userId = req.user.claims.sub;
      const taskId = req.query.taskId as string;
      
      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const inventory = await storage.getInventoryRecords(userId, taskId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inventoryData = insertInventoryRecordSchema.parse({ ...req.body, userId });
      const record = await storage.upsertInventoryRecord(inventoryData);
      res.json(record);
    } catch (error) {
      console.error("Error updating inventory:", error);
      res.status(500).json({ message: "Failed to update inventory" });
    }
  });

  // Order Routes
  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskId = req.query.taskId as string;
      const orders = await storage.getOrders(userId, taskId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orderData = insertOrderSchema.parse({ ...req.body, userId });
      const order = await storage.createOrder(orderData);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Financial Routes
  app.get("/api/financial", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskId = req.query.taskId as string;
      
      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const records = await storage.getFinancialRecords(userId, taskId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching financial records:", error);
      res.status(500).json({ message: "Failed to fetch financial records" });
    }
  });

  app.post("/api/financial", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
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
      const userId = req.user.claims.sub;
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
        taskProgress: progress ? (progress.currentDay / 15) * 100 : 0, // Assuming 15 day tasks
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
