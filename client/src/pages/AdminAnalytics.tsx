import { useState } from "react";
import { Activity, BarChart3, CircleDollarSign, ClipboardList, Clock3, MapPin, PackageSearch, RefreshCw, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatKes } from "@/lib/format";
import { trpc } from "@/lib/trpc";

const ranges = [7, 30, 90] as const;
type RangeDays = typeof ranges[number];

export default function AdminAnalytics() {
  const [days, setDays] = useState<RangeDays>(30);
  const result = trpc.admin.salesAnalytics.useQuery({ days }, { retry: false, refetchOnWindowFocus: false });
  const data = result.data;
  const hasSales = (data?.metrics.paidOrders ?? 0) > 0;
  const channelPeak = Math.max(1, ...(data?.channels.map((item) => item.revenue) ?? []));
  const branchPeak = Math.max(1, ...(data?.branches.map((item) => item.revenue) ?? []));

  if (result.isLoading) return <section className="admin-live-panel analytics-panel"><div className="analytics-message"><RefreshCw size={17} className="analytics-spin" /> Loading verified Neon sales…</div></section>;
  if (result.error || !data) return <section className="admin-live-panel analytics-panel"><div className="analytics-message analytics-error" role="alert"><strong>Sales analytics could not be loaded.</strong><span>Try again after confirming Neon is available.</span><button className="button-outline" onClick={() => void result.refetch()}>Retry</button></div></section>;

  return <section className="admin-live-panel analytics-panel">
    <div className="analytics-heading">
      <div><span className="eyebrow">NEON · VERIFIED RECORDS</span><h2>Sales, with the facts.</h2><p>Only non-demo orders recorded as paid are counted as sales. Pending payments and simulated orders are shown separately and never enter revenue or product rankings.</p></div>
      <div className="analytics-range" role="group" aria-label="Analytics date range">{ranges.map((value) => <button key={value} aria-pressed={days === value} className={days === value ? "selected" : ""} onClick={() => setDays(value)}>{value} days</button>)}</div>
    </div>

    <div className="analytics-kpis">
      <AnalyticsKpi icon={<CircleDollarSign size={18} />} label={`Verified sales · ${days} days`} value={formatKes(data.metrics.verifiedPaidRevenue)} detail={`Today ${formatKes(data.metrics.todayRevenue)} · WTD ${formatKes(data.metrics.weekRevenue)} · MTD ${formatKes(data.metrics.monthRevenue)}`} />
      <AnalyticsKpi icon={<ClipboardList size={18} />} label="Paid orders" value={String(data.metrics.paidOrders)} detail={`${data.metrics.totalOrders} non-demo orders placed in range`} />
      <AnalyticsKpi icon={<TrendingUp size={18} />} label="Average order value" value={formatKes(data.metrics.averageOrderValue)} detail="Paid non-demo order total ÷ paid order count" />
      <AnalyticsKpi icon={<Clock3 size={18} />} label={`Pending amount · ${days} days`} value={formatKes(data.metrics.pendingAmount)} detail={`${data.metrics.pendingOrders} active pending · excluded from paid sales`} tone="pending" />
    </div>

    <div className="analytics-main-grid">
      <article className="analytics-card analytics-trend-card">
        <div className="analytics-card-head"><div><span className="eyebrow">DAILY TOTAL</span><h3>Verified paid sales</h3></div><span className="analytics-source-tag"><Activity size={13} /> Neon</span></div>
        {hasSales ? <div className="analytics-chart" role="img" aria-label={`Verified paid sales over ${days} days`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.daily} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs><linearGradient id="pbSalesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4b31d6" stopOpacity={0.24} /><stop offset="96%" stopColor="#4b31d6" stopOpacity={0.015} /></linearGradient></defs>
          <CartesianGrid stroke="#eceaf6" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#77748a", fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tickFormatter={(value) => formatKes(Number(value))} tick={{ fill: "#77748a", fontSize: 11 }} tickLine={false} axisLine={false} width={83} />
          <Tooltip formatter={(value) => [formatKes(Number(value)), "Verified paid sales"]} labelFormatter={(label) => String(label)} contentStyle={{ border: "1px solid #e7e3f5", borderRadius: 8, background: "#fff", fontSize: 12 }} />
          <Area type="monotone" dataKey="revenue" stroke="#442bd0" strokeWidth={2.5} fill="url(#pbSalesFill)" activeDot={{ r: 4, fill: "#442bd0" }} />
        </AreaChart></ResponsiveContainer></div> : <EmptyAnalytics icon={<BarChart3 size={22} />} title="No verified paid sales yet" detail="Once a real order is paid and recorded in Neon, its daily total appears here. Simulated and pending orders stay out." />}
      </article>

      <article className="analytics-card">
        <div className="analytics-card-head"><div><span className="eyebrow">SALES MIX</span><h3>By channel</h3></div><ClipboardList size={17} /></div>
        {data.channels.length ? <div className="analytics-breakdown-list">{data.channels.map((item) => <BreakdownRow key={item.channel} label={channelLabel(item.channel)} detail={`${item.orders} paid ${item.orders === 1 ? "order" : "orders"}`} value={item.revenue} max={channelPeak} />)}</div> : <EmptyAnalytics icon={<ClipboardList size={20} />} title="No channel totals" detail="Verified sales by channel will appear here." />}
      </article>
    </div>

    <div className="analytics-secondary-grid">
      <article className="analytics-card">
        <div className="analytics-card-head"><div><span className="eyebrow">BRANCH PERFORMANCE</span><h3>Verified sales by branch</h3></div><MapPin size={17} /></div>
        {data.branches.length ? <div className="analytics-breakdown-list">{data.branches.map((item) => <BreakdownRow key={item.branch} label={item.branch} detail={`${item.orders} paid ${item.orders === 1 ? "order" : "orders"}`} value={item.revenue} max={branchPeak} />)}</div> : <EmptyAnalytics icon={<MapPin size={20} />} title="No branch sales recorded" detail="Branch comparisons only use verified paid transactions." />}
      </article>
      <article className="analytics-card analytics-top-products">
        <div className="analytics-card-head"><div><span className="eyebrow">PRODUCT PERFORMANCE</span><h3>Top-selling products</h3></div><PackageSearch size={17} /></div>
        {data.bestSellers.length ? <div className="analytics-product-list">{data.bestSellers.map((item, index) => <div className="analytics-product-row" key={`${item.sku}-${item.name}`}><span className="analytics-product-rank">{String(index + 1).padStart(2, "0")}</span><span className="analytics-product-label"><strong>{item.name}</strong><small>{item.sku} · {item.units} {item.units === 1 ? "unit" : "units"}</small></span><b>{formatKes(item.revenue)}</b></div>)}</div> : <EmptyAnalytics icon={<PackageSearch size={20} />} title="No product sales to rank" detail="Demo catalogue entries and unverified orders are excluded." />}
      </article>
    </div>

    <p className="analytics-footnote"><Clock3 size={14} /> Reports use Neon order timestamps in UTC and integer KES minor units. “Pending amount” is not revenue; no profit or tax figure is calculated here.</p>
  </section>;
}

function AnalyticsKpi({ icon, label, value, detail, tone = "" }: { icon: React.ReactNode; label: string; value: string; detail: string; tone?: string }) {
  return <article className={`analytics-kpi${tone ? ` ${tone}` : ""}`}><span className="analytics-kpi-icon">{icon}</span><small>{label}</small><strong>{value}</strong><p>{detail}</p></article>;
}

function BreakdownRow({ label, detail, value, max }: { label: string; detail: string; value: number; max: number }) {
  const width = value <= 0 ? 0 : Math.min(100, Math.max(4, (value / max) * 100));
  return <div className="analytics-breakdown-row"><div className="analytics-breakdown-top"><strong>{label}</strong><span>{formatKes(value)}</span></div><div className="analytics-progress"><i style={{ width: `${width}%` }} /></div><small>{detail}</small></div>;
}

function EmptyAnalytics({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="analytics-empty">{icon}<strong>{title}</strong><span>{detail}</span></div>;
}

function channelLabel(value: string) {
  if (value === "pos") return "Point of sale";
  if (value === "wholesale") return "Wholesale";
  return "Online";
}
