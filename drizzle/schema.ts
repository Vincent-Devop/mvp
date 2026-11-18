import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export type StaffRole = "user" | "admin" | "manager" | "inventory" | "sales" | "accountant" | "delivery";
export type OrderStatus = "placed" | "processing" | "ready" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type Fulfillment = "delivery" | "collection";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: varchar("role", { length: 32 }).$type<StaffRole>().default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 24 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 32 }),
  city: varchar("city", { length: 80 }).default("Nairobi").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isConfirmed: boolean("is_confirmed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userBranches = pgTable("user_branches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ userBranchUnique: uniqueIndex("user_branch_unique").on(table.userId, table.branchId) }));

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  sku: varchar("sku", { length: 64 }).notNull().unique(),
  categoryId: integer("category_id").references(() => categories.id),
  brandId: integer("brand_id").references(() => brands.id),
  description: text("description").notNull(),
  material: varchar("material", { length: 160 }),
  retailPrice: integer("retail_price").notNull(),
  wholesalePrice: integer("wholesale_price"),
  compareAtPrice: integer("compare_at_price"),
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isBestseller: boolean("is_bestseller").default(false).notNull(),
  isNew: boolean("is_new").default(false).notNull(),
  isDemo: boolean("is_demo").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index("products_category_idx").on(table.categoryId),
  activeIdx: index("products_active_idx").on(table.isActive),
}));

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: varchar("alt", { length: 240 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 64 }).notNull().unique(),
  color: varchar("color", { length: 60 }),
  size: varchar("size", { length: 60 }),
  retailPrice: integer("retail_price"),
  isActive: boolean("is_active").default(true).notNull(),
}, (table) => ({ productIdx: index("product_variants_product_idx").on(table.productId) }));

export const inventoryBalances = pgTable("inventory_balances", {
  id: serial("id").primaryKey(),
  variantId: integer("variant_id").notNull().references(() => productVariants.id),
  branchId: integer("branch_id").notNull().references(() => branches.id),
  onHand: integer("on_hand").default(0).notNull(),
  reserved: integer("reserved").default(0).notNull(),
  damaged: integer("damaged").default(0).notNull(),
  inTransit: integer("in_transit").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  variantBranchUnique: uniqueIndex("inventory_variant_branch_unique").on(table.variantId, table.branchId),
  branchIdx: index("inventory_branch_idx").on(table.branchId),
}));

export const stockReservations = pgTable("stock_reservations", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").notNull().references(() => productVariants.id),
  branchId: integer("branch_id").notNull().references(() => branches.id),
  quantity: integer("quantity").notNull(),
  status: varchar("status", { length: 20 }).$type<"active" | "released" | "expired" | "fulfilled">().default("active").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  activeExpiryIdx: index("stock_reservations_expiry_idx").on(table.status, table.expiresAt),
  orderIdx: index("stock_reservations_order_idx").on(table.orderId),
}));

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }).notNull().unique(),
  segment: varchar("segment", { length: 24 }).$type<"retail" | "wholesale">().default("retail").notNull(),
  wholesaleApproved: boolean("wholesale_approved").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 48 }).notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  branchId: integer("branch_id").references(() => branches.id),
  channel: varchar("channel", { length: 24 }).$type<"online" | "pos" | "wholesale">().default("online").notNull(),
  status: varchar("status", { length: 32 }).$type<OrderStatus>().default("placed").notNull(),
  paymentStatus: varchar("payment_status", { length: 24 }).$type<PaymentStatus>().default("pending").notNull(),
  fulfillment: varchar("fulfillment", { length: 24 }).$type<Fulfillment>().default("delivery").notNull(),
  paymentMethod: varchar("payment_method", { length: 24 }).$type<"mpesa" | "cash" | "bank">().notNull(),
  currency: varchar("currency", { length: 3 }).default("KES").notNull(),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").default(0).notNull(),
  deliveryFee: integer("delivery_fee").default(0).notNull(),
  total: integer("total").notNull(),
  customerName: varchar("customer_name", { length: 160 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 32 }).notNull(),
  customerEmail: varchar("customer_email", { length: 320 }),
  deliveryAddress: text("delivery_address"),
  deliveryInstructions: text("delivery_instructions"),
  note: text("note"),
  isDemo: boolean("is_demo").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  createdIdx: index("orders_created_idx").on(table.createdAt),
  statusIdx: index("orders_status_idx").on(table.status),
}));

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => productVariants.id),
  productName: varchar("product_name", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 64 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  lineTotal: integer("line_total").notNull(),
});

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  variantId: integer("variant_id").notNull().references(() => productVariants.id),
  branchId: integer("branch_id").notNull().references(() => branches.id),
  movementType: varchar("movement_type", { length: 32 }).notNull(),
  quantity: integer("quantity").notNull(),
  reference: varchar("reference", { length: 48 }),
  reason: text("reason"),
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  variantBranchIdx: index("stock_movements_variant_branch_idx").on(table.variantId, table.branchId),
  referenceIdx: index("stock_movements_reference_idx").on(table.reference),
}));

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  method: varchar("method", { length: 24 }).notNull(),
  status: varchar("status", { length: 24 }).$type<"pending" | "verified" | "failed" | "refunded">().default("pending").notNull(),
  amount: integer("amount").notNull(),
  providerReference: varchar("provider_reference", { length: 120 }).unique(),
  verifiedByUserId: integer("verified_by_user_id").references(() => users.id),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  receiptNumber: varchar("receipt_number", { length: 64 }).notNull().unique(),
  documentType: varchar("document_type", { length: 32 }).$type<"online_sale" | "pos_sale" | "payment" | "refund" | "invoice">().default("online_sale").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorUserId: integer("actor_user_id").references(() => users.id),
  branchId: integer("branch_id").references(() => branches.id),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entity_type", { length: 64 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ createdIdx: index("audit_logs_created_idx").on(table.createdAt) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;


export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
  source: varchar("source", { length: 40 }).default("website").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});


export const cashRegisterSessions = pgTable("cash_register_sessions", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull().references(() => branches.id),
  terminalId: varchar("terminal_id", { length: 32 }).notNull(),
  staffUserId: integer("staff_user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 16 }).$type<"open" | "closed">().default("open").notNull(),
  openingFloat: integer("opening_float").default(0).notNull(),
  cashSales: integer("cash_sales").default(0).notNull(),
  cashRefunds: integer("cash_refunds").default(0).notNull(),
  cashIn: integer("cash_in").default(0).notNull(),
  cashOut: integer("cash_out").default(0).notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  actualCash: integer("actual_cash"),
  expectedCash: integer("expected_cash"),
  variance: integer("variance"),
  closedByUserId: integer("closed_by_user_id").references(() => users.id),
}, (table) => ({
  activeTerminalUnique: uniqueIndex("register_open_branch_terminal_unique").on(table.branchId, table.terminalId).where(sql`${table.status} = 'open'`),
  sessionBranchIdx: index("register_sessions_branch_idx").on(table.branchId, table.openedAt),
}));

export const cashRegisterMovements = pgTable("cash_register_movements", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => cashRegisterSessions.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 16 }).$type<"cash_in" | "cash_out" | "cash_refund">().notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  actorUserId: integer("actor_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ sessionMovementIdx: index("register_movements_session_idx").on(table.sessionId, table.createdAt) }));
