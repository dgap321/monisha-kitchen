import { pgTable, text, varchar, integer, boolean, real, jsonb, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  image: text("image").notNull().default(""),
  category: text("category").notNull(),
  isVeg: boolean("is_veg").notNull().default(true),
  available: boolean("available").notNull().default(true),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  customerPhone: text("customer_phone").notNull(),
  customerName: text("customer_name").notNull().default(""),
  items: jsonb("items").notNull().$type<{ itemId: number; name: string; quantity: number; price: number }[]>(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("pending_payment"),
  transactionId: text("transaction_id"),
  address: text("address").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  name: text("name"),
  address: text("address"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  isBlocked: boolean("is_blocked").notNull().default(false),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, joinedAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().default("Monisha Kitchen"),
  upiId: text("upi_id").notNull().default("7013849563-2@ybl"),
  deliveryRadiusKm: integer("delivery_radius_km").notNull().default(5),
  locationLat: real("location_lat").notNull().default(28.6139),
  locationLng: real("location_lng").notNull().default(77.2090),
  isOpen: boolean("is_open").notNull().default(true),
  openTime: text("open_time").notNull().default("10:00"),
  closeTime: text("close_time").notNull().default("22:00"),
  nextOpenMessage: text("next_open_message").notNull().default(""),
  merchantUsername: text("merchant_username").notNull().default("NaBo"),
  merchantPassword: text("merchant_password").notNull().default("MnD@0246"),
});

export type StoreSettings = typeof storeSettings.$inferSelect;

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  cta: text("cta").notNull().default(""),
  image: text("image").notNull().default(""),
  gradient: text("gradient").notNull().default("from-orange-500 to-red-500"),
  linkedItemIds: jsonb("linked_item_ids").$type<number[]>().default([]),
});

export const insertBannerSchema = createInsertSchema(banners).omit({ id: true });
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type Banner = typeof banners.$inferSelect;

export const categoryImages = pgTable("category_images", {
  id: serial("id").primaryKey(),
  category: text("category").notNull().unique(),
  image: text("image").notNull().default(""),
  visible: boolean("visible").notNull().default(false),
});

export type CategoryImage = typeof categoryImages.$inferSelect;
