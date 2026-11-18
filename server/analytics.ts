import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { branches, orderItems, orders, payments } from "../drizzle/schema";
import { getDb } from "./db";

const DAY_MS = 24 * 60 * 60 * 1000;
export type AnalyticsDays = 7 | 30 | 90;

const amount = (value: unknown) => Number(value ?? 0);
const utcDay = (value: Date) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

export async function getSalesAnalytics(days: AnalyticsDays = 30) {
  const db = await getDb();
  if (!db) {
    return {
      days,
      startDate: "",
      metrics: { verifiedPaidRevenue: 0, paidOrders: 0, totalOrders: 0, averageOrderValue: 0, pendingOrders: 0, pendingAmount: 0, failedOrders: 0, todayRevenue: 0, weekRevenue: 0, monthRevenue: 0 },
      daily: [],
      channels: [],
      branches: [],
      bestSellers: [],
    };
  }

  const now = new Date();
  const todayStart = utcDay(now);
  const rangeStart = new Date(todayStart.getTime() - (days - 1) * DAY_MS);
  const weekStart = new Date(todayStart.getTime() - ((todayStart.getUTCDay() + 6) % 7) * DAY_MS);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const rangeStartIso = rangeStart.toISOString();
  const todayStartIso = todayStart.toISOString();
  const weekStartIso = weekStart.toISOString();
  const monthStartIso = monthStart.toISOString();
  const realRange = and(eq(orders.isDemo, false), gte(orders.createdAt, rangeStart), lte(orders.createdAt, now));
  const verifiedPaymentExists = sql`exists (select 1 from ${payments} where ${payments.orderId} = ${orders.id} and ${payments.status} = 'verified')`;
  const paidRange = and(realRange, eq(orders.paymentStatus, "paid"), verifiedPaymentExists);

  const [totals] = await db.select({
    verifiedPaidRevenue: sql<number>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' and ${verifiedPaymentExists} and ${orders.createdAt} >= ${rangeStartIso}::timestamptz then ${orders.total} else 0 end), 0)::numeric`,
    paidOrders: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'paid' and ${verifiedPaymentExists} and ${orders.createdAt} >= ${rangeStartIso}::timestamptz)::int`,
    totalOrders: sql<number>`count(*) filter (where ${orders.createdAt} >= ${rangeStartIso}::timestamptz)::int`,
    averageOrderValue: sql<number>`coalesce(avg(case when ${orders.paymentStatus} = 'paid' and ${verifiedPaymentExists} and ${orders.createdAt} >= ${rangeStartIso}::timestamptz then ${orders.total} end), 0)::numeric`,
    pendingOrders: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'pending' and ${orders.status} <> 'cancelled' and ${orders.createdAt} >= ${rangeStartIso}::timestamptz)::int`,
    pendingAmount: sql<number>`coalesce(sum(case when ${orders.paymentStatus} = 'pending' and ${orders.status} <> 'cancelled' and ${orders.createdAt} >= ${rangeStartIso}::timestamptz then ${orders.total} else 0 end), 0)::numeric`,
    failedOrders: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'failed' and ${orders.createdAt} >= ${rangeStartIso}::timestamptz)::int`,
    todayRevenue: sql<number>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' and ${verifiedPaymentExists} and ${orders.createdAt} >= ${todayStartIso}::timestamptz then ${orders.total} else 0 end), 0)::numeric`,
    weekRevenue: sql<number>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' and ${verifiedPaymentExists} and ${orders.createdAt} >= ${weekStartIso}::timestamptz then ${orders.total} else 0 end), 0)::numeric`,
    monthRevenue: sql<number>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' and ${verifiedPaymentExists} and ${orders.createdAt} >= ${monthStartIso}::timestamptz then ${orders.total} else 0 end), 0)::numeric`,
  }).from(orders).where(and(eq(orders.isDemo, false), lte(orders.createdAt, now)));

  const dayExpression = sql`date_trunc('day', ${orders.createdAt} at time zone 'UTC')`;
  const [dailyRows, channelRows, branchRows, productRows] = await Promise.all([
    db.select({
      date: sql<string>`to_char(${dayExpression}, 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)::numeric`,
      orders: sql<number>`count(*)::int`,
    }).from(orders).where(paidRange).groupBy(dayExpression).orderBy(dayExpression),
    db.select({
      channel: orders.channel,
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)::numeric`,
      orders: sql<number>`count(*)::int`,
    }).from(orders).where(paidRange).groupBy(orders.channel).orderBy(desc(sql`sum(${orders.total})`)),
    db.select({
      branch: sql<string>`coalesce(${branches.name}, 'Unassigned')`,
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)::numeric`,
      orders: sql<number>`count(*)::int`,
    }).from(orders).leftJoin(branches, eq(orders.branchId, branches.id)).where(paidRange)
      .groupBy(branches.id, branches.name).orderBy(desc(sql`sum(${orders.total})`)),
    db.select({
      name: orderItems.productName,
      sku: orderItems.sku,
      units: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      revenue: sql<number>`coalesce(sum(${orderItems.lineTotal}), 0)::numeric`,
    }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.isDemo, false), eq(orders.paymentStatus, "paid"), verifiedPaymentExists, gte(orders.createdAt, rangeStart), lte(orders.createdAt, now)))
      .groupBy(orderItems.productName, orderItems.sku).orderBy(desc(sql`sum(${orderItems.quantity})`), desc(sql`sum(${orderItems.lineTotal})`)).limit(8),
  ]);

  const dailyMap = new Map(dailyRows.map((row) => [row.date, { revenue: amount(row.revenue), orders: amount(row.orders) }]));
  const daily = Array.from({ length: days }, (_, index) => {
    const day = new Date(rangeStart.getTime() + index * DAY_MS);
    const key = day.toISOString().slice(0, 10);
    const item = dailyMap.get(key) ?? { revenue: 0, orders: 0 };
    return { date: key, label: day.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" }), ...item };
  });

  return {
    days,
    startDate: rangeStart.toISOString().slice(0, 10),
    metrics: {
      verifiedPaidRevenue: amount(totals?.verifiedPaidRevenue),
      paidOrders: amount(totals?.paidOrders),
      totalOrders: amount(totals?.totalOrders),
      averageOrderValue: amount(totals?.averageOrderValue),
      pendingOrders: amount(totals?.pendingOrders),
      pendingAmount: amount(totals?.pendingAmount),
      failedOrders: amount(totals?.failedOrders),
      todayRevenue: amount(totals?.todayRevenue),
      weekRevenue: amount(totals?.weekRevenue),
      monthRevenue: amount(totals?.monthRevenue),
    },
    daily,
    channels: channelRows.map((row) => ({ channel: row.channel, revenue: amount(row.revenue), orders: amount(row.orders) })),
    branches: branchRows.map((row) => ({ branch: row.branch, revenue: amount(row.revenue), orders: amount(row.orders) })),
    bestSellers: productRows.map((row) => ({ name: row.name, sku: row.sku, units: amount(row.units), revenue: amount(row.revenue) })),
  };
}
