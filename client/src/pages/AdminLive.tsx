import { lazy, Suspense, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Activity, ArrowDownRight, ArrowRight, BarChart3, Boxes, CircleDollarSign, ClipboardList, Clock3, ExternalLink, LayoutDashboard, Package, Plus, RefreshCw, Search, ShieldCheck, ShoppingBag, Warehouse } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatKes, setPageMeta } from "@/lib/format";
import { PB_LOGO_SRC } from "@/lib/brand";
import "./AdminLive.css";

const AdminAnalytics = lazy(() => import("./AdminAnalytics"));
const nav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Sales analytics", icon: BarChart3 },
  { id: "products", label: "Products", icon: Package },
  { id: "inventory", label: "Inventory", icon: Warehouse },
  { id: "orders", label: "Orders & payments", icon: ShoppingBag },
  { id: "branches", label: "Branches", icon: Boxes },
] as const;
type Tab = typeof nav[number]["id"];
const moneyField = (value: string) => Math.round(Number(value) * 100);
const slugify = (value: string) => value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function AdminLive() {
  const [tab, setTab] = useState<Tab>("overview");
  const [query, setQuery] = useState("");
  const [inventoryBranch, setInventoryBranch] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low">("all");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [verifyOrder, setVerifyOrder] = useState<{ id: number; reference: string; method: string } | null>(null);
  const [verifyReference, setVerifyReference] = useState("");
  const [verifyConfirmed, setVerifyConfirmed] = useState(false);
  const [stockVariantId, setStockVariantId] = useState<number | undefined>();
  const [stockDelta, setStockDelta] = useState("");
  const [stockReason, setStockReason] = useState("");
  const [product, setProduct] = useState({ name: "", sku: "", categoryId: "", description: "", material: "", retailPrice: "", wholesalePrice: "", compareAtPrice: "", variantSku: "", color: "", size: "", openingStock: "0" });
  const utils = trpc.useUtils();
  const summary = trpc.admin.summary.useQuery(undefined, { retry: false });
  const products = trpc.admin.products.useQuery(undefined, { retry: false });
  const categories = trpc.admin.categories.useQuery(undefined, { retry: false });
  const inventory = trpc.admin.inventory.useQuery(undefined, { retry: false });
  const orders = trpc.admin.orders.useQuery(undefined, { retry: false });
  const branches = trpc.catalog.branches.useQuery(undefined, { retry: false });
  const [branchId, setBranchId] = useState<number>();
  useEffect(() => { if (!branchId && branches.data?.length) setBranchId(branches.data[0].id); }, [branchId, branches.data]);
  useEffect(() => setPageMeta("Business Workspace | PRINCE BENJA DESIGNS", "Staff-only Neon workspace for live products, stock, orders, payment review and verified sales analytics."), []);

  const refresh = async () => {
    await Promise.all([
      utils.admin.summary.invalidate(), utils.admin.salesAnalytics.invalidate(), utils.admin.products.invalidate(),
      utils.admin.inventory.invalidate(), utils.admin.orders.invalidate(), utils.catalog.list.invalidate(),
    ]);
  };
  const addProduct = trpc.admin.addProduct.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("Product added to Neon.");
      setShowProductForm(false);
      setProduct({ name: "", sku: "", categoryId: "", description: "", material: "", retailPrice: "", wholesalePrice: "", compareAtPrice: "", variantSku: "", color: "", size: "", openingStock: "0" });
    },
    onError: (error) => toast.error(error.message),
  });
  const adjustStock = trpc.admin.adjustStock.useMutation({
    onSuccess: async () => { await refresh(); toast.success("Stock adjustment recorded in the ledger."); setShowStockForm(false); setStockDelta(""); setStockReason(""); },
    onError: (error) => toast.error(error.message),
  });
  const verifyPayment = trpc.admin.verifyManualPayment.useMutation({
    onSuccess: async () => { await refresh(); toast.success("Manual payment verification recorded and audited."); setVerifyOrder(null); setVerifyReference(""); setVerifyConfirmed(false); },
    onError: (error) => toast.error(error.message),
  });
  const changeStatus = trpc.admin.updateOrderStatus.useMutation({ onSuccess: refresh, onError: (error) => toast.error(error.message) });

  const productRows = useMemo(() => (products.data ?? []).filter((item) => `${item.name} ${item.sku} ${item.categoryName ?? ""}`.toLowerCase().includes(query.toLowerCase())), [products.data, query]);
  const inventoryRows = useMemo(() => (inventory.data ?? []).filter((item) => {
    const matchesText = `${item.product} ${item.sku} ${item.branch} ${item.categoryName} ${item.color ?? ""} ${item.size ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesBranch = inventoryBranch === "all" || item.branchId === Number(inventoryBranch);
    const matchesStock = stockFilter === "all" || (!item.isDemo && item.available <= 4);
    return matchesText && matchesBranch && matchesStock;
  }), [inventory.data, query, inventoryBranch, stockFilter]);
  const orderRows = useMemo(() => (orders.data ?? []).filter((item) => `${item.reference} ${item.customerName} ${item.customerPhone} ${item.status}`.toLowerCase().includes(query.toLowerCase())), [orders.data, query]);

  const submitProduct = (event: FormEvent) => {
    event.preventDefault();
    if (!branchId || !product.categoryId) { toast.error("Choose the confirmed branch and a category."); return; }
    addProduct.mutate({
      name: product.name, sku: product.sku, slug: slugify(product.name), categoryId: Number(product.categoryId),
      description: product.description, material: product.material || undefined, retailPrice: moneyField(product.retailPrice),
      wholesalePrice: product.wholesalePrice ? moneyField(product.wholesalePrice) : undefined,
      compareAtPrice: product.compareAtPrice ? moneyField(product.compareAtPrice) : undefined,
      variantSku: product.variantSku || undefined, color: product.color || undefined, size: product.size || undefined,
      branchId, openingStock: Math.max(0, Math.floor(Number(product.openingStock) || 0)),
    });
  };
  const openStockForm = () => {
    const first = (products.data ?? []).find((item) => !item.isDemo && item.variants.length > 0)?.variants[0];
    if (!first) { toast.error("Add a verified operational product before adjusting stock."); return; }
    setStockVariantId(first.id);
    setShowStockForm(true);
  };
  const submitStock = (event: FormEvent) => {
    event.preventDefault();
    if (!stockVariantId || !branchId) return;
    adjustStock.mutate({ variantId: stockVariantId, branchId, delta: Math.trunc(Number(stockDelta)), reason: stockReason });
  };
  const loading = summary.isLoading || products.isLoading || inventory.isLoading || orders.isLoading;
  const trouble = summary.isError || products.isError || inventory.isError || orders.isError;
  const setActiveTab = (next: Tab) => { setTab(next); setQuery(""); };

  return <div className="admin-live-shell">
    <aside className="admin-live-sidebar">
      <Link className="admin-live-wordmark" href="/"><img src={PB_LOGO_SRC} alt="" /><strong>PRINCE BENJA<small>OPERATIONS WORKSPACE</small></strong></Link>
      <div className="admin-live-branch"><span className="live-dot" /><div><b>Pipeline Stage</b><small>Confirmed branch · KES</small></div></div>
      <nav aria-label="Administration">{nav.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setActiveTab(id)}><Icon size={17} />{label}</button>)}</nav>
      <div className="admin-live-side-footer"><ShieldCheck size={15} /> Server-authorised · Neon-backed<br /><span>Private staff route</span></div>
    </aside>

    <main className="admin-live-main">
      <header className="admin-live-topbar"><div><span className="eyebrow">BUSINESS WORKSPACE</span><h1>{nav.find((item) => item.id === tab)?.label}</h1></div><div className="admin-live-top-actions"><span className="admin-live-badge"><i /> CONNECTED DATA</span><button className="admin-live-refresh" aria-label="Refresh workspace data" onClick={() => void refresh()}><RefreshCw size={15} /></button><Link href="/" className="admin-live-store-link">View storefront <ExternalLink size={14} /></Link></div></header>
      {loading && tab !== "analytics" && <div className="admin-live-message"><RefreshCw size={16} /> Loading business data from Neon…</div>}
      {trouble && tab !== "analytics" && <div className="admin-live-error" role="alert"><strong>Workspace data could not be loaded.</strong><span>Confirm Neon is available and try again.</span><button onClick={() => void refresh()}>Retry</button></div>}

      {tab === "analytics" && <Suspense fallback={<div className="admin-live-message"><RefreshCw size={16} /> Loading sales analytics…</div>}><AdminAnalytics /></Suspense>}
      {tab === "overview" && !trouble && <section className="admin-live-panel">
        <div className="admin-live-panel-intro"><div><span className="eyebrow">REAL BUSINESS RECORDS ONLY</span><h2>Today, with the facts.</h2><p>Revenue uses verified, paid, non-demo Neon orders. Sample catalogue entries and simulated orders are excluded from operational metrics.</p></div><button className="button-outline" onClick={() => setActiveTab("analytics")}><BarChart3 size={15} /> Sales analytics <ArrowRight size={15} /></button></div>
        <div className="admin-live-kpis"><Kpi title="Paid sales" value={formatKes(summary.data?.paidRevenue ?? 0)} icon={<CircleDollarSign size={18} />} detail="KES minor units · paid, non-demo orders" /><Kpi title="Orders" value={String(summary.data?.totalOrders ?? 0)} icon={<ClipboardList size={18} />} detail={`${summary.data?.openOrders ?? 0} still open · demo excluded`} /><Kpi title="Pending payments" value={String(summary.data?.pendingPayments ?? 0)} icon={<Clock3 size={18} />} detail="Not counted as paid revenue" /><Kpi title="Low-stock variants" value={String(summary.data?.lowStockVariants ?? 0)} icon={<Activity size={18} />} detail="Operational only · on hand − reserved − damaged ≤ 4" /></div>
        <div className="admin-live-lower"><section className="admin-live-card"><span className="eyebrow">CATALOGUE</span><h3>{products.data?.length ?? 0} product records</h3><p>{products.data?.filter((item) => item.isDemo).length ?? 0} illustrative catalogue samples are visible to customers, but cannot be sold as live merchandise or adjusted as operational stock.</p><button className="text-link" onClick={() => setActiveTab("products")}>Open catalogue <ArrowRight size={14} /></button></section><section className="admin-live-card"><span className="eyebrow">BRANCH OPERATIONS</span><h3>One confirmed location</h3><p>Pipeline Stage is the only active branch. No other locations are represented as existing.</p><button className="text-link" onClick={() => setActiveTab("branches")}>Review branch <ArrowRight size={14} /></button></section></div>
        <p className="admin-live-demo-count">{summary.data?.demoOrders ?? 0} simulated/demo orders are excluded from paid sales and live operational order totals.</p>
      </section>}

      {tab === "products" && <section className="admin-live-panel"><div className="admin-live-toolbar"><div><span className="eyebrow">NEON CATALOGUE</span><p>Verified products you add are public. The initial sample catalogue is tagged illustrative and remains unsellable.</p></div><button className="button-primary button-dark" onClick={() => setShowProductForm(true)}><Plus size={15} /> Add product</button></div><SearchBox value={query} onChange={setQuery} label="Search products" />{productRows.length ? <div className="admin-live-table-wrap"><table className="admin-live-table"><thead><tr><th>PRODUCT</th><th>SKU / VARIANT</th><th>CATEGORY</th><th>RETAIL</th><th>AVAILABLE</th><th>STATUS</th></tr></thead><tbody>{productRows.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.material || "Material not supplied"}</small></td><td>{item.variants.map((variant) => <span key={variant.id} className="admin-live-variant">{variant.sku} · {variant.color || "Standard"} {variant.size || ""}</span>)}</td><td>{item.categoryName || "Uncategorised"}</td><td>{formatKes(item.retailPrice)}</td><td>{item.isDemo ? "Illustrative" : item.available}</td><td><span className={item.isDemo ? "live-status demo" : "live-status active"}>{item.isDemo ? "Demo · read-only" : "Operational"}</span></td></tr>)}</tbody></table></div> : <Empty title="No matching catalogue items" detail="Add your verified product records in Neon." />}</section>}

      {tab === "inventory" && <section className="admin-live-panel"><div className="admin-live-toolbar"><div><span className="eyebrow">BRANCH STOCK CONTROL</span><p>Available = on-hand − reserved − damaged. In-transit stock is shown separately. Demo balances are illustrative and cannot be adjusted.</p></div><button className="button-primary button-dark" onClick={openStockForm}><ArrowDownRight size={15} /> Record adjustment</button></div>
        <div className="admin-inventory-controls"><SearchBox value={query} onChange={setQuery} label="Search product, SKU or branch" /><label>Branch<select value={inventoryBranch} onChange={(event) => setInventoryBranch(event.target.value)}><option value="all">All branches</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label><label>Stock view<select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as typeof stockFilter)}><option value="all">All balances</option><option value="low">Operational low stock only</option></select></label></div>
        {inventoryRows.length ? <div className="admin-live-table-wrap"><table className="admin-live-table"><thead><tr><th>PRODUCT / VARIANT</th><th>SKU</th><th>CATEGORY</th><th>BRANCH</th><th>ON HAND</th><th>RESERVED</th><th>DAMAGED</th><th>IN TRANSIT</th><th>AVAILABLE</th><th>SOURCE</th></tr></thead><tbody>{inventoryRows.map((row, index) => <tr key={`${row.sku}-${row.branch}-${index}`}><td><strong>{row.product}</strong><small>{row.color || "Standard"} {row.size || ""}</small></td><td>{row.sku}</td><td>{row.categoryName}</td><td>{row.branch}</td><td>{row.onHand}</td><td>{row.reserved}</td><td>{row.damaged}</td><td>{row.inTransit}</td><td><strong>{row.available}</strong></td><td><span className={row.isDemo ? "live-status demo" : "live-status active"}>{row.isDemo ? "Illustrative" : "Operational"}</span></td></tr>)}</tbody></table></div> : <Empty title={stockFilter === "low" ? "No operational low-stock variants" : "No matching stock records"} detail={stockFilter === "low" ? "Verified low-stock balances will appear here. Illustrative rows are excluded." : "Create a verified product with an opening stock balance to begin."} />}
      </section>}

      {tab === "orders" && <section className="admin-live-panel"><div className="admin-live-toolbar"><div><span className="eyebrow">ORDERS & PAYMENT REVIEW</span><p>Only an authorised server-side manual review can mark bank or cash payment paid. M-Pesa needs a verified provider callback. Simulated orders are never payable.</p></div></div><SearchBox value={query} onChange={setQuery} label="Search orders" />{orderRows.length ? <div className="admin-live-table-wrap"><table className="admin-live-table"><thead><tr><th>REFERENCE / CUSTOMER</th><th>CHANNEL</th><th>TOTAL</th><th>PAYMENT</th><th>FULFILMENT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{orderRows.map((order) => <tr key={order.id}><td><strong>{order.reference}</strong><small>{order.customerName} · {order.customerPhone}</small>{order.isDemo && <small className="demo-text">Simulated demo record · excluded from analytics</small>}</td><td>{order.isDemo ? "Simulation" : order.channel === "pos" ? "POS" : order.channel === "wholesale" ? "Wholesale" : "Online"}</td><td>{formatKes(order.total)}</td><td><span className={`live-status ${order.paymentStatus === "paid" ? "active" : "pending"}`}>{order.paymentStatus} · {order.paymentMethod}</span></td><td>{order.fulfillment}</td><td><select disabled={order.isDemo} value={order.status} onChange={(event) => { const next = event.target.value as "processing" | "ready" | "shipped" | "delivered" | "cancelled"; if (next === "cancelled" && !window.confirm(`Cancel ${order.reference}? This releases active reservations.`)) return; changeStatus.mutate({ orderId: order.id, status: next }); }} aria-label={`Update ${order.reference} status`}><option value="placed">placed</option><option value="processing">processing</option><option value="ready">ready</option><option value="shipped">shipped</option><option value="delivered">delivered</option><option value="cancelled">cancelled</option></select></td><td>{order.isDemo ? <span className="pending-note">Test only · not payable</span> : order.paymentStatus !== "paid" && order.paymentMethod !== "mpesa" ? <button className="small-action" onClick={() => { setVerifyOrder({ id: order.id, reference: order.reference, method: order.paymentMethod }); setVerifyConfirmed(false); }}>Verify payment</button> : order.paymentStatus !== "paid" ? <span className="pending-note">Provider callback required</span> : <span className="verified-note"><ShieldCheck size={13} /> verified</span>}</td></tr>)}</tbody></table></div> : <Empty title="No orders yet" detail="Guest order requests and clearly labelled simulations appear here after they are saved." />}</section>}

      {tab === "branches" && <section className="admin-live-panel"><span className="eyebrow">CONFIRMED BUSINESS LOCATION</span><h2>Pipeline Stage</h2><p className="admin-live-branch-address">Adjacent to Think Twice, Nairobi, Kenya</p><div className="branch-confirmed-card"><div className="branch-live-mark">P</div><div><strong>Pipeline Stage</strong><span>Confirmed · active collection/fulfilment branch</span></div><span className="live-status active">Active</span></div><p>Additional branches can be provisioned later by the business owner. No unconfirmed location is shown as an existing store.</p></section>}
    </main>

    {showProductForm && <Modal title="Add an operational product" onClose={() => setShowProductForm(false)}><form className="admin-live-form" onSubmit={submitProduct}><div className="form-grid"><label>Product name<input required minLength={2} maxLength={180} value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} /></label><label>Product SKU<input required maxLength={64} value={product.sku} onChange={(event) => setProduct({ ...product, sku: event.target.value.toUpperCase() })} /></label><label>Category<select required value={product.categoryId} onChange={(event) => setProduct({ ...product, categoryId: event.target.value })}><option value="">Choose category</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Retail price (KES)<input required type="number" min="1" step="1" value={product.retailPrice} onChange={(event) => setProduct({ ...product, retailPrice: event.target.value })} /></label><label>Wholesale price (KES) · optional<input type="number" min="1" value={product.wholesalePrice} onChange={(event) => setProduct({ ...product, wholesalePrice: event.target.value })} /></label><label>Previous price (KES) · optional<input type="number" min="1" value={product.compareAtPrice} onChange={(event) => setProduct({ ...product, compareAtPrice: event.target.value })} /></label><label>Material · optional<input maxLength={160} value={product.material} onChange={(event) => setProduct({ ...product, material: event.target.value })} /></label><label>Variant SKU · optional<input maxLength={64} value={product.variantSku} onChange={(event) => setProduct({ ...product, variantSku: event.target.value.toUpperCase() })} /></label><label>Colour · optional<input maxLength={60} value={product.color} onChange={(event) => setProduct({ ...product, color: event.target.value })} /></label><label>Size · optional<input maxLength={60} value={product.size} onChange={(event) => setProduct({ ...product, size: event.target.value })} /></label><label>Opening stock (units)<input required type="number" min="0" step="1" value={product.openingStock} onChange={(event) => setProduct({ ...product, openingStock: event.target.value })} /></label><label>Initial branch<select value={branchId ?? ""} onChange={(event) => setBranchId(Number(event.target.value))}>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label><label className="field-full">Product description<textarea required minLength={8} maxLength={10000} rows={4} value={product.description} onChange={(event) => setProduct({ ...product, description: event.target.value })} /></label></div><p className="modal-disclaimer">This creates a real product record. Confirm the information and opening quantity are correct before saving.</p><button className="button-primary button-dark" disabled={addProduct.isPending}>{addProduct.isPending ? "Saving…" : "Save product to Neon"}<ArrowRight size={15} /></button></form></Modal>}

    {showStockForm && <Modal title="Record a stock adjustment" onClose={() => setShowStockForm(false)}><form className="admin-live-form" onSubmit={submitStock}><label>Product variant<select required value={stockVariantId ?? ""} onChange={(event) => setStockVariantId(Number(event.target.value))}><option value="">Choose a live product</option>{products.data?.filter((item) => !item.isDemo).flatMap((item) => item.variants.map((variant) => <option key={variant.id} value={variant.id}>{item.name} · {variant.sku} · {variant.color || "Standard"}</option>))}</select></label><label>Unit change<input type="number" required step="1" value={stockDelta} onChange={(event) => setStockDelta(event.target.value)} placeholder="e.g. 5 received or -1 counted" /></label><label>Reason<input required minLength={4} maxLength={500} value={stockReason} onChange={(event) => setStockReason(event.target.value)} placeholder="Goods received, cycle count, damage…" /></label><p className="modal-disclaimer">Every adjustment is ledgered and audited. Reserved and damaged units cannot be reduced below the sellable balance. Sample products are excluded.</p><button className="button-primary button-dark" disabled={adjustStock.isPending}>{adjustStock.isPending ? "Saving…" : "Record adjustment"}<ArrowRight size={15} /></button></form></Modal>}

    {verifyOrder && <Modal title="Authorised manual payment review" onClose={() => setVerifyOrder(null)}><div className="payment-review-content"><span className="eyebrow">{verifyOrder.reference} · {verifyOrder.method.toUpperCase()}</span><p>Verify the money independently against the business bank/mobile-money record before continuing. This action marks the order paid, issues a sale receipt record and is saved with your staff ID.</p><label>Provider/bank reference <input maxLength={120} value={verifyReference} onChange={(event) => setVerifyReference(event.target.value)} placeholder="Optional transaction reference" /></label><label className="confirm-check"><input type="checkbox" checked={verifyConfirmed} onChange={(event) => setVerifyConfirmed(event.target.checked)} /> I personally verified receipt of the full amount on the authoritative account statement.</label><button className="button-primary button-dark" disabled={!verifyConfirmed || verifyPayment.isPending} onClick={() => verifyPayment.mutate({ orderId: verifyOrder.id, providerReference: verifyReference || undefined })}>{verifyPayment.isPending ? "Saving review…" : "Confirm verified payment"}<ShieldCheck size={15} /></button></div></Modal>}
  </div>;
}

function Kpi({ title, value, icon, detail }: { title: string; value: string; icon: ReactNode; detail: string }) { return <article className="admin-live-kpi"><span>{icon}</span><small>{title}</small><strong>{value}</strong><p>{detail}</p></article>; }
function SearchBox({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) { return <label className="admin-live-search"><Search size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={label} /></label>; }
function Empty({ title, detail }: { title: string; detail: string }) { return <div className="admin-live-empty"><Package size={22} /><strong>{title}</strong><span>{detail}</span></div>; }
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="admin-live-modal-shade" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="admin-live-modal" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button onClick={onClose} aria-label="Close dialog">×</button></header>{children}</section></div>; }
