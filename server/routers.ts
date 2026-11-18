import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import {
  adjustBranchStock,
  closeCashRegister,
  createAdminProduct,
  createCheckoutOrder,
  createPosCashSale,
  getAdminSummary,
  getOpenRegister,
  listAdminInventory,
  listAdminOrders,
  listAdminProducts,
  listBranches,
  listCatalog,
  listCategories,
  openCashRegister,
  recordRegisterMovement,
  trackOrder,
  updateOrderStatus,
  verifyManualPayment,
  getProductImages,
} from "./commerce";
import { getSalesAnalytics } from "./analytics";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const catalogRouter = router({
  list: publicProcedure.input(z.object({
    q: z.string().trim().max(100).optional(),
    category: z.string().trim().max(140).optional(),
    minPrice: z.number().int().min(0).optional(),
    maxPrice: z.number().int().min(0).optional(),
    slug: z.string().trim().max(200).optional(),
    sort: z.enum(["newest", "price-asc", "price-desc", "popular"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }).optional()).query(({ input }) => listCatalog(input ?? {})),
  bySlug: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(200) })).query(async ({ input }) => {
    const products = await listCatalog({ slug: input.slug, limit: 100 });
    return products[0] ?? null;
  }),
  categories: publicProcedure.query(() => listCategories()),
  branches: publicProcedure.query(() => listBranches()),
  images: publicProcedure.input(z.object({ productId: z.number().int().positive() })).query(({ input }) => getProductImages(input.productId)),
});

const commerceRouter = router({
  createOrder: publicProcedure.input(z.object({
    items: z.array(z.object({ variantId: z.number().int().positive(), quantity: z.number().int().min(1).max(20) })).min(1).max(30),
    fulfillment: z.enum(["delivery", "collection"]),
    paymentMethod: z.enum(["mpesa", "cash", "bank"]),
    customerName: z.string().trim().min(2).max(160),
    customerPhone: z.string().trim().min(9).max(32),
    customerEmail: z.string().trim().email().max(320).optional().or(z.literal("")),
    deliveryAddress: z.string().trim().max(1000).optional(),
    deliveryInstructions: z.string().trim().max(1000).optional(),
    branchId: z.number().int().positive().optional(),
    paymentReference: z.string().trim().max(120).optional(),
    simulation: z.boolean().optional(),
  })).mutation(({ input }) => createCheckoutOrder(input)),
  track: publicProcedure.input(z.object({
    reference: z.string().trim().min(5).max(48),
    phone: z.string().trim().min(9).max(32),
  })).query(({ input }) => trackOrder(input.reference, input.phone)),
});

const marketingRouter = router({
  subscribe: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), consent: z.literal(true) }))
    .mutation(({ input }) => import("./marketing").then(({ subscribeToNewsletter }) => subscribeToNewsletter(input))),
});

const adminRouter = router({
  summary: adminProcedure.query(() => getAdminSummary()),
  salesAnalytics: adminProcedure.input(z.object({ days: z.union([z.literal(7), z.literal(30), z.literal(90)]) }).optional())
    .query(({ input }) => getSalesAnalytics(input?.days ?? 30)),
  products: adminProcedure.query(() => listAdminProducts()),
  categories: adminProcedure.query(() => listCategories()),
  orders: adminProcedure.query(() => listAdminOrders()),
  inventory: adminProcedure.query(() => listAdminInventory()),
  addProduct: adminProcedure.input(z.object({
    name: z.string().trim().min(2).max(180),
    sku: z.string().trim().min(2).max(64),
    slug: z.string().trim().min(2).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    categoryId: z.number().int().positive(),
    description: z.string().trim().min(8).max(10000),
    material: z.string().trim().max(160).optional(),
    retailPrice: z.number().int().positive().max(100000000),
    wholesalePrice: z.number().int().positive().max(100000000).optional(),
    compareAtPrice: z.number().int().positive().max(100000000).optional(),
    imageUrl: z.string().url().max(2048).optional().or(z.literal("")),
    variantSku: z.string().trim().min(2).max(64).optional(),
    color: z.string().trim().max(60).optional(),
    size: z.string().trim().max(60).optional(),
    branchId: z.number().int().positive(),
    openingStock: z.number().int().min(0).max(1000000),
  })).mutation(({ ctx, input }) => createAdminProduct({ ...input, actorUserId: ctx.user.id })),
  adjustStock: adminProcedure.input(z.object({
    variantId: z.number().int().positive(), branchId: z.number().int().positive(),
    delta: z.number().int().min(-100000).max(100000).refine((value) => value !== 0),
    reason: z.string().trim().min(4).max(500),
  })).mutation(({ ctx, input }) => adjustBranchStock({ ...input, actorUserId: ctx.user.id })),
  verifyManualPayment: adminProcedure.input(z.object({ orderId: z.number().int().positive(), providerReference: z.string().trim().max(120).optional() }))
    .mutation(({ ctx, input }) => verifyManualPayment({ ...input, verifiedByUserId: ctx.user.id })),
  updateOrderStatus: adminProcedure.input(z.object({ orderId: z.number().int().positive(), status: z.enum(["processing", "ready", "shipped", "delivered", "cancelled"]) }))
    .mutation(({ ctx, input }) => updateOrderStatus({ ...input, actorUserId: ctx.user.id })),
});

const posRouter = router({
  getSession: adminProcedure.input(z.object({ branchId: z.number().int().positive(), terminalId: z.string().trim().min(1).max(32) }))
    .query(({ ctx, input }) => getOpenRegister({ ...input, actorUserId: ctx.user.id })),
  openRegister: adminProcedure.input(z.object({ branchId: z.number().int().positive(), terminalId: z.string().trim().min(1).max(32), openingFloat: z.number().int().min(0).max(100000000) }))
    .mutation(({ ctx, input }) => openCashRegister({ ...input, actorUserId: ctx.user.id })),
  cashMovement: adminProcedure.input(z.object({ sessionId: z.number().int().positive(), kind: z.enum(["cash_in", "cash_out", "cash_refund"]), amount: z.number().int().positive().max(100000000), reason: z.string().trim().min(4).max(500) }))
    .mutation(({ ctx, input }) => recordRegisterMovement({ ...input, actorUserId: ctx.user.id })),
  closeRegister: adminProcedure.input(z.object({ sessionId: z.number().int().positive(), actualCash: z.number().int().min(0).max(100000000) }))
    .mutation(({ ctx, input }) => closeCashRegister({ ...input, actorUserId: ctx.user.id })),
  completeCashSale: adminProcedure.input(z.object({
    sessionId: z.number().int().positive(),
    items: z.array(z.object({ variantId: z.number().int().positive(), quantity: z.number().int().min(1).max(50) })).min(1).max(30),
    cashReceived: z.number().int().min(0).max(100000000),
    customerName: z.string().trim().max(160).optional(),
    customerPhone: z.string().trim().max(32).optional(),
  })).mutation(({ ctx, input }) => createPosCashSale({ ...input, actorUserId: ctx.user.id })),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: catalogRouter,
  commerce: commerceRouter,
  marketing: marketingRouter,
  admin: adminRouter,
  pos: posRouter,
});

export type AppRouter = typeof appRouter;
