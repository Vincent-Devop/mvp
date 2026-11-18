import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  auditLogs,
  branches,
  cashRegisterMovements,
  cashRegisterSessions,
  categories,
  customers,
  inventoryBalances,
  orderItems,
  orders,
  payments,
  productImages,
  products,
  productVariants,
  receipts,
  stockMovements,
  stockReservations,
} from "../drizzle/schema";
import { demoProducts } from "../shared/demoCatalog";
import { getDb } from "./db";

const demoProductsBySku = new Map(demoProducts.map((product) => [product.sku, product] as const));

export async function listCatalog(input: {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  slug?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "popular";
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const term = input.q?.trim();
  const where = and(
    eq(products.isActive, true),
    input.category ? eq(categories.slug, input.category) : undefined,
    input.slug ? eq(products.slug, input.slug) : undefined,
    input.minPrice !== undefined ? gte(products.retailPrice, input.minPrice) : undefined,
    input.maxPrice !== undefined ? lte(products.retailPrice, input.maxPrice) : undefined,
    term ? or(ilike(products.name, `%${term}%`), ilike(products.sku, `%${term}%`), ilike(products.description, `%${term}%`)) : undefined,
  );
  const orderBy = input.sort === "price-asc"
    ? products.retailPrice
    : input.sort === "price-desc"
      ? desc(products.retailPrice)
      : input.sort === "popular"
        ? desc(products.isBestseller)
        : desc(products.createdAt);
  const rows = await db.select({
    productId: products.id,
    name: products.name,
    slug: products.slug,
    sku: products.sku,
    description: products.description,
    material: products.material,
    retailPrice: products.retailPrice,
    compareAtPrice: products.compareAtPrice,
    imageUrl: products.imageUrl,
    isFeatured: products.isFeatured,
    isBestseller: products.isBestseller,
    isNew: products.isNew,
    isDemo: products.isDemo,
    categoryName: categories.name,
    categorySlug: categories.slug,
    variantId: productVariants.id,
    variantSku: productVariants.sku,
    color: productVariants.color,
    size: productVariants.size,
    variantPrice: productVariants.retailPrice,
    branchId: branches.id,
    branchName: branches.name,
    onHand: inventoryBalances.onHand,
    reserved: inventoryBalances.reserved,
    damaged: inventoryBalances.damaged,
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, and(eq(productVariants.productId, products.id), eq(productVariants.isActive, true)))
    .leftJoin(inventoryBalances, eq(inventoryBalances.variantId, productVariants.id))
    .leftJoin(branches, eq(inventoryBalances.branchId, branches.id))
    .where(where)
    .orderBy(orderBy)
    .limit(Math.min(Math.max(input.limit ?? 48, 1), 100));

  type VariantView = {
    id: number;
    sku: string;
    color: string | null;
    size: string | null;
    retailPrice: number;
    availability: { branchId: number; branchName: string; available: number }[];
  };
  type ProductView = {
    id: number;
    name: string;
    slug: string;
    sku: string;
    description: string;
    material: string | null;
    retailPrice: number;
    compareAtPrice: number | null;
    imageUrl: string | null;
    isFeatured: boolean;
    isBestseller: boolean;
    isNew: boolean;
    isDemo: boolean;
    categoryName: string | null;
    categorySlug: string | null;
    variants: VariantView[];
    available: number;
  };
  const grouped = new Map<number, ProductView>();
  for (const row of rows) {
    let product = grouped.get(row.productId);
    if (!product) {
      product = {
        id: row.productId,
        name: row.name,
        slug: row.slug,
        sku: row.sku,
        description: row.description,
        material: row.material,
        retailPrice: row.retailPrice,
        compareAtPrice: row.compareAtPrice,
        imageUrl: row.isDemo ? (demoProductsBySku.get(row.sku)?.imageUrl ?? "/images/product-placeholder.svg") : row.imageUrl,
        isFeatured: row.isFeatured,
        isBestseller: row.isBestseller,
        isNew: row.isNew,
        isDemo: row.isDemo,
        categoryName: row.categoryName,
        categorySlug: row.categorySlug,
        variants: [],
        available: 0,
      };
      grouped.set(row.productId, product);
    }
    if (row.variantId !== null && row.variantSku) {
      let variant = product.variants.find((item) => item.id === row.variantId);
      if (!variant) {
        variant = {
          id: row.variantId,
          sku: row.variantSku,
          color: row.color,
          size: row.size,
          retailPrice: row.variantPrice ?? row.retailPrice,
          availability: [],
        };
        product.variants.push(variant);
      }
      if (row.branchId !== null && row.branchName) {
        const available = Math.max(0, (row.onHand ?? 0) - (row.reserved ?? 0) - (row.damaged ?? 0));
        variant.availability.push({ branchId: row.branchId, branchName: row.branchName, available });
        product.available += available;
      }
    }
  }
  return [...grouped.values()];
}

export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: categories.id, name: categories.name, slug: categories.slug, description: categories.description, imageUrl: categories.imageUrl })
    .from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder, categories.name);
}

export async function listBranches() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: branches.id, code: branches.code, name: branches.name, address: branches.address, city: branches.city, isConfirmed: branches.isConfirmed })
    .from(branches).where(and(eq(branches.isActive, true), eq(branches.isConfirmed, true))).orderBy(branches.name);
}

export async function getProductImages(productId: number) {
  const db = await getDb();
  if (!db) return [];
  const [product] = await db.select({ sku: products.sku, isDemo: products.isDemo })
    .from(products).where(eq(products.id, productId)).limit(1);
  if (product?.isDemo) {
    const sample = demoProductsBySku.get(product.sku);
    return sample ? [{ url: sample.imageUrl, alt: `${sample.name} illustrative product photo`, sortOrder: 0 }] : [];
  }
  return db.select({ url: productImages.url, alt: productImages.alt, sortOrder: productImages.sortOrder })
    .from(productImages).where(eq(productImages.productId, productId)).orderBy(productImages.sortOrder);
}

async function releaseExpiredReservations(tx: Parameters<Parameters<NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]>[0]>[0]) {
  const now = new Date();
  const expired = await tx.select().from(stockReservations)
    .where(and(eq(stockReservations.status, "active"), lte(stockReservations.expiresAt, now)))
    .for("update");
  for (const reservation of expired) {
    await tx.update(inventoryBalances).set({
      reserved: sql`GREATEST(${inventoryBalances.reserved} - ${reservation.quantity}, 0)`,
      updatedAt: now,
    }).where(and(eq(inventoryBalances.variantId, reservation.variantId), eq(inventoryBalances.branchId, reservation.branchId)));
    await tx.update(stockReservations).set({ status: "expired" }).where(eq(stockReservations.id, reservation.id));
    await tx.insert(stockMovements).values({
      variantId: reservation.variantId,
      branchId: reservation.branchId,
      movementType: "reservation_expired",
      quantity: -reservation.quantity,
      reference: String(reservation.orderId),
      reason: "Checkout reservation timed out",
    });
  }
}

export async function createCheckoutOrder(input: {
  items: { variantId: number; quantity: number }[];
  fulfillment: "delivery" | "collection";
  paymentMethod: "mpesa" | "cash" | "bank";
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  deliveryInstructions?: string;
  branchId?: number;
  paymentReference?: string;
  simulation?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Order service is not connected." });
  if (input.fulfillment === "delivery" && !input.deliveryAddress?.trim()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Add a delivery address to continue." });
  }
  const quantities = new Map<number, number>();
  for (const item of input.items) quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);

  return db.transaction(async (tx) => {
    if (!input.simulation) await releaseExpiredReservations(tx);
    let branch = input.branchId
      ? (await tx.select().from(branches).where(and(eq(branches.id, input.branchId), eq(branches.isActive, true), eq(branches.isConfirmed, true))).limit(1))[0]
      : (await tx.select().from(branches).where(and(eq(branches.isActive, true), eq(branches.isConfirmed, true))).orderBy(branches.id).limit(1))[0];
    if (!branch) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No confirmed collection or fulfilment branch is configured. Please contact the store." });

    const variants = await tx.select({
      variantId: productVariants.id,
      variantSku: productVariants.sku,
      variantPrice: productVariants.retailPrice,
      productId: products.id,
      name: products.name,
      productSku: products.sku,
      price: products.retailPrice,
      isDemo: products.isDemo,
    }).from(productVariants).innerJoin(products, eq(productVariants.productId, products.id))
      .where(and(inArray(productVariants.id, [...quantities.keys()]), eq(productVariants.isActive, true), eq(products.isActive, true)));
    const variantById = new Map(variants.map((variant) => [variant.variantId, variant]));
    if (variantById.size !== quantities.size) throw new TRPCError({ code: "BAD_REQUEST", message: "One or more cart items are no longer available." });
    if (input.simulation ? variants.some((variant) => !variant.isDemo) : variants.some((variant) => variant.isDemo)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: input.simulation
        ? "Simulation mode accepts illustrative demo products only."
        : "Illustrative catalogue items cannot be ordered live. Use the clearly labelled test-only simulation or ask the store to add verified products and stock." });
    }

    const items: { variantId: number; quantity: number; name: string; sku: string; unitPrice: number; isDemo: boolean }[] = [];
    for (const [variantId, quantity] of quantities) {
      const product = variantById.get(variantId)!;
      if (input.simulation) {
        items.push({
          variantId,
          quantity,
          name: product.name,
          sku: product.variantSku || product.productSku,
          unitPrice: product.variantPrice ?? product.price,
          isDemo: true,
        });
        continue;
      }
      const balance = (await tx.select().from(inventoryBalances)
        .where(and(eq(inventoryBalances.variantId, variantId), eq(inventoryBalances.branchId, branch.id)))
        .for("update").limit(1))[0];
      const available = balance ? balance.onHand - balance.reserved - balance.damaged : 0;
      if (!balance || available < quantity) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: `${product.name} does not have enough available stock at ${branch.name}.` });
      }
      items.push({
        variantId,
        quantity,
        name: product.name,
        sku: product.variantSku || product.productSku,
        unitPrice: product.variantPrice ?? product.price,
        isDemo: product.isDemo,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const deliveryFee = 0; // No delivery-zone tariffs have been supplied; disclose that the final quote is confirmed by the store.
    const total = subtotal + deliveryFee;
    const reference = `PB-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;
    const now = new Date();
    const reservationExpiry = new Date(now.getTime() + 30 * 60 * 1000);
    const isDemo = items.some((item) => item.isDemo);

    let customerId: number | null = null;
    if (!input.simulation) {
      const [customer] = await tx.insert(customers).values({
        name: input.customerName.trim(),
        email: input.customerEmail?.trim() || null,
        phone: input.customerPhone.trim(),
        segment: "retail",
      }).onConflictDoUpdate({
        target: customers.phone,
        set: { name: input.customerName.trim(), email: input.customerEmail?.trim() || null },
      }).returning({ id: customers.id });
      customerId = customer.id;
    }

    const [order] = await tx.insert(orders).values({
      reference,
      customerId,
      branchId: branch.id,
      channel: "online",
      status: "placed",
      paymentStatus: "pending",
      fulfillment: input.fulfillment,
      paymentMethod: input.paymentMethod,
      subtotal,
      discount: 0,
      deliveryFee,
      total,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      customerEmail: input.customerEmail?.trim() || null,
      deliveryAddress: input.deliveryAddress?.trim() || null,
      deliveryInstructions: input.deliveryInstructions?.trim() || null,
      note: input.simulation
        ? "SIMULATION ONLY: illustrative order stored for testing. No gateway request, payment capture, customer-profile update, stock reservation, inventory movement, fulfilment or sale receipt was created."
        : input.paymentMethod === "mpesa"
          ? "M-Pesa provider is not configured; payment remains pending. Do not treat an STK request as payment confirmation."
          : input.paymentMethod === "bank"
            ? `Awaiting authorised bank-transfer verification${input.paymentReference ? `; reference supplied by customer: ${input.paymentReference.trim()}` : ""}.`
            : "Cash payment is pending staff recording and confirmation.",
      isDemo,
      updatedAt: now,
    }).returning({ id: orders.id });

    await tx.insert(orderItems).values(items.map((item) => ({
      orderId: order.id,
      variantId: item.variantId,
      productName: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
    })));
    await tx.insert(payments).values({
      orderId: order.id,
      method: input.paymentMethod,
      status: "pending",
      amount: total,
      providerReference: input.simulation ? null : input.paymentReference?.trim() || null,
    });

    if (!input.simulation) {
      for (const item of items) {
        const balance = (await tx.select().from(inventoryBalances)
          .where(and(eq(inventoryBalances.variantId, item.variantId), eq(inventoryBalances.branchId, branch.id)))
          .for("update").limit(1))[0]!;
        await tx.update(inventoryBalances).set({ reserved: balance.reserved + item.quantity, updatedAt: now })
          .where(eq(inventoryBalances.id, balance.id));
        await tx.insert(stockReservations).values({
          orderId: order.id,
          variantId: item.variantId,
          branchId: branch.id,
          quantity: item.quantity,
          status: "active",
          expiresAt: reservationExpiry,
        });
        await tx.insert(stockMovements).values({
          variantId: item.variantId,
          branchId: branch.id,
          movementType: "reserved",
          quantity: item.quantity,
          reference,
          reason: "Online checkout reservation; expires in 30 minutes",
        });
      }
    }

    return {
      reference,
      total,
      currency: "KES" as const,
      paymentStatus: "pending" as const,
      isDemo,
      simulation: Boolean(input.simulation),
      branchName: branch.name,
      deliveryFeeQuoted: false,
    };
  });
}

export async function trackOrder(reference: string, phone: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Order tracking is not connected." });
  const [order] = await db.select({
    reference: orders.reference,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    fulfillment: orders.fulfillment,
    createdAt: orders.createdAt,
    customerPhone: orders.customerPhone,
    isDemo: orders.isDemo,
  }).from(orders).where(eq(orders.reference, reference.trim().toUpperCase())).limit(1);
  if (!order || order.customerPhone !== phone.trim()) throw new TRPCError({ code: "NOT_FOUND", message: "No matching order was found. Check the reference and phone number." });
  return { reference: order.reference, status: order.status, paymentStatus: order.paymentStatus, fulfillment: order.fulfillment, createdAt: order.createdAt, isDemo: order.isDemo };
}

export async function getAdminSummary() {
  const db = await getDb();
  if (!db) return { totalOrders: 0, paidRevenue: 0, pendingPayments: 0, openOrders: 0, lowStockVariants: 0, demoOrders: 0 };
  const [sales] = await db.select({
    totalOrders: sql<number>`count(*) filter (where not ${orders.isDemo})::int`,
    paidRevenue: sql<number>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' and not ${orders.isDemo} and exists (select 1 from ${payments} where ${payments.orderId} = ${orders.id} and ${payments.status} = 'verified') then ${orders.total} else 0 end), 0)::int`,
    pendingPayments: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'pending' and ${orders.status} <> 'cancelled' and not ${orders.isDemo})::int`,
    openOrders: sql<number>`count(*) filter (where ${orders.status} not in ('delivered', 'cancelled') and not ${orders.isDemo})::int`,
    demoOrders: sql<number>`count(*) filter (where ${orders.isDemo})::int`,
  }).from(orders);
  const [inventory] = await db.select({ count: sql<number>`count(*)::int` }).from(inventoryBalances)
    .innerJoin(productVariants, eq(inventoryBalances.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(eq(products.isDemo, false), sql`${inventoryBalances.onHand} - ${inventoryBalances.reserved} - ${inventoryBalances.damaged} <= 4`));
  return {
    totalOrders: Number(sales?.totalOrders ?? 0),
    paidRevenue: Number(sales?.paidRevenue ?? 0),
    pendingPayments: Number(sales?.pendingPayments ?? 0),
    openOrders: Number(sales?.openOrders ?? 0),
    lowStockVariants: Number(inventory?.count ?? 0),
    demoOrders: Number(sales?.demoOrders ?? 0),
  };
}

export async function listAdminOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: orders.id,
    reference: orders.reference,
    customerName: orders.customerName,
    customerPhone: orders.customerPhone,
    channel: orders.channel,
    total: orders.total,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    paymentMethod: orders.paymentMethod,
    fulfillment: orders.fulfillment,
    isDemo: orders.isDemo,
    createdAt: orders.createdAt,
  }).from(orders).orderBy(desc(orders.createdAt)).limit(100);
}

export async function listAdminInventory() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    product: products.name,
    sku: productVariants.sku,
    color: productVariants.color,
    size: productVariants.size,
    branch: branches.name,
    branchId: branches.id,
    categoryName: categories.name,
    onHand: inventoryBalances.onHand,
    reserved: inventoryBalances.reserved,
    damaged: inventoryBalances.damaged,
    inTransit: inventoryBalances.inTransit,
    available: sql<number>`greatest(${inventoryBalances.onHand} - ${inventoryBalances.reserved} - ${inventoryBalances.damaged}, 0)::int`,
    isDemo: products.isDemo,
  }).from(inventoryBalances)
    .innerJoin(productVariants, eq(inventoryBalances.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(branches, eq(inventoryBalances.branchId, branches.id))
    .orderBy(products.name);
}

export async function verifyManualPayment(input: { orderId: number; providerReference?: string; verifiedByUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Payment review is not connected." });
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId)).for("update").limit(1);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
    if (order.isDemo) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Illustrative demo requests cannot be processed or marked paid." });
    if (order.paymentMethod === "mpesa") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "M-Pesa payments require a verified provider callback. They cannot be manually marked paid here." });
    if (order.paymentStatus === "paid") throw new TRPCError({ code: "CONFLICT", message: "This order is already recorded as paid." });
    const [payment] = await tx.select().from(payments).where(eq(payments.orderId, order.id)).limit(1);
    if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "Payment record not found." });
    const now = new Date();
    await tx.update(payments).set({
      status: "verified",
      providerReference: input.providerReference?.trim() || payment.providerReference,
      verifiedByUserId: input.verifiedByUserId,
      verifiedAt: now,
    }).where(eq(payments.id, payment.id));
    await tx.update(orders).set({ paymentStatus: "paid", updatedAt: now }).where(eq(orders.id, order.id));
    const branchId = order.branchId;
    await tx.insert(receipts).values({
      orderId: order.id,
      receiptNumber: `PB-${branchId ?? "UNK"}-${order.channel.toUpperCase()}-${now.getFullYear()}-${nanoid(8).toUpperCase()}`,
      documentType: order.channel === "pos" ? "pos_sale" : "online_sale",
    });
    return { success: true, reference: order.reference };
  });
}

export async function updateOrderStatus(input: { orderId: number; status: "processing" | "ready" | "shipped" | "delivered" | "cancelled"; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Order service is not connected." });
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId)).for("update").limit(1);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
    if (order.isDemo) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Illustrative demo requests cannot be processed as real orders." });
    if (input.status === "cancelled" && order.paymentStatus === "paid") {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Paid orders need the approved refund workflow before cancellation." });
    }
    if (input.status === "delivered" && order.paymentStatus !== "paid") {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Verify payment before marking this order delivered." });
    }
    const now = new Date();
    await tx.update(orders).set({ status: input.status, updatedAt: now }).where(eq(orders.id, order.id));
    if (input.status === "cancelled" || input.status === "delivered") {
      const reservations = await tx.select().from(stockReservations)
        .where(and(eq(stockReservations.orderId, order.id), eq(stockReservations.status, "active"))).for("update");
      for (const reservation of reservations) {
        const [balance] = await tx.select().from(inventoryBalances)
          .where(and(eq(inventoryBalances.variantId, reservation.variantId), eq(inventoryBalances.branchId, reservation.branchId)))
          .for("update").limit(1);
        if (balance) {
          await tx.update(inventoryBalances).set({
            reserved: Math.max(0, balance.reserved - reservation.quantity),
            onHand: input.status === "delivered" ? Math.max(0, balance.onHand - reservation.quantity) : balance.onHand,
            updatedAt: now,
          }).where(eq(inventoryBalances.id, balance.id));
        }
        await tx.update(stockReservations).set({ status: input.status === "delivered" ? "fulfilled" : "released" })
          .where(eq(stockReservations.id, reservation.id));
        await tx.insert(stockMovements).values({
          variantId: reservation.variantId,
          branchId: reservation.branchId,
          movementType: input.status === "delivered" ? "sale" : "reservation_released",
          quantity: input.status === "delivered" ? -reservation.quantity : -reservation.quantity,
          reference: order.reference,
          reason: input.status === "delivered" ? "Order fulfilled" : "Order cancelled; reservation released",
          createdByUserId: input.actorUserId,
        });
      }
    }
    return { success: true };
  });
}


export async function listAdminProducts() {
  return listCatalog({ limit: 100 });
}

export async function createAdminProduct(input: {
  name: string; sku: string; slug: string; categoryId: number; description: string;
  material?: string; retailPrice: number; wholesalePrice?: number; compareAtPrice?: number;
  imageUrl?: string; variantSku?: string; color?: string; size?: string; branchId: number; openingStock: number;
  actorUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Neon catalogue service is not connected." });
  if (input.retailPrice <= 0 || input.openingStock < 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a positive retail price and non-negative opening stock." });
  return db.transaction(async (tx) => {
    const [category] = await tx.select().from(categories).where(and(eq(categories.id, input.categoryId), eq(categories.isActive, true))).limit(1);
    const [branch] = await tx.select().from(branches).where(and(eq(branches.id, input.branchId), eq(branches.isActive, true), eq(branches.isConfirmed, true))).limit(1);
    if (!category || !branch) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose an active category and confirmed branch." });
    const [product] = await tx.insert(products).values({
      name: input.name.trim(), slug: input.slug.trim().toLowerCase(), sku: input.sku.trim().toUpperCase(),
      categoryId: category.id, description: input.description.trim(), material: input.material?.trim() || null,
      retailPrice: input.retailPrice, wholesalePrice: input.wholesalePrice ?? null,
      compareAtPrice: input.compareAtPrice ?? null, imageUrl: input.imageUrl?.trim() || null,
      isDemo: false, isActive: true,
    }).returning({ id: products.id });
    const variantSku = (input.variantSku?.trim() || input.sku).toUpperCase();
    const [variant] = await tx.insert(productVariants).values({
      productId: product.id, sku: variantSku, color: input.color?.trim() || null,
      size: input.size?.trim() || null, retailPrice: input.retailPrice, isActive: true,
    }).returning({ id: productVariants.id });
    await tx.insert(inventoryBalances).values({ variantId: variant.id, branchId: branch.id, onHand: input.openingStock, reserved: 0, damaged: 0, inTransit: 0 });
    if (input.imageUrl?.trim()) await tx.insert(productImages).values({ productId: product.id, url: input.imageUrl.trim(), alt: `${input.name.trim()} product photo`, sortOrder: 0 });
    if (input.openingStock > 0) await tx.insert(stockMovements).values({ variantId: variant.id, branchId: branch.id, movementType: "opening_stock", quantity: input.openingStock, reference: input.sku.trim().toUpperCase(), reason: "Initial stock entered during product creation", createdByUserId: input.actorUserId });
    await tx.insert(auditLogs).values({ actorUserId: input.actorUserId, branchId: branch.id, action: "product.created", entityType: "product", entityId: String(product.id), details: `SKU ${input.sku.trim().toUpperCase()}` });
    return { success: true, productId: product.id, variantId: variant.id };
  });
}

export async function adjustBranchStock(input: { variantId: number; branchId: number; delta: number; reason: string; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Neon inventory service is not connected." });
  if (!Number.isInteger(input.delta) || input.delta === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a non-zero whole-unit stock adjustment." });
  return db.transaction(async (tx) => {
    const [row] = await tx.select({ balanceId: inventoryBalances.id, onHand: inventoryBalances.onHand, reserved: inventoryBalances.reserved, damaged: inventoryBalances.damaged, productName: products.name, isDemo: products.isDemo }).from(inventoryBalances)
      .innerJoin(productVariants, eq(inventoryBalances.variantId, productVariants.id)).innerJoin(products, eq(productVariants.productId, products.id))
      .where(and(eq(inventoryBalances.variantId, input.variantId), eq(inventoryBalances.branchId, input.branchId))).for("update").limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "No stock balance was found for this product and branch." });
    if (row.isDemo) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Illustrative seed stock is read-only. Add verified products and stock before making operational adjustments." });
    const nextOnHand = row.onHand + input.delta;
    if (nextOnHand < row.reserved + row.damaged) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The adjustment cannot reduce on-hand below reserved and damaged stock." });
    const now = new Date();
    await tx.update(inventoryBalances).set({ onHand: nextOnHand, updatedAt: now }).where(eq(inventoryBalances.id, row.balanceId));
    await tx.insert(stockMovements).values({ variantId: input.variantId, branchId: input.branchId, movementType: "adjustment", quantity: input.delta, reason: input.reason.trim(), createdByUserId: input.actorUserId });
    await tx.insert(auditLogs).values({ actorUserId: input.actorUserId, branchId: input.branchId, action: "inventory.adjusted", entityType: "variant", entityId: String(input.variantId), details: `${row.productName}; delta ${input.delta}; ${input.reason.trim()}` });
    return { success: true, onHand: nextOnHand };
  });
}

export async function getOpenRegister(input: { branchId: number; terminalId: string; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Register service is not connected." });
  const [session] = await db.select().from(cashRegisterSessions).where(and(eq(cashRegisterSessions.branchId, input.branchId), eq(cashRegisterSessions.terminalId, input.terminalId), eq(cashRegisterSessions.status, "open"))).limit(1);
  if (!session) return null;
  if (session.staffUserId !== input.actorUserId) return { occupiedByOther: true as const };
  const movements = await db.select().from(cashRegisterMovements).where(eq(cashRegisterMovements.sessionId, session.id)).orderBy(desc(cashRegisterMovements.createdAt));
  return { ...session, movements, expectedCash: session.openingFloat + session.cashSales - session.cashRefunds + session.cashIn - session.cashOut };
}

export async function openCashRegister(input: { branchId: number; terminalId: string; openingFloat: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Register service is not connected." });
  if (input.openingFloat < 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Opening float cannot be negative." });
  return db.transaction(async (tx) => {
    const [branch] = await tx.select().from(branches).where(and(eq(branches.id, input.branchId), eq(branches.isActive, true), eq(branches.isConfirmed, true))).limit(1);
    if (!branch) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a confirmed operating branch." });
    const [existing] = await tx.select().from(cashRegisterSessions).where(and(eq(cashRegisterSessions.branchId, input.branchId), eq(cashRegisterSessions.terminalId, input.terminalId), eq(cashRegisterSessions.status, "open"))).for("update").limit(1);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "This register already has an open session." });
    const [session] = await tx.insert(cashRegisterSessions).values({ branchId: input.branchId, terminalId: input.terminalId, staffUserId: input.actorUserId, openingFloat: input.openingFloat }).returning();
    await tx.insert(auditLogs).values({ actorUserId: input.actorUserId, branchId: input.branchId, action: "register.opened", entityType: "register_session", entityId: String(session.id), details: `Opening float ${input.openingFloat} minor units` });
    return session;
  });
}

export async function recordRegisterMovement(input: { sessionId: number; kind: "cash_in" | "cash_out" | "cash_refund"; amount: number; reason: string; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Register service is not connected." });
  if (input.amount <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a positive amount." });
  return db.transaction(async (tx) => {
    const [session] = await tx.select().from(cashRegisterSessions).where(and(eq(cashRegisterSessions.id, input.sessionId), eq(cashRegisterSessions.status, "open"))).for("update").limit(1);
    if (!session || session.staffUserId !== input.actorUserId) throw new TRPCError({ code: "FORBIDDEN", message: "Only the staff member who opened this register may record its cash movements." });
    await tx.insert(cashRegisterMovements).values({ sessionId: session.id, kind: input.kind, amount: input.amount, reason: input.reason.trim(), actorUserId: input.actorUserId });
    const key = input.kind === "cash_in" ? "cashIn" : input.kind === "cash_out" ? "cashOut" : "cashRefunds";
    await tx.update(cashRegisterSessions).set({ [key]: session[key] + input.amount }).where(eq(cashRegisterSessions.id, session.id));
    await tx.insert(auditLogs).values({ actorUserId: input.actorUserId, branchId: session.branchId, action: `register.${input.kind}`, entityType: "register_session", entityId: String(session.id), details: `${input.amount} minor units; ${input.reason.trim()}` });
    return { success: true };
  });
}

export async function closeCashRegister(input: { sessionId: number; actualCash: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Register service is not connected." });
  if (input.actualCash < 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Counted drawer cash cannot be negative." });
  return db.transaction(async (tx) => {
    const [session] = await tx.select().from(cashRegisterSessions).where(and(eq(cashRegisterSessions.id, input.sessionId), eq(cashRegisterSessions.status, "open"))).for("update").limit(1);
    if (!session || session.staffUserId !== input.actorUserId) throw new TRPCError({ code: "FORBIDDEN", message: "Only the staff member who opened this register may close it." });
    const expected = session.openingFloat + session.cashSales - session.cashRefunds + session.cashIn - session.cashOut;
    const variance = input.actualCash - expected;
    await tx.update(cashRegisterSessions).set({ status: "closed", closedAt: new Date(), actualCash: input.actualCash, expectedCash: expected, variance, closedByUserId: input.actorUserId }).where(eq(cashRegisterSessions.id, session.id));
    await tx.insert(auditLogs).values({ actorUserId: input.actorUserId, branchId: session.branchId, action: "register.closed", entityType: "register_session", entityId: String(session.id), details: `Expected ${expected}; actual ${input.actualCash}; variance ${variance}` });
    return { success: true, expectedCash: expected, actualCash: input.actualCash, variance };
  });
}

export async function createPosCashSale(input: { sessionId: number; items: { variantId: number; quantity: number }[]; cashReceived: number; customerName?: string; customerPhone?: string; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "POS service is not connected." });
  const quantities = new Map<number, number>();
  for (const item of input.items) quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
  if (quantities.size === 0 || [...quantities.values()].some((qty) => qty < 1 || qty > 50)) throw new TRPCError({ code: "BAD_REQUEST", message: "Add products and choose quantities from 1 to 50." });
  return db.transaction(async (tx) => {
    const [session] = await tx.select().from(cashRegisterSessions).where(and(eq(cashRegisterSessions.id, input.sessionId), eq(cashRegisterSessions.status, "open"))).for("update").limit(1);
    if (!session || session.staffUserId !== input.actorUserId) throw new TRPCError({ code: "FORBIDDEN", message: "Open your own register before recording a counter sale." });
    const variants = await tx.select({ variantId: productVariants.id, variantSku: productVariants.sku, variantPrice: productVariants.retailPrice, productId: products.id, name: products.name, productSku: products.sku, price: products.retailPrice, isDemo: products.isDemo }).from(productVariants).innerJoin(products, eq(productVariants.productId, products.id)).where(and(inArray(productVariants.id, [...quantities.keys()]), eq(productVariants.isActive, true), eq(products.isActive, true))).for("update");
    const variantById = new Map(variants.map((row) => [row.variantId, row]));
    if (variantById.size !== quantities.size) throw new TRPCError({ code: "BAD_REQUEST", message: "One or more items are unavailable." });
    if (variants.some((row) => row.isDemo)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Illustrative demo catalogue items cannot be sold. Enter verified catalogue and stock first." });
    let total = 0;
    const lines: { variantId: number; quantity: number; name: string; sku: string; unitPrice: number; balanceId: number; onHand: number; reserved: number; damaged: number }[] = [];
    for (const [variantId, quantity] of quantities) {
      const item = variantById.get(variantId)!;
      const [balance] = await tx.select().from(inventoryBalances).where(and(eq(inventoryBalances.variantId, variantId), eq(inventoryBalances.branchId, session.branchId))).for("update").limit(1);
      const available = balance ? balance.onHand - balance.reserved - balance.damaged : 0;
      if (!balance || available < quantity) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `${item.name} does not have enough sellable stock at this branch.` });
      const unitPrice = item.variantPrice ?? item.price;
      total += unitPrice * quantity;
      lines.push({ variantId, quantity, name: item.name, sku: item.variantSku || item.productSku, unitPrice, balanceId: balance.id, onHand: balance.onHand, reserved: balance.reserved, damaged: balance.damaged });
    }
    if (input.cashReceived < total) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cash received must cover the full amount due. Non-cash and split tender stay unavailable until verification is connected." });
    const now = new Date();
    const phone = input.customerPhone?.trim() || "";
    let customerId: number | null = null;
    if (phone) {
      const [customer] = await tx.insert(customers).values({ name: input.customerName?.trim() || "Counter customer", phone, segment: "retail" }).onConflictDoUpdate({ target: customers.phone, set: { name: input.customerName?.trim() || "Counter customer" } }).returning({ id: customers.id });
      customerId = customer.id;
    }
    const reference = `PB-POS-${now.getFullYear()}-${nanoid(8).toUpperCase()}`;
    const [order] = await tx.insert(orders).values({ reference, customerId, branchId: session.branchId, channel: "pos", status: "delivered", paymentStatus: "paid", fulfillment: "collection", paymentMethod: "cash", subtotal: total, discount: 0, deliveryFee: 0, total, customerName: input.customerName?.trim() || "Walk-in customer", customerPhone: phone || "N/A", note: "Cash received and recorded by authorised staff.", isDemo: false, updatedAt: now }).returning({ id: orders.id });
    await tx.insert(orderItems).values(lines.map((line) => ({ orderId: order.id, variantId: line.variantId, productName: line.name, sku: line.sku, quantity: line.quantity, unitPrice: line.unitPrice, lineTotal: line.unitPrice * line.quantity })));
    await tx.insert(payments).values({ orderId: order.id, method: "cash", status: "verified", amount: total, verifiedByUserId: input.actorUserId, verifiedAt: now });
    for (const line of lines) {
      await tx.update(inventoryBalances).set({ onHand: line.onHand - line.quantity, updatedAt: now }).where(eq(inventoryBalances.id, line.balanceId));
      await tx.insert(stockMovements).values({ variantId: line.variantId, branchId: session.branchId, movementType: "pos_sale", quantity: -line.quantity, reference, reason: "Verified cash POS sale", createdByUserId: input.actorUserId });
    }
    const [receipt] = await tx.insert(receipts).values({ orderId: order.id, receiptNumber: `PENDING-${nanoid(14).toUpperCase()}`, documentType: "pos_sale" }).returning({ id: receipts.id });
    const receiptNumber = `PB-${session.branchId}-${now.getFullYear()}-${String(receipt.id).padStart(8, "0")}`;
    await tx.update(receipts).set({ receiptNumber }).where(eq(receipts.id, receipt.id));
    await tx.update(cashRegisterSessions).set({ cashSales: session.cashSales + total }).where(eq(cashRegisterSessions.id, session.id));
    await tx.insert(auditLogs).values({ actorUserId: input.actorUserId, branchId: session.branchId, action: "pos.sale.completed", entityType: "order", entityId: String(order.id), details: `Reference ${reference}; receipt ${receiptNumber}; verified cash ${total}` });
    return { reference, receiptNumber, total, cashReceived: input.cashReceived, change: input.cashReceived - total, currency: "KES" as const };
  });
}
