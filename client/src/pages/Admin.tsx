import { useMemo, useState } from "react";
import { PB_LOGO_SRC } from "@/lib/brand";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  CreditCard,
  Download,
  ExternalLink,
  FileBarChart,
  Filter,
  Globe2,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import "./admin.css";

type ViewKey =
  | "dashboard"
  | "analytics"
  | "products"
  | "categories"
  | "inventory"
  | "movements"
  | "orders"
  | "customers"
  | "payments"
  | "suppliers"
  | "deliveries"
  | "promotions"
  | "reports"
  | "branches"
  | "staff"
  | "settings";

type NavItem = { id: ViewKey; label: string; icon: LucideIcon };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "analytics", label: "Analytics", icon: Activity },
    ],
  },
  {
    label: "COMMERCE",
    items: [
      { id: "products", label: "Products", icon: Package },
      { id: "categories", label: "Categories & brands", icon: Boxes },
      { id: "inventory", label: "Inventory", icon: Warehouse },
      { id: "movements", label: "Stock movements", icon: ArrowDownRight },
      { id: "orders", label: "Orders & returns", icon: ShoppingBag },
      { id: "customers", label: "Customers & wholesale", icon: Users },
      { id: "payments", label: "Payments & receipts", icon: CreditCard },
      { id: "suppliers", label: "Suppliers & purchases", icon: BriefcaseBusiness },
      { id: "deliveries", label: "Deliveries & collections", icon: Truck },
      { id: "promotions", label: "Promotions & content", icon: Globe2 },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { id: "reports", label: "Reports", icon: FileBarChart },
      { id: "branches", label: "Branches", icon: Warehouse },
      { id: "staff", label: "Staff, roles & audit", icon: ShieldCheck },
      { id: "settings", label: "Settings", icon: Settings2 },
    ],
  },
];

const viewInfo: Record<ViewKey, { eyebrow: string; title: string; description: string; action: string }> = {
  dashboard: { eyebrow: "WEDNESDAY, 18 NOVEMBER 2026", title: "Good morning, Amina", description: "A considered view of today’s operations at Pipeline Stage.", action: "New order" },
  analytics: { eyebrow: "INSIGHTS · DEMO FIXTURES", title: "Analytics", description: "Explore illustrative sales, fulfilment and customer patterns.", action: "Export report" },
  products: { eyebrow: "CATALOGUE · DEMO FIXTURES", title: "Products", description: "Manage the travel pieces in your working catalogue.", action: "Add product" },
  categories: { eyebrow: "CATALOGUE · DEMO FIXTURES", title: "Categories & brands", description: "Keep collections and maker records organised.", action: "Add category" },
  inventory: { eyebrow: "STOCK · DEMO FIXTURES", title: "Inventory", description: "A sample view of stock on hand at Pipeline Stage.", action: "Adjust stock" },
  movements: { eyebrow: "STOCK · DEMO FIXTURES", title: "Stock movements & transfers", description: "Review illustrative receipts, adjustments and branch transfers.", action: "Record movement" },
  orders: { eyebrow: "COMMERCE · DEMO FIXTURES", title: "Orders & returns", description: "Track sample orders from confirmation through handover.", action: "Create order" },
  customers: { eyebrow: "RELATIONSHIPS · DEMO FIXTURES", title: "Customers & wholesale", description: "Manage customer records and review wholesale applications.", action: "Add customer" },
  payments: { eyebrow: "FINANCE · DEMO FIXTURES", title: "Payments & receipts", description: "Reconcile illustrative payments and receipt records.", action: "Record payment" },
  suppliers: { eyebrow: "PROCUREMENT · DEMO FIXTURES", title: "Suppliers & purchases", description: "Keep supplier contacts and purchase orders in view.", action: "New purchase order" },
  deliveries: { eyebrow: "FULFILMENT · DEMO FIXTURES", title: "Deliveries & collections", description: "Coordinate sample dispatches and customer collections.", action: "Schedule delivery" },
  promotions: { eyebrow: "MERCHANDISING · DEMO FIXTURES", title: "Promotions & content", description: "Review planned campaigns and editorial placements.", action: "Create promotion" },
  reports: { eyebrow: "OPERATIONS · DEMO FIXTURES", title: "Reports", description: "A working library of illustrative operational reports.", action: "Build report" },
  branches: { eyebrow: "LOCATIONS · DEMO FIXTURES", title: "Branches", description: "Pipeline Stage is the only confirmed operating branch.", action: "Branch roadmap" },
  staff: { eyebrow: "ACCESS · DEMO FIXTURES", title: "Staff, roles & audit", description: "Review sample team access and administrative activity.", action: "Invite staff" },
  settings: { eyebrow: "WORKSPACE", title: "Settings", description: "Manage workspace preferences and operational defaults.", action: "Save changes" },
};

type Fixture = { ref: string; name: string; detail: string; status: string; value: string; date: string };
const fixtures: Record<Exclude<ViewKey, "dashboard" | "analytics" | "settings">, Fixture[]> = {
  products: [
    { ref: "SKU-1042", name: "Nairobi Weekender", detail: "Weekenders · Soko Atelier", status: "Active", value: "KES 18,500", date: "18 Nov 2026" },
    { ref: "SKU-1038", name: "Safari Carry-on", detail: "Carry-ons · Maji Works", status: "Active", value: "KES 24,000", date: "17 Nov 2026" },
    { ref: "SKU-1029", name: "Coastline Tote", detail: "Totes · Soko Atelier", status: "Low stock", value: "KES 8,900", date: "16 Nov 2026" },
    { ref: "SKU-1021", name: "Highland Duffle", detail: "Duffles · Kifaru Leather", status: "Draft", value: "KES 21,500", date: "15 Nov 2026" },
    { ref: "SKU-1016", name: "Market Day Pouch", detail: "Accessories · Maji Works", status: "Active", value: "KES 4,200", date: "14 Nov 2026" },
  ],
  categories: [
    { ref: "CAT-01", name: "Carry-ons", detail: "12 products · Travel", status: "Published", value: "12 items", date: "12 Nov 2026" },
    { ref: "CAT-02", name: "Weekenders", detail: "8 products · Travel", status: "Published", value: "8 items", date: "11 Nov 2026" },
    { ref: "BR-01", name: "Soko Atelier", detail: "Local maker · Nairobi", status: "Active", value: "14 items", date: "09 Nov 2026" },
    { ref: "BR-02", name: "Maji Works", detail: "Local maker · Mombasa", status: "Active", value: "9 items", date: "05 Nov 2026" },
  ],
  inventory: [
    { ref: "SKU-1029", name: "Coastline Tote · Sand", detail: "Totes · Shelf A2", status: "Low stock", value: "3 units", date: "Reorder at 6" },
    { ref: "SKU-1042", name: "Nairobi Weekender · Olive", detail: "Weekenders · Shelf B1", status: "In stock", value: "18 units", date: "Reorder at 5" },
    { ref: "SKU-1038", name: "Safari Carry-on · Charcoal", detail: "Carry-ons · Shelf C3", status: "In stock", value: "11 units", date: "Reorder at 4" },
    { ref: "SKU-1008", name: "Coastal Pouch · Ochre", detail: "Accessories · Shelf A4", status: "Out of stock", value: "0 units", date: "Reorder at 8" },
  ],
  movements: [
    { ref: "MOV-2081", name: "Receipt · PO-441", detail: "Nairobi Weekender · +12 units", status: "Received", value: "+12", date: "18 Nov 2026" },
    { ref: "MOV-2078", name: "Sale · ORD-2841", detail: "Coastline Tote · −1 unit", status: "Committed", value: "−1", date: "18 Nov 2026" },
    { ref: "MOV-2073", name: "Cycle count · A2", detail: "Market Day Pouch · −2 units", status: "Reviewed", value: "−2", date: "17 Nov 2026" },
    { ref: "MOV-2069", name: "Transfer · TR-031", detail: "Pipeline Stage · to destination pending", status: "In transit", value: "6", date: "16 Nov 2026" },
  ],
  orders: [
    { ref: "ORD-2841", name: "Njeri Wanjiku", detail: "2 items · Nairobi collection", status: "Ready for collection", value: "KES 27,400", date: "Today, 10:42" },
    { ref: "ORD-2839", name: "Otieno & Co.", detail: "Wholesale · 8 items", status: "Awaiting payment", value: "KES 146,000", date: "Today, 09:18" },
    { ref: "ORD-2836", name: "L. Mwangi", detail: "1 item · Courier delivery", status: "Processing", value: "KES 18,500", date: "17 Nov 2026" },
    { ref: "RET-0128", name: "Return request", detail: "Safari Carry-on · ORD-2814", status: "Needs review", value: "KES 24,000", date: "17 Nov 2026" },
  ],
  customers: [
    { ref: "CUS-0842", name: "Njeri Wanjiku", detail: "Retail · Nairobi", status: "Active", value: "KES 52,300", date: "18 Nov 2026" },
    { ref: "CUS-0839", name: "Otieno & Co.", detail: "Wholesale · Application W-028", status: "Pending review", value: "—", date: "17 Nov 2026" },
    { ref: "CUS-0835", name: "L. Mwangi", detail: "Retail · Kiambu", status: "Active", value: "KES 18,500", date: "16 Nov 2026" },
    { ref: "CUS-0827", name: "Coast & Carry Ltd.", detail: "Wholesale · Mombasa", status: "Approved", value: "KES 214,000", date: "14 Nov 2026" },
  ],
  payments: [
    { ref: "PAY-5184", name: "M-Pesa · ORD-2841", detail: "Till settlement ·•• 4091", status: "Settled", value: "KES 27,400", date: "Today, 10:43" },
    { ref: "PAY-5181", name: "Bank transfer · ORD-2839", detail: "Reference OT-1138", status: "Pending", value: "KES 146,000", date: "Today, 09:22" },
    { ref: "PAY-5174", name: "Card · ORD-2836", detail: "Visa ·•• 2910", status: "Settled", value: "KES 18,500", date: "17 Nov 2026" },
    { ref: "RCT-5098", name: "Receipt · ORD-2814", detail: "PDF receipt issued", status: "Issued", value: "KES 24,000", date: "16 Nov 2026" },
  ],
  suppliers: [
    { ref: "SUP-014", name: "Soko Atelier", detail: "Leather goods · Nairobi", status: "Active", value: "4 open POs", date: "Updated 12 Nov" },
    { ref: "SUP-011", name: "Maji Works", detail: "Textiles · Mombasa", status: "Active", value: "2 open POs", date: "Updated 10 Nov" },
    { ref: "PO-441", name: "Purchase order · Soko Atelier", detail: "12 Weekenders · ETA 21 Nov", status: "In transit", value: "KES 98,000", date: "18 Nov 2026" },
    { ref: "PO-437", name: "Purchase order · Kifaru Leather", detail: "6 Duffles · awaiting confirmation", status: "Draft", value: "KES 75,600", date: "16 Nov 2026" },
  ],
  deliveries: [
    { ref: "DLV-681", name: "Njeri Wanjiku", detail: "Collection · Pipeline Stage", status: "Ready for collection", value: "ORD-2841", date: "Today, 10:42" },
    { ref: "DLV-679", name: "L. Mwangi", detail: "Courier · Nairobi, Westlands", status: "Dispatch queued", value: "ORD-2836", date: "Today, 09:18" },
    { ref: "DLV-676", name: "Coast & Carry Ltd.", detail: "Courier · Mombasa", status: "In transit", value: "ORD-2828", date: "17 Nov 2026" },
    { ref: "DLV-670", name: "A. Kamau", detail: "Collection · Pipeline Stage", status: "Collected", value: "ORD-2819", date: "16 Nov 2026" },
  ],
  promotions: [
    { ref: "CAM-008", name: "Made for the miles", detail: "Editorial feature · Home", status: "Scheduled", value: "18–30 Nov", date: "18 Nov 2026" },
    { ref: "CAM-007", name: "The weekend edit", detail: "Collection · Weekenders", status: "Active", value: "No discount", date: "12–24 Nov" },
    { ref: "CAM-006", name: "Carry well, travel light", detail: "Journal · Story draft", status: "Draft", value: "—", date: "Updated 10 Nov" },
  ],
  reports: [
    { ref: "RPT-021", name: "Daily sales summary", detail: "Sales · Pipeline Stage", status: "Ready", value: "CSV · 18 KB", date: "Today, 08:00" },
    { ref: "RPT-020", name: "Stock valuation", detail: "Inventory · All products", status: "Ready", value: "CSV · 12 KB", date: "17 Nov 2026" },
    { ref: "RPT-019", name: "Order fulfilment", detail: "Operations · Weekly", status: "Ready", value: "PDF · 284 KB", date: "16 Nov 2026" },
  ],
  branches: [
    { ref: "BR-001", name: "Pipeline Stage", detail: "Nairobi · Confirmed operating branch", status: "Active", value: "KES", date: "Current" },
    { ref: "BR-002", name: "Westlands", detail: "Nairobi · Future branch", status: "Planned · not added", value: "—", date: "Not operational" },
    { ref: "BR-003", name: "Mombasa", detail: "Coast · Future branch", status: "Planned · not added", value: "—", date: "Not operational" },
  ],
  staff: [
    { ref: "STF-001", name: "Amina N.", detail: "Workspace owner · Pipeline Stage", status: "Active", value: "Owner", date: "Signed in today" },
    { ref: "STF-002", name: "David K.", detail: "Operations · Pipeline Stage", status: "Active", value: "Manager", date: "17 Nov 2026" },
    { ref: "STF-003", name: "Mercy W.", detail: "Stock control · Pipeline Stage", status: "Active", value: "Inventory", date: "17 Nov 2026" },
    { ref: "AUD-118", name: "Stock adjustment recorded", detail: "Mercy W. · SKU-1029", status: "Audit event", value: "−1 unit", date: "Today, 09:42" },
  ],
};

const filtersByView: Partial<Record<ViewKey, string[]>> = {
  products: ["All products", "Active", "Low stock", "Draft"],
  categories: ["All records", "Published", "Active"],
  inventory: ["All stock", "Low stock", "Out of stock", "In stock"],
  movements: ["All movements", "Received", "Committed", "In transit"],
  orders: ["All orders", "Processing", "Awaiting payment", "Ready for collection", "Needs review"],
  customers: ["All customers", "Active", "Pending review", "Approved"],
  payments: ["All records", "Settled", "Pending", "Issued"],
  suppliers: ["All records", "Active", "In transit", "Draft"],
  deliveries: ["All deliveries", "Dispatch queued", "In transit", "Ready for collection", "Collected"],
  promotions: ["All content", "Active", "Scheduled", "Draft"],
  reports: ["All reports", "Ready", "Processing"],
  branches: ["All locations", "Active", "Planned · not added"],
  staff: ["All activity", "Active", "Audit event"],
};

const statusClass = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("active") || s.includes("settled") || s.includes("received") || s.includes("collected") || s.includes("approved") || s.includes("ready") || s.includes("published")) return "is-good";
  if (s.includes("low") || s.includes("pending") || s.includes("transit") || s.includes("scheduled") || s.includes("review") || s.includes("queued")) return "is-warn";
  if (s.includes("out of stock") || s.includes("draft") || s.includes("planned") || s.includes("cancel") || s.includes("issued")) return "is-muted";
  return "is-neutral";
};

const formatTitle = (view: ViewKey) => viewInfo[view].title;

export default function Admin() {
  const [view, setView] = useState<ViewKey>("dashboard");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [range, setRange] = useState("Last 30 days");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [chartMode, setChartMode] = useState("Revenue");

  const info = viewInfo[view];
  const records = view !== "dashboard" && view !== "analytics" && view !== "settings" ? fixtures[view] : [];
  const filters = filtersByView[view] || [];
  const visibleRecords = useMemo(() => records.filter((row) => {
    const matchesSearch = `${row.ref} ${row.name} ${row.detail} ${row.status}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !activeFilter || activeFilter.startsWith("All ") || row.status.toLowerCase().includes(activeFilter.replace(" · not added", "").toLowerCase().replace("all ", ""));
    return matchesSearch && matchesFilter;
  }), [records, search, activeFilter]);

  const changeView = (id: ViewKey) => {
    setView(id);
    setSearch("");
    setActiveFilter("");
    setMobileNavOpen(false);
    setNotice("");
  };
  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3600);
  };

  return (
    <div className="pb-admin-shell">
      {mobileNavOpen && <button className="pb-admin-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`pb-admin-sidebar ${mobileNavOpen ? "is-open" : ""}`} aria-label="Admin navigation">
        <div className="pb-admin-brand">
          <img className="pb-admin-brand-mark" src={PB_LOGO_SRC} alt="" />
          <div className="pb-admin-brand-copy"><strong>PRINCE BENJA DESIGNS</strong><span>OPERATIONS SUITE</span></div>
          <button className="pb-admin-icon-btn pb-admin-close-nav" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="pb-admin-workspace"><div className="pb-admin-workspace-icon">P</div><div><b>Pipeline Stage</b><span>Kenya · KES</span></div><ChevronDown size={15} /></div>
        <nav className="pb-admin-nav">
          {navGroups.map((group) => <div className="pb-admin-nav-group" key={group.label}>
            <p className="pb-admin-nav-label">{group.label}</p>
            {group.items.map(({ id, label, icon: Icon }) => <button key={id} className={`pb-admin-nav-item ${view === id ? "is-active" : ""}`} onClick={() => changeView(id)} aria-current={view === id ? "page" : undefined}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{id === "orders" && <i className="pb-admin-nav-count">5</i>}
            </button>)}
          </div>)}
        </nav>
        <div className="pb-admin-side-bottom">
          <div className="pb-admin-branch-note"><span className="pb-admin-live-dot" /><div><b>One confirmed branch</b><span>More locations are planned</span></div></div>
          <button className="pb-admin-nav-item pb-admin-help" onClick={() => announce("Support details are available from the workspace owner.")}><CircleHelp size={17} /><span>Help &amp; support</span><ExternalLink size={13} /></button>
          <div className="pb-admin-user"><div className="pb-admin-avatar">AN</div><div className="pb-admin-user-copy"><b>Amina N.</b><span>Workspace owner</span></div><button className="pb-admin-icon-btn" aria-label="Account options" onClick={() => announce("Account menu is part of the connected workspace experience.")}><MoreHorizontal size={19} /></button></div>
        </div>
      </aside>

      <main className="pb-admin-main">
        <header className="pb-admin-topbar">
          <div className="pb-admin-topbar-left"><button className="pb-admin-icon-btn pb-admin-menu-toggle" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button><div className="pb-admin-breadcrumb"><span>Workspace</span><ChevronRight size={14} /><b>{formatTitle(view)}</b></div></div>
          <div className="pb-admin-topbar-actions">
            <span className="pb-admin-demo-pill"><i /> DEMO DATA</span>
            <button className="pb-admin-icon-btn pb-admin-notification" aria-label="Notifications" onClick={() => setMenuOpen((open) => !open)}><Bell size={18} /><i /></button>
            <button className="pb-admin-top-avatar" aria-label="Open profile menu" onClick={() => announce("Signed in as Amina N. · Workspace owner")}>AN</button>
          </div>
          {menuOpen && <div className="pb-admin-notice-menu"><div className="pb-admin-menu-title"><span>Notifications</span><button aria-label="Close notifications" onClick={() => setMenuOpen(false)}><X size={15} /></button></div><div className="pb-admin-notice-row"><span className="pb-admin-notice-icon"><Package size={15} /></span><div><b>3 items are below reorder level</b><span>Inventory · sample fixture</span></div><small>9:42</small></div><div className="pb-admin-notice-row"><span className="pb-admin-notice-icon"><ClipboardList size={15} /></span><div><b>Wholesale application to review</b><span>Customers · sample fixture</span></div><small>Yesterday</small></div><p>Notifications shown are illustrative demo content.</p></div>}
        </header>

        <div className="pb-admin-content">
          <div className="pb-admin-page-heading">
            <div><p className="pb-admin-eyebrow">{info.eyebrow}</p><h1>{info.title}</h1><p className="pb-admin-page-description">{info.description}</p></div>
            <div className="pb-admin-heading-actions">
              {view !== "dashboard" && view !== "settings" && <button className="pb-admin-button pb-admin-button-secondary" onClick={() => announce("Filters are ready to use with this demo fixture set.")}><Filter size={15} /> Filters</button>}
              <button className="pb-admin-button pb-admin-button-primary" onClick={() => announce(view === "branches" ? "Additional branches are planned and have not been added." : `${info.action} is a demo-only action; no records have been changed.`)}>{view === "reports" || view === "analytics" ? <Download size={15} /> : <Plus size={16} />}{info.action}</button>
            </div>
          </div>

          {notice && <div className="pb-admin-toast" role="status"><Check size={16} /><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice("")}><X size={15} /></button></div>}

          <div className="pb-admin-toolbar">
            <label className="pb-admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={view === "dashboard" ? "Search orders, products…" : `Search ${info.title.toLowerCase()}…`} aria-label={`Search ${info.title}`} /><kbd>⌘ K</kbd></label>
            <div className="pb-admin-toolbar-right">
              <div className="pb-admin-branch-select"><span className="pb-admin-branch-dot" /><select aria-label="Select branch" defaultValue="Pipeline Stage" onChange={() => announce("Only Pipeline Stage is confirmed; future branches are planned, not added.")}><option>Pipeline Stage</option><option disabled>Westlands — planned, not added</option><option disabled>Mombasa — planned, not added</option></select><ChevronDown size={14} /></div>
              <label className="pb-admin-date-select"><CalendarDays size={15} /><select aria-label="Select date range" value={range} onChange={(event) => setRange(event.target.value)}><option>Last 30 days</option><option>This month</option><option>Last 7 days</option><option>Year to date</option></select><ChevronDown size={14} /></label>
            </div>
          </div>

          {view === "dashboard" && <Dashboard search={search} range={range} chartMode={chartMode} setChartMode={setChartMode} onAction={announce} />}
          {view === "analytics" && <Analytics range={range} chartMode={chartMode} setChartMode={setChartMode} />}
          {view === "settings" && <SettingsView onAction={announce} />}
          {records.length > 0 && <WorkspaceTable view={view} records={visibleRecords} filters={filters} activeFilter={activeFilter} onFilter={setActiveFilter} onAction={announce} />}
        </div>
        <footer className="pb-admin-footer"><span>PRINCE BENJA DESIGNS · Operations workspace</span><span><i /> Illustrative demo fixtures · not live business data</span></footer>
      </main>
    </div>
  );
}

function Dashboard({ search, range, chartMode, setChartMode, onAction }: { search: string; range: string; chartMode: string; setChartMode: (mode: string) => void; onAction: (message: string) => void }) {
  return <>
    <div className="pb-admin-demo-banner"><span className="pb-admin-demo-banner-icon"><Activity size={17} /></span><div><b>Demo workspace · figures are illustrative, not live</b><span>Pipeline Stage is the only confirmed operating branch. Future locations are planned, not added.</span></div><button onClick={() => onAction("All figures in this screen are static sample fixtures; no live store data is connected.")}>About demo data <ArrowRight size={15} /></button></div>
    <section className="pb-admin-kpi-grid" aria-label="Illustrative key performance indicators">
      <Kpi label="Gross sales" value="KES 842,600" delta="12.8%" trend="up" note="vs. previous 30 days" icon={ArrowUpRight} />
      <Kpi label="Orders received" value="186" delta="8.4%" trend="up" note="vs. previous 30 days" icon={ShoppingBag} />
      <Kpi label="Average order value" value="KES 4,530" delta="2.1%" trend="down" note="vs. previous 30 days" icon={CreditCard} />
      <Kpi label="Items to replenish" value="07" delta="3 urgent" trend="alert" note="sample low-stock count" icon={Package} />
    </section>
    <div className="pb-admin-dashboard-grid">
      <section className="pb-admin-card pb-admin-sales-card">
        <div className="pb-admin-card-heading"><div><div className="pb-admin-section-kicker">PERFORMANCE SNAPSHOT</div><h2>Sales overview</h2></div><div className="pb-admin-chart-tabs" role="tablist" aria-label="Sales chart metric">{["Revenue", "Orders"].map((item) => <button key={item} role="tab" aria-selected={chartMode === item} className={chartMode === item ? "is-selected" : ""} onClick={() => setChartMode(item)}>{item}</button>)}</div></div>
        <div className="pb-admin-sales-summary"><strong>{chartMode === "Revenue" ? "KES 842,600" : "186 orders"}</strong><span className="pb-admin-growth"><ArrowUpRight size={14} /> 12.8%</span><span className="pb-admin-summary-period">over {range.toLowerCase()}</span></div>
        <div className="pb-admin-chart-wrap"><div className="pb-admin-chart-y"><span>250k</span><span>200k</span><span>150k</span><span>100k</span><span>50k</span><span>0</span></div><div className="pb-admin-line-chart"><div className="pb-admin-gridline g1" /><div className="pb-admin-gridline g2" /><div className="pb-admin-gridline g3" /><div className="pb-admin-gridline g4" /><div className="pb-admin-gridline g5" /><svg viewBox="0 0 720 208" preserveAspectRatio="none" role="img" aria-label={`${chartMode} trend for illustrative demo data`}><defs><linearGradient id="pbAdminFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#b89154" stopOpacity=".22" /><stop offset="100%" stopColor="#b89154" stopOpacity="0" /></linearGradient></defs><path className="pb-admin-chart-area" d="M0 165 C25 157 35 169 58 150 S95 145 120 153 S160 126 180 138 S220 119 240 133 S275 101 300 119 S340 112 360 121 S390 85 420 100 S455 82 480 94 S520 71 540 89 S575 66 600 78 S630 49 660 61 S690 36 720 44 L720 208 L0 208Z" /><path className="pb-admin-chart-line" d="M0 165 C25 157 35 169 58 150 S95 145 120 153 S160 126 180 138 S220 119 240 133 S275 101 300 119 S340 112 360 121 S390 85 420 100 S455 82 480 94 S520 71 540 89 S575 66 600 78 S630 49 660 61 S690 36 720 44" /><circle cx="420" cy="100" r="4" /><circle cx="600" cy="78" r="4" /><circle cx="720" cy="44" r="4" /></svg><div className="pb-admin-chart-x"><span>20 Oct</span><span>25 Oct</span><span>30 Oct</span><span>04 Nov</span><span>09 Nov</span><span>14 Nov</span><span>18 Nov</span></div></div></div>
        <p className="pb-admin-chart-caption"><i /> Daily {chartMode.toLowerCase()} · indicative demo series, KES where applicable</p>
      </section>
      <section className="pb-admin-card pb-admin-mix-card"><div className="pb-admin-card-heading"><div><div className="pb-admin-section-kicker">REVENUE COMPOSITION</div><h2>Sales mix</h2></div><button className="pb-admin-icon-btn" aria-label="Sales mix options" onClick={() => onAction("Sales mix is illustrative demo data.")}><MoreHorizontal size={18} /></button></div><div className="pb-admin-donut-row"><div className="pb-admin-donut" role="img" aria-label="Illustrative sales mix: carry-ons 38%, weekender bags 27%, totes 21%, accessories 14%"><div><strong>842.6k</strong><span>KES · demo</span></div></div><div className="pb-admin-mix-legend"><MixLegend color="gold" label="Carry-ons" value="38%" /><MixLegend color="olive" label="Weekenders" value="27%" /><MixLegend color="clay" label="Totes" value="21%" /><MixLegend color="stone" label="Accessories" value="14%" /></div></div><div className="pb-admin-mix-foot"><span>Top category</span><b>Carry-ons <ArrowUpRight size={14} /></b></div></section>
    </div>
    <div className="pb-admin-dashboard-grid pb-admin-lower-grid">
      <section className="pb-admin-card pb-admin-pipeline-card"><div className="pb-admin-card-heading"><div><div className="pb-admin-section-kicker">FULFILMENT · DEMO COUNTS</div><h2>Order pipeline</h2></div><button className="pb-admin-text-link" onClick={() => onAction("Open Orders & returns from the left navigation to view sample order records.")}>View orders <ArrowRight size={14} /></button></div><div className="pb-admin-pipeline-stages"><PipelineStage label="To confirm" count="12" width="30%" tone="sand" /><PipelineStage label="Processing" count="24" width="53%" tone="gold" /><PipelineStage label="Ready" count="08" width="24%" tone="olive" /><PipelineStage label="In transit" count="17" width="40%" tone="charcoal" /></div><div className="pb-admin-pipeline-note"><Clock3 size={14} /><span>Illustrative counts · not connected to an order system</span></div></section>
      <section className="pb-admin-card pb-admin-activity-card"><div className="pb-admin-card-heading"><div><div className="pb-admin-section-kicker">WORKSPACE LOG</div><h2>Recent activity</h2></div><button className="pb-admin-icon-btn" aria-label="More activity options" onClick={() => onAction("Activity entries shown are illustrative fixtures.")}><MoreHorizontal size={18} /></button></div><div className="pb-admin-activity-list"><ActivityRow icon={ShoppingBag} title="Order ORD-2841 marked ready" meta="Amina N. · Pipeline Stage" time="10:42" /><ActivityRow icon={Package} title="Stock count updated · Coastline Tote" meta="Mercy W. · 1 unit adjusted" time="09:42" /><ActivityRow icon={Users} title="Wholesale application received" meta="Otieno & Co. · Sample fixture" time="Yesterday" /></div></section>
    </div>
    <section className="pb-admin-card pb-admin-lowstock-card"><div className="pb-admin-card-heading"><div><div className="pb-admin-section-kicker">INVENTORY WATCH · SAMPLE FIXTURES</div><h2>Needs attention</h2></div><button className="pb-admin-text-link" onClick={() => onAction("Choose Inventory in the navigation to review the full demo stock list.")}>View inventory <ArrowRight size={14} /></button></div><div className="pb-admin-table-scroll"><table className="pb-admin-table"><thead><tr><th>PRODUCT</th><th>SKU</th><th>STOCK ON HAND</th><th>REORDER POINT</th><th>STATUS</th><th><span className="pb-admin-sr-only">Actions</span></th></tr></thead><tbody><tr><td><div className="pb-admin-product-cell"><span className="pb-admin-product-swatch swatch-sand">CT</span><div><b>Coastline Tote · Sand</b><small>Totes · Soko Atelier</small></div></div></td><td>SKU-1029</td><td><b>3 units</b></td><td>6 units</td><td><StatusChip status="Low stock" /></td><td><button className="pb-admin-row-action" aria-label="Open Coastline Tote options" onClick={() => onAction("Coastline Tote is a sample low-stock fixture.")}><MoreHorizontal size={17} /></button></td></tr><tr><td><div className="pb-admin-product-cell"><span className="pb-admin-product-swatch swatch-olive">CP</span><div><b>Coastal Pouch · Ochre</b><small>Accessories · Maji Works</small></div></div></td><td>SKU-1008</td><td><b>0 units</b></td><td>8 units</td><td><StatusChip status="Out of stock" /></td><td><button className="pb-admin-row-action" aria-label="Open Coastal Pouch options" onClick={() => onAction("Coastal Pouch is a sample out-of-stock fixture.")}><MoreHorizontal size={17} /></button></td></tr><tr><td><div className="pb-admin-product-cell"><span className="pb-admin-product-swatch swatch-clay">MD</span><div><b>Market Day Pouch · Clay</b><small>Accessories · Maji Works</small></div></div></td><td>SKU-1016</td><td><b>4 units</b></td><td>6 units</td><td><StatusChip status="Low stock" /></td><td><button className="pb-admin-row-action" aria-label="Open Market Day Pouch options" onClick={() => onAction("Market Day Pouch is a sample low-stock fixture.")}><MoreHorizontal size={17} /></button></td></tr></tbody></table></div><div className="pb-admin-card-foot"><span>Sample data · figures are not live stock positions</span><button onClick={() => onAction("Replenishment planning is demo-only; no purchase order was created.")}>Plan replenishment <ArrowRight size={14} /></button></div></section>
    {search && <p className="pb-admin-search-note">Search is available in operational lists. Dashboard cards remain illustrative summaries.</p>}
  </>;
}

function Kpi({ label, value, delta, trend, note, icon: Icon }: { label: string; value: string; delta: string; trend: string; note: string; icon: LucideIcon }) {
  return <article className="pb-admin-card pb-admin-kpi"><div className="pb-admin-kpi-top"><span>{label}</span><span className={`pb-admin-kpi-icon ${trend === "alert" ? "is-alert" : ""}`}><Icon size={16} /></span></div><strong className="pb-admin-kpi-value">{value}</strong><div className="pb-admin-kpi-bottom"><span className={`pb-admin-kpi-delta ${trend === "down" ? "is-down" : trend === "alert" ? "is-alert" : ""}`}>{trend === "down" ? <ArrowDownRight size={13} /> : trend === "alert" ? <span className="pb-admin-kpi-alert-dot" /> : <ArrowUpRight size={13} />}{delta}</span><span>{note}</span></div></article>;
}
function MixLegend({ color, label, value }: { color: string; label: string; value: string }) { return <div className="pb-admin-mix-legend-row"><i className={`pb-admin-legend-dot ${color}`} /><span>{label}</span><b>{value}</b></div>; }
function PipelineStage({ label, count, width, tone }: { label: string; count: string; width: string; tone: string }) { return <div className="pb-admin-pipeline-stage"><div><span>{label}</span><b>{count}</b></div><div className="pb-admin-stage-track"><i className={tone} style={{ width }} /></div></div>; }
function ActivityRow({ icon: Icon, title, meta, time }: { icon: LucideIcon; title: string; meta: string; time: string }) { return <div className="pb-admin-activity-row"><span className="pb-admin-activity-icon"><Icon size={15} /></span><div><b>{title}</b><span>{meta}</span></div><time>{time}</time></div>; }
function StatusChip({ status }: { status: string }) { return <span className={`pb-admin-status ${statusClass(status)}`}><i />{status}</span>; }

function WorkspaceTable({ view, records, filters, activeFilter, onFilter, onAction }: { view: ViewKey; records: Fixture[]; filters: string[]; activeFilter: string; onFilter: (filter: string) => void; onAction: (message: string) => void }) {
  const isInventory = view === "inventory";
  const hasValue = view !== "staff";
  return <section className="pb-admin-card pb-admin-workspace-table-card">
    <div className="pb-admin-list-header"><div><div className="pb-admin-section-kicker">{viewInfo[view].eyebrow.split(" · ")[0]} · DEMO FIXTURES</div><h2>{view === "movements" ? "Movement register" : view === "categories" ? "Catalogue records" : view === "staff" ? "Team & audit log" : `${viewInfo[view].title} list`}</h2><p>Illustrative records only · no live business data</p></div><button className="pb-admin-icon-btn pb-admin-list-more" aria-label="More list options" onClick={() => onAction("List options are demo-only.")}><MoreHorizontal size={19} /></button></div>
    <div className="pb-admin-list-controls"><div className="pb-admin-tabs" role="tablist" aria-label="Filter records">{filters.map((filter) => <button key={filter} role="tab" aria-selected={(activeFilter || filters[0]) === filter} className={(activeFilter || filters[0]) === filter ? "is-selected" : ""} onClick={() => onFilter(filter === filters[0] ? "" : filter)}>{filter}</button>)}</div><button className="pb-admin-button pb-admin-button-filter" onClick={() => onAction("Showing records for Pipeline Stage. Future branches are planned, not added.")}><Filter size={14} /> Branch: Pipeline Stage <ChevronDown size={13} /></button></div>
    <div className="pb-admin-table-scroll"><table className="pb-admin-table pb-admin-record-table"><thead><tr><th>REFERENCE</th><th>{view === "customers" ? "CUSTOMER" : view === "suppliers" ? "SUPPLIER / ORDER" : view === "movements" ? "MOVEMENT" : view === "branches" ? "LOCATION" : "NAME"}</th><th>DETAILS</th><th>STATUS</th>{hasValue && <th>{isInventory ? "ON HAND" : view === "reports" ? "FILE" : "VALUE"}</th>}<th>UPDATED</th><th><span className="pb-admin-sr-only">Actions</span></th></tr></thead><tbody>{records.map((row) => <tr key={row.ref}><td><span className="pb-admin-ref">{row.ref}</span></td><td><b className="pb-admin-table-name">{row.name}</b></td><td><span className="pb-admin-table-detail">{row.detail}</span></td><td><StatusChip status={row.status} /></td>{hasValue && <td className="pb-admin-value-cell">{row.value}</td>}<td className="pb-admin-date-cell">{row.date}</td><td><button className="pb-admin-row-action" aria-label={`More options for ${row.ref}`} onClick={() => onAction(`${row.ref} is an illustrative demo record.`)}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table>{records.length === 0 && <div className="pb-admin-empty"><Search size={19} /><b>No matching demo records</b><span>Try a different search or filter.</span></div>}</div>
    <div className="pb-admin-table-pagination"><span>Showing <b>{records.length ? `1–${records.length}` : "0"}</b> of <b>{records.length}</b> sample records</span><div><button aria-label="Previous page" disabled><ChevronLeft size={16} /></button><button className="is-current">1</button><button aria-label="Next page" disabled><ChevronRight size={16} /></button></div></div>
  </section>;
}

function Analytics({ range, chartMode, setChartMode }: { range: string; chartMode: string; setChartMode: (mode: string) => void }) {
  return <div className="pb-admin-analytics-view"><div className="pb-admin-demo-banner"><span className="pb-admin-demo-banner-icon"><FileBarChart size={17} /></span><div><b>Illustrative analytics only</b><span>All values and patterns are sample fixtures and do not reflect live sales or customer behaviour.</span></div></div><div className="pb-admin-kpi-grid"><Kpi label="Gross sales" value="KES 842,600" delta="12.8%" trend="up" note="illustrative period change" icon={ArrowUpRight} /><Kpi label="Units sold" value="294" delta="6.2%" trend="up" note="sample count" icon={Package} /><Kpi label="Returning customers" value="31%" delta="1.6%" trend="up" note="illustrative mix" icon={Users} /><Kpi label="Order fulfilment" value="2.4 days" delta="0.3d" trend="down" note="sample elapsed time" icon={Truck} /></div><section className="pb-admin-card pb-admin-sales-card pb-admin-analytics-chart"><div className="pb-admin-card-heading"><div><div className="pb-admin-section-kicker">DEMO SERIES · {range.toUpperCase()}</div><h2>Sales trend</h2></div><div className="pb-admin-chart-tabs" role="tablist" aria-label="Analytics chart metric">{["Revenue", "Orders"].map((item) => <button key={item} role="tab" aria-selected={chartMode === item} className={chartMode === item ? "is-selected" : ""} onClick={() => setChartMode(item)}>{item}</button>)}</div></div><div className="pb-admin-sales-summary"><strong>{chartMode === "Revenue" ? "KES 842,600" : "186 orders"}</strong><span className="pb-admin-growth"><ArrowUpRight size={14} /> 12.8%</span><span className="pb-admin-summary-period">illustrative demo total</span></div><div className="pb-admin-chart-wrap"><div className="pb-admin-chart-y"><span>250k</span><span>200k</span><span>150k</span><span>100k</span><span>50k</span><span>0</span></div><div className="pb-admin-line-chart"><div className="pb-admin-gridline g1" /><div className="pb-admin-gridline g2" /><div className="pb-admin-gridline g3" /><div className="pb-admin-gridline g4" /><div className="pb-admin-gridline g5" /><svg viewBox="0 0 720 208" preserveAspectRatio="none" role="img" aria-label="Illustrative sales trend"><defs><linearGradient id="pbAnalyticsFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#b89154" stopOpacity=".22" /><stop offset="100%" stopColor="#b89154" stopOpacity="0" /></linearGradient></defs><path className="pb-admin-chart-area" d="M0 165 C25 157 35 169 58 150 S95 145 120 153 S160 126 180 138 S220 119 240 133 S275 101 300 119 S340 112 360 121 S390 85 420 100 S455 82 480 94 S520 71 540 89 S575 66 600 78 S630 49 660 61 S690 36 720 44 L720 208 L0 208Z" /><path className="pb-admin-chart-line" d="M0 165 C25 157 35 169 58 150 S95 145 120 153 S160 126 180 138 S220 119 240 133 S275 101 300 119 S340 112 360 121 S390 85 420 100 S455 82 480 94 S520 71 540 89 S575 66 600 78 S630 49 660 61 S690 36 720 44" /></svg><div className="pb-admin-chart-x"><span>20 Oct</span><span>25 Oct</span><span>30 Oct</span><span>04 Nov</span><span>09 Nov</span><span>14 Nov</span><span>18 Nov</span></div></div></div><p className="pb-admin-chart-caption"><i /> Indicative demo series · not connected to business data</p></section><div className="pb-admin-dashboard-grid pb-admin-lower-grid"><section className="pb-admin-card pb-admin-analytics-insight"><div className="pb-admin-section-kicker">CATEGORY SHARE · DEMO</div><h2>Sales mix</h2><div className="pb-admin-analytics-bars"><div><span>Carry-ons</span><i><b style={{ width: "38%" }} /></i><strong>38%</strong></div><div><span>Weekenders</span><i><b style={{ width: "27%" }} /></i><strong>27%</strong></div><div><span>Totes</span><i><b style={{ width: "21%" }} /></i><strong>21%</strong></div><div><span>Accessories</span><i><b style={{ width: "14%" }} /></i><strong>14%</strong></div></div></section><section className="pb-admin-card pb-admin-analytics-insight"><div className="pb-admin-section-kicker">FULFILMENT · DEMO</div><h2>Operations snapshot</h2><div className="pb-admin-insight-list"><p><span>Average dispatch time</span><b>1.2 days</b></p><p><span>Ready for collection</span><b>8 sample orders</b></p><p><span>Awaiting payment</span><b>12 sample orders</b></p></div></section></div></div>;
}

function SettingsView({ onAction }: { onAction: (message: string) => void }) {
  return <div className="pb-admin-settings-grid"><section className="pb-admin-card pb-admin-settings-card"><div className="pb-admin-section-kicker">WORKSPACE PROFILE</div><h2>Business details</h2><p>Core details used across this sample operations workspace.</p><label>Workspace name<input defaultValue="pili & baadaye" aria-label="Workspace name" /></label><label>Primary operating branch<input defaultValue="Pipeline Stage · Nairobi" aria-label="Primary operating branch" /></label><label>Currency<select defaultValue="KES" aria-label="Currency"><option>KES · Kenyan Shilling</option><option>USD · US Dollar</option></select></label><button className="pb-admin-button pb-admin-button-primary" onClick={() => onAction("Settings are a demo preview; changes are not persisted.")}>Save changes</button></section><section className="pb-admin-card pb-admin-settings-card"><div className="pb-admin-section-kicker">OPERATING NOTES</div><h2>Workspace status</h2><div className="pb-admin-setting-note"><span className="pb-admin-branch-dot" /><div><b>Pipeline Stage</b><span>Confirmed operating branch</span></div><StatusChip status="Active" /></div><div className="pb-admin-setting-note"><span className="pb-admin-planned-dot" /><div><b>Future locations</b><span>Westlands and Mombasa are planned, not added.</span></div><StatusChip status="Planned · not added" /></div><div className="pb-admin-setting-note"><span className="pb-admin-neutral-dot" /><div><b>Demo data mode</b><span>All visible records are illustrative fixtures.</span></div><StatusChip status="Demo" /></div><button className="pb-admin-settings-link" onClick={() => onAction("Access management is available in Staff, roles & audit.")}>Manage staff access <ArrowRight size={14} /></button></section><section className="pb-admin-card pb-admin-settings-card pb-admin-settings-wide"><div className="pb-admin-section-kicker">PREFERENCES</div><h2>Regional defaults</h2><div className="pb-admin-preference-row"><div><b>Display language</b><span>Language for labels and notifications</span></div><select defaultValue="English" aria-label="Display language"><option>English</option><option>Kiswahili</option></select></div><div className="pb-admin-preference-row"><div><b>Time zone</b><span>Used for activity and order timestamps</span></div><select defaultValue="East Africa Time (EAT)" aria-label="Time zone"><option>East Africa Time (EAT)</option><option>UTC</option></select></div><div className="pb-admin-preference-row"><div><b>Low-stock threshold</b><span>Sample default for inventory alerts</span></div><select defaultValue="Per product" aria-label="Low-stock threshold"><option>Per product</option><option>Fixed quantity</option></select></div></section></div>;
}
