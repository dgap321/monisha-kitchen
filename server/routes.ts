import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { randomBytes } from "crypto";
import { storage } from "./storage";

const merchantSessions = new Set<string>();

function requireMerchantAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-merchant-token"] as string;
  if (!token || !merchantSessions.has(token)) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ===== MENU =====
  app.get("/api/menu", async (_req, res) => {
    const items = await storage.getMenuItems();
    res.json(items);
  });

  app.post("/api/menu", requireMerchantAuth, async (req, res) => {
    const item = await storage.createMenuItem(req.body);
    res.json(item);
  });

  app.patch("/api/menu/:id", requireMerchantAuth, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const item = await storage.updateMenuItem(id, req.body);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete("/api/menu/:id", requireMerchantAuth, async (req: any, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteMenuItem(id);
    res.json({ ok: true });
  });

  app.post("/api/menu/import", requireMerchantAuth, async (req, res) => {
    const { items } = req.body;
    const result = await storage.replaceAllMenuItems(items);
    res.json(result);
  });

  // ===== ORDERS =====
  app.get("/api/orders", requireMerchantAuth, async (_req, res) => {
    const allOrders = await storage.getOrders();
    res.json(allOrders);
  });

  app.get("/api/orders/:phone", async (req, res) => {
    const phone = req.params.phone;
    const userOrders = await storage.getOrdersByPhone(phone);
    res.json(userOrders);
  });

  app.post("/api/orders", async (req, res) => {
    const order = await storage.createOrder(req.body);
    res.json(order);
  });

  app.patch("/api/orders/:orderId/status", requireMerchantAuth, async (req: any, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await storage.updateOrderStatus(orderId, status);
    if (!order) return res.status(404).json({ message: "Not found" });
    res.json(order);
  });

  // ===== CUSTOMERS =====
  app.get("/api/customers", requireMerchantAuth, async (_req, res) => {
    const all = await storage.getCustomers();
    res.json(all);
  });

  app.get("/api/customers/:phone", async (req, res) => {
    const customer = await storage.getCustomerByPhone(req.params.phone);
    if (!customer) return res.status(404).json({ message: "Not found" });
    res.json(customer);
  });

  app.post("/api/customers", async (req, res) => {
    const customer = await storage.upsertCustomer(req.body);
    res.json(customer);
  });

  app.patch("/api/customers/:phone/block", requireMerchantAuth, async (req: any, res) => {
    const customer = await storage.toggleCustomerBlock(req.params.phone);
    if (!customer) return res.status(404).json({ message: "Not found" });
    res.json(customer);
  });

  // ===== SETTINGS =====
  app.get("/api/settings", async (_req, res) => {
    const { merchantUsername, merchantPassword, ...publicSettings } = await storage.getSettings();
    res.json(publicSettings);
  });

  app.patch("/api/settings", requireMerchantAuth, async (req, res) => {
    const updated = await storage.updateSettings(req.body);
    const { merchantUsername, merchantPassword, ...publicSettings } = updated;
    res.json(publicSettings);
  });

  // ===== BANNERS =====
  app.get("/api/banners", async (_req, res) => {
    const all = await storage.getBanners();
    res.json(all);
  });

  app.patch("/api/banners/:id", requireMerchantAuth, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const banner = await storage.updateBanner(id, req.body);
    if (!banner) return res.status(404).json({ message: "Not found" });
    res.json(banner);
  });

  // ===== CATEGORY IMAGES =====
  app.get("/api/categories", async (_req, res) => {
    const all = await storage.getCategoryImages();
    res.json(all);
  });

  app.post("/api/categories/image", requireMerchantAuth, async (req, res) => {
    const { category, image, visible } = req.body;
    const result = await storage.upsertCategoryImage(category, image, visible);
    res.json(result);
  });

  app.patch("/api/categories/:category/visibility", requireMerchantAuth, async (req: any, res) => {
    const category = decodeURIComponent(req.params.category);
    const result = await storage.toggleCategoryVisibility(category);
    res.json(result);
  });

  app.post("/api/categories/visible", requireMerchantAuth, async (req, res) => {
    const { categories } = req.body;
    await storage.setVisibleCategories(categories);
    res.json({ ok: true });
  });

  app.post("/api/merchant/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }
    const settings = await storage.getSettings();
    if (username === settings.merchantUsername && password === settings.merchantPassword) {
      const token = randomBytes(32).toString("hex");
      merchantSessions.add(token);
      return res.json({ success: true, token });
    }
    return res.status(401).json({ message: "Invalid credentials" });
  });

  app.post("/api/merchant/logout", (req, res) => {
    const token = req.headers["x-merchant-token"] as string;
    if (token) merchantSessions.delete(token);
    res.json({ success: true });
  });

  // ===== REVIEWS =====
  app.get("/api/reviews", async (_req, res) => {
    const all = await storage.getReviews();
    res.json(all);
  });

  app.get("/api/reviews/item/:menuItemId", async (req, res) => {
    const menuItemId = parseInt(req.params.menuItemId);
    const itemReviews = await storage.getReviewsByMenuItem(menuItemId);
    res.json(itemReviews);
  });

  app.get("/api/reviews/order/:orderId", async (req, res) => {
    const orderReviews = await storage.getReviewsByOrder(req.params.orderId);
    res.json(orderReviews);
  });

  app.post("/api/reviews", async (req, res) => {
    const { orderId, menuItemId, customerPhone, customerName, stars, comment } = req.body;
    if (!orderId || !menuItemId || !customerPhone || typeof stars !== "number" || stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Invalid review data. Stars must be 1-5, orderId/menuItemId/customerPhone required." });
    }
    const orders = await storage.getOrdersByPhone(customerPhone);
    const order = orders.find((o: any) => o.orderId === orderId);
    if (!order || order.status !== "delivered") {
      return res.status(403).json({ message: "Can only review delivered orders belonging to you." });
    }
    const existing = await storage.getReviewsByOrder(orderId);
    const alreadyReviewed = existing.find((r: any) => r.menuItemId === menuItemId);
    if (alreadyReviewed) {
      return res.status(409).json({ message: "Already reviewed this item for this order." });
    }
    const review = await storage.createReview({
      orderId,
      menuItemId,
      customerPhone,
      customerName: customerName || "",
      stars,
      comment: comment || "",
    });
    res.json(review);
  });

  app.delete("/api/reviews/:id", requireMerchantAuth, async (req: any, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteReview(id);
    res.json({ ok: true });
  });

  return httpServer;
}
