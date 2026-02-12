import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import {
  menuItems, type MenuItem, type InsertMenuItem,
  orders, type Order, type InsertOrder,
  customers, type Customer, type InsertCustomer,
  storeSettings, type StoreSettings,
  banners, type Banner, type InsertBanner,
  categoryImages, type CategoryImage,
  reviews, type Review, type InsertReview,
} from "@shared/schema";

export interface IStorage {
  // Menu
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, updates: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<void>;
  replaceAllMenuItems(items: InsertMenuItem[]): Promise<MenuItem[]>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrdersByPhone(phone: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(orderId: string, status: string): Promise<Order | undefined>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  upsertCustomer(data: InsertCustomer): Promise<Customer>;
  toggleCustomerBlock(phone: string): Promise<Customer | undefined>;

  // Settings
  getSettings(): Promise<StoreSettings>;
  updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings>;

  // Banners
  getBanners(): Promise<Banner[]>;
  updateBanner(id: number, updates: Partial<InsertBanner>): Promise<Banner | undefined>;

  // Category Images
  getCategoryImages(): Promise<CategoryImage[]>;
  upsertCategoryImage(category: string, image: string, visible?: boolean): Promise<CategoryImage>;
  toggleCategoryVisibility(category: string): Promise<CategoryImage | undefined>;
  setVisibleCategories(categories: string[]): Promise<void>;

  // Reviews
  getReviews(): Promise<Review[]>;
  getReviewsByMenuItem(menuItemId: number): Promise<Review[]>;
  getReviewsByOrder(orderId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  deleteReview(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Menu
  async getMenuItems(): Promise<MenuItem[]> {
    return db.select().from(menuItems);
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [created] = await db.insert(menuItems).values(item).returning();
    return created;
  }

  async updateMenuItem(id: number, updates: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updated] = await db.update(menuItems).set(updates).where(eq(menuItems.id, id)).returning();
    return updated;
  }

  async deleteMenuItem(id: number): Promise<void> {
    await db.delete(menuItems).where(eq(menuItems.id, id));
  }

  async replaceAllMenuItems(items: InsertMenuItem[]): Promise<MenuItem[]> {
    await db.delete(menuItems);
    if (items.length === 0) return [];
    return db.insert(menuItems).values(items).returning();
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByPhone(phone: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.customerPhone, phone)).orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.orderId, orderId)).returning();
    return updated;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.joinedAt));
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phoneNumber, phone));
    return customer;
  }

  async upsertCustomer(data: InsertCustomer): Promise<Customer> {
    const existing = await this.getCustomerByPhone(data.phoneNumber);
    if (existing) {
      const updateData: Record<string, any> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.locationLat !== undefined) updateData.locationLat = data.locationLat;
      if (data.locationLng !== undefined) updateData.locationLng = data.locationLng;
      if (Object.keys(updateData).length === 0) return existing;
      const [updated] = await db.update(customers)
        .set(updateData)
        .where(eq(customers.phoneNumber, data.phoneNumber))
        .returning();
      return updated;
    }
    const [created] = await db.insert(customers).values(data).returning();
    return created;
  }

  async toggleCustomerBlock(phone: string): Promise<Customer | undefined> {
    const customer = await this.getCustomerByPhone(phone);
    if (!customer) return undefined;
    const [updated] = await db.update(customers)
      .set({ isBlocked: !customer.isBlocked })
      .where(eq(customers.phoneNumber, phone))
      .returning();
    return updated;
  }

  // Settings
  async getSettings(): Promise<StoreSettings> {
    const rows = await db.select().from(storeSettings);
    if (rows.length === 0) {
      const [created] = await db.insert(storeSettings).values({}).returning();
      return created;
    }
    return rows[0];
  }

  async updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = await this.getSettings();
    const [updated] = await db.update(storeSettings).set(updates).where(eq(storeSettings.id, current.id)).returning();
    return updated;
  }

  // Banners
  async getBanners(): Promise<Banner[]> {
    const rows = await db.select().from(banners);
    if (rows.length === 0) {
      const defaults: InsertBanner[] = [
        { title: "50% OFF", subtitle: "On your first order", cta: "Order Now", image: "", gradient: "from-orange-500 to-red-500", linkedItemIds: [] },
        { title: "Fastest Delivery", subtitle: "Within 5km radius", cta: "", image: "", gradient: "from-neutral-900 to-neutral-800", linkedItemIds: [] },
        { title: "Veg Delight", subtitle: "Try our new paneer specials", cta: "View Menu", image: "", gradient: "from-green-600 to-emerald-800", linkedItemIds: [] },
      ];
      return db.insert(banners).values(defaults).returning();
    }
    return rows;
  }

  async updateBanner(id: number, updates: Partial<InsertBanner>): Promise<Banner | undefined> {
    const [updated] = await db.update(banners).set(updates).where(eq(banners.id, id)).returning();
    return updated;
  }

  // Category Images
  async getCategoryImages(): Promise<CategoryImage[]> {
    return db.select().from(categoryImages);
  }

  async upsertCategoryImage(category: string, image: string, visible?: boolean): Promise<CategoryImage> {
    const existing = await db.select().from(categoryImages).where(eq(categoryImages.category, category));
    if (existing.length > 0) {
      const updateData: any = { image };
      if (visible !== undefined) updateData.visible = visible;
      const [updated] = await db.update(categoryImages).set(updateData).where(eq(categoryImages.category, category)).returning();
      return updated;
    }
    const [created] = await db.insert(categoryImages).values({ category, image, visible: visible ?? false }).returning();
    return created;
  }

  async toggleCategoryVisibility(category: string): Promise<CategoryImage | undefined> {
    const existing = await db.select().from(categoryImages).where(eq(categoryImages.category, category));
    if (existing.length > 0) {
      const [updated] = await db.update(categoryImages).set({ visible: !existing[0].visible }).where(eq(categoryImages.category, category)).returning();
      return updated;
    }
    const [created] = await db.insert(categoryImages).values({ category, image: "", visible: true }).returning();
    return created;
  }

  async setVisibleCategories(categories: string[]): Promise<void> {
    await db.update(categoryImages).set({ visible: false });
    for (const cat of categories) {
      const existing = await db.select().from(categoryImages).where(eq(categoryImages.category, cat));
      if (existing.length > 0) {
        await db.update(categoryImages).set({ visible: true }).where(eq(categoryImages.category, cat));
      } else {
        await db.insert(categoryImages).values({ category: cat, image: "", visible: true });
      }
    }
  }

  // Reviews
  async getReviews(): Promise<Review[]> {
    return db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async getReviewsByMenuItem(menuItemId: number): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.menuItemId, menuItemId)).orderBy(desc(reviews.createdAt));
  }

  async getReviewsByOrder(orderId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.orderId, orderId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async deleteReview(id: number): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }
}

export const storage = new DatabaseStorage();
