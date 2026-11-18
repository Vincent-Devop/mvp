import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Banknote, CheckCircle2, CircleAlert, Clock3, Minus, Plus, Printer, RefreshCw, Search, ShieldCheck, ShoppingBag, Store, Trash2, Wallet, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatKes, setPageMeta } from "@/lib/format";
import { PB_LOGO_SRC } from "@/lib/brand";
import "./POSLive.css";

type SaleLine = { variantId: number; productId: number; name: string; sku: string; price: number; photo: string | null; color: string | null; quantity: number; available: number };
const TERMINAL_ID = "TERMINAL-01";

export default function POSLive() {
  const [branchId, setBranchId] = useState<number>();
  const [openFloat, setOpenFloat] = useState("");
  const [filter, setFilter] = useState("");
  const [chosenVariant, setChosenVariant] = useState<Record<number, number>>({});
  const [cart, setCart] = useState<SaleLine[]>([]);
  const [cashReceived, setCashReceived] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementKind, setMovementKind] = useState<"cash_in" | "cash_out" | "cash_refund">("cash_in");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [countedCash, setCountedCash] = useState("");
  const [saleResult, setSaleResult] = useState<{ reference: string; receiptNumber: string; total: number; cashReceived: number; change: number } | null>(null);
  const utils = trpc.useUtils();
  const branches = trpc.catalog.branches.useQuery(undefined, { retry: false });
  useEffect(() => { if (!branchId && branches.data?.length) setBranchId(branches.data[0].id); }, [branchId, branches.data]);
  useEffect(() => setPageMeta("Point of Sale | PRINCE BENJA DESIGNS", "Protected branch point of sale with Neon stock checks and auditable cash reconciliation."), []);
  const catalog = trpc.catalog.list.useQuery({ limit: 100 }, { retry: false });
  const session = trpc.pos.getSession.useQuery({ branchId: branchId ?? 0, terminalId: TERMINAL_ID }, { enabled: !!branchId, retry: false, refetchInterval: 30_000 });
  const refresh = () => Promise.all([utils.pos.getSession.invalidate(), utils.catalog.list.invalidate(), utils.admin.inventory.invalidate()]);
  const openRegister = trpc.pos.openRegister.useMutation({ onSuccess: async () => { await refresh(); toast.success("Register opened. Drawer float and session are recorded."); }, onError: (error) => toast.error(error.message) });
  const cashMovement = trpc.pos.cashMovement.useMutation({ onSuccess: async () => { await refresh(); toast.success("Cash movement added to the register ledger."); setMovementAmount(""); setMovementReason(""); setMovementOpen(false); }, onError: (error) => toast.error(error.message) });
  const closeRegister = trpc.pos.closeRegister.useMutation({ onSuccess: async (result) => { await refresh(); toast.success(`Register closed. Variance: ${formatKes(result.variance)}.`); setCountedCash(""); }, onError: (error) => toast.error(error.message) });
  const completeSale = trpc.pos.completeCashSale.useMutation({ onSuccess: async (result) => { setSaleResult(result); setCart([]); setCashReceived(""); setCustomerName(""); setCustomerPhone(""); await refresh(); }, onError: (error) => toast.error(error.message) });

  const occupied = !!session.data && "occupiedByOther" in session.data;
  const drawer = session.data && !("occupiedByOther" in session.data) ? session.data : null;
  const productList = useMemo(() => (catalog.data ?? []).filter((item) => `${item.name} ${item.sku} ${item.categoryName ?? ""}`.toLowerCase().includes(filter.toLowerCase())), [catalog.data, filter]);
  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const cashMinor = Math.round(Number(cashReceived || 0) * 100);
  const demoItems = (catalog.data ?? []).filter((item) => item.isDemo).length;

  const selectVariant = (productId: number, variantId: number) => setChosenVariant((current) => ({ ...current, [productId]: variantId }));
  const lineFor = (item: NonNullable<typeof catalog.data>[number]): SaleLine | null => {
    const variant = item.variants.find((candidate) => candidate.id === chosenVariant[item.id]) ?? item.variants[0];
    if (!variant) return null;
    const available = variant.availability.find((record) => record.branchId === branchId)?.available ?? 0;
    return { variantId: variant.id, productId: item.id, name: item.name, sku: variant.sku, price: variant.retailPrice || item.retailPrice, photo: item.imageUrl, color: variant.color, quantity: 1, available };
  };
  const add = (item: NonNullable<typeof catalog.data>[number]) => {
    const line = lineFor(item);
    if (!line || item.isDemo || line.available < 1) return;
    setCart((current) => {
      const existing = current.find((row) => row.variantId === line.variantId);
      if (existing) return current.map((row) => row.variantId === line.variantId && row.quantity < row.available ? { ...row, quantity: row.quantity + 1 } : row);
      return [...current, line];
    });
  };
  const setQuantity = (variantId: number, quantity: number) => setCart((current) => current.flatMap((line) => line.variantId !== variantId ? [line] : quantity <= 0 ? [] : [{ ...line, quantity: Math.min(quantity, line.available) }]));
  const submitOpen = (event: FormEvent) => {
    event.preventDefault();
    if (!branchId) return;
    openRegister.mutate({ branchId, terminalId: TERMINAL_ID, openingFloat: Math.round(Number(openFloat || 0) * 100) });
  };
  const submitMovement = (event: FormEvent) => {
    event.preventDefault();
    if (!drawer) return;
    cashMovement.mutate({ sessionId: drawer.id, kind: movementKind, amount: Math.round(Number(movementAmount) * 100), reason: movementReason });
  };
  const submitSale = () => {
    if (!drawer || !cart.length || cashMinor < total) { toast.error("Add a live-stock item and enter enough cash to complete the sale."); return; }
    completeSale.mutate({ sessionId: drawer.id, items: cart.map((line) => ({ variantId: line.variantId, quantity: line.quantity })), cashReceived: cashMinor, customerName: customerName || undefined, customerPhone: customerPhone || undefined });
  };
  const submitClose = (event: FormEvent) => {
    event.preventDefault();
    if (!drawer || !window.confirm("Close this register session? The counted cash and variance will be recorded.")) return;
    closeRegister.mutate({ sessionId: drawer.id, actualCash: Math.round(Number(countedCash || 0) * 100) });
  };

  return <main className="pos-live-page">
    <header className="pos-live-top"><Link href="/" className="pos-live-brand"><img src={PB_LOGO_SRC} alt=""/><strong>PRINCE BENJA<small>POINT OF SALE</small></strong></Link><div className="pos-live-topmeta"><span><Store size={15}/> {branches.data?.find((branch) => branch.id === branchId)?.name ?? "Loading branch…"}</span><span className="pos-live-connection"><i/> NEON · LIVE</span><Link href="/admin" className="pos-live-admin-link"><ArrowLeft size={13}/> Workspace</Link></div></header>
    <div className="pos-live-body"><section className="pos-live-catalog"><div className="pos-live-sectionhead"><div><span className="pos-live-kicker">COUNTER SALES · {TERMINAL_ID}</span><h1>Point of sale</h1><p>Sellable quantities and prices are checked again in a Neon transaction on every sale.</p></div><button className="pos-live-iconbtn" onClick={() => void refresh()} aria-label="Refresh point of sale"><RefreshCw size={15}/></button></div>
      {branches.data && branches.data.length > 1 && <label className="pos-live-branch-select">Operating branch<select value={branchId ?? ""} onChange={(e)=>{setBranchId(Number(e.target.value));setCart([]);}}>{branches.data.map((branch)=><option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>}
      <label className="pos-live-search"><Search size={16}/><input value={filter} onChange={(e)=>setFilter(e.target.value)} placeholder="Search verified products"/></label>
      <div className="pos-live-demo-note"><CircleAlert size={15}/><span>{demoItems ? `${demoItems} visual demo products are excluded. Add your actual products in Admin before recording sales.` : "Only active products with sellable stock at this branch can be added."}</span></div>
      {catalog.isLoading ? <p className="pos-live-empty">Loading Neon catalogue…</p> : catalog.isError ? <p className="pos-live-empty">Could not connect to the catalogue. Refresh to retry.</p> : <div className="pos-live-products">{productList.map((item)=>{
        const chosen = item.variants.find((variant)=>variant.id === chosenVariant[item.id]) ?? item.variants[0];
        const available = chosen?.availability.find((record)=>record.branchId === branchId)?.available ?? 0;
        return <article className={`pos-live-product ${item.isDemo || !available ? "unavailable" : ""}`} key={item.id}><div className="pos-live-product-photo">{item.imageUrl ? <img src={item.imageUrl} alt=""/> : <PackageIcon/>}{item.isDemo && <span>DEMO</span>}</div><div className="pos-live-product-info"><div><strong>{item.name}</strong><small>{chosen?.sku ?? item.sku} · {chosen?.color ?? "Standard"}</small></div><b>{formatKes(chosen?.retailPrice || item.retailPrice)}</b></div>{item.variants.length > 1 && <select className="pos-live-variant" aria-label={`Variant for ${item.name}`} value={chosen?.id ?? ""} onChange={(e)=>selectVariant(item.id,Number(e.target.value))}>{item.variants.map((variant)=><option key={variant.id} value={variant.id}>{variant.color || "Standard"} {variant.size || ""} · {variant.sku}</option>)}</select>}<div className="pos-live-product-foot"><span>{item.isDemo ? "Sample stock" : `${available} available`}</span><button disabled={item.isDemo || available < 1} onClick={()=>add(item)}><Plus size={14}/> Add</button></div></article>;
      })}{!productList.length && <p className="pos-live-empty">No products match that search.</p>}</div>}
    </section>
    <aside className="pos-live-right"><section className="pos-live-register-card"><div className="pos-live-card-head"><div><span className="pos-live-kicker">REGISTER</span><h2>Terminal 01</h2></div><button className="pos-live-iconbtn" onClick={()=>void session.refetch()} aria-label="Refresh register"><RefreshCw size={14}/></button></div>{occupied ? <div className="pos-live-register-blocked"><CircleAlert size={16}/><div><strong>Register in use</strong><span>Another staff member holds the open session for this terminal.</span></div></div> : !drawer ? <form className="pos-live-open-form" onSubmit={submitOpen}><div className="pos-live-closed-state"><span className="pos-live-closed-dot"/> REGISTER CLOSED</div><label>Opening float (KES)<input type="number" min="0" step="1" value={openFloat} onChange={(e)=>setOpenFloat(e.target.value)} placeholder="0"/></label><button className="pos-live-dark-button" disabled={openRegister.isPending}>{openRegister.isPending ? "Opening…" : "Open cash register"}<ArrowRightIcon/></button>{session.isError && <small className="pos-live-error">Register status is unavailable. Retry before taking payment.</small>}</form> : <><div className="pos-live-open-state"><span/><div><strong>REGISTER OPEN</strong><small>Opened {new Date(drawer.openedAt).toLocaleString("en-KE",{dateStyle:"medium",timeStyle:"short"})}</small></div></div><div className="pos-live-register-stats"><div><span>Opening float</span><b>{formatKes(drawer.openingFloat)}</b></div><div><span>Cash sales</span><b>{formatKes(drawer.cashSales)}</b></div><div><span>Cash in / out</span><b>{formatKes(drawer.cashIn - drawer.cashOut - drawer.cashRefunds)}</b></div><div className="total"><span>Expected drawer</span><b>{formatKes(drawer.expectedCash)}</b></div></div><button className="pos-live-outline-button" onClick={()=>setMovementOpen((v)=>!v)}><Wallet size={14}/> Record cash movement</button>{movementOpen && <form className="pos-live-movement-form" onSubmit={submitMovement}><select value={movementKind} onChange={(e)=>setMovementKind(e.target.value as typeof movementKind)}><option value="cash_in">Cash in</option><option value="cash_out">Cash out</option><option value="cash_refund">Drawer refund movement</option></select><input type="number" min="1" step="1" required value={movementAmount} onChange={(e)=>setMovementAmount(e.target.value)} placeholder="KES amount"/><input minLength={4} required value={movementReason} onChange={(e)=>setMovementReason(e.target.value)} placeholder="Reason for ledger"/><small>A drawer refund movement does not itself record a product return or order refund.</small><button disabled={cashMovement.isPending}>Record movement</button></form>}</> }</section>
      <section className="pos-live-checkout"><div className="pos-live-card-head"><div><span className="pos-live-kicker">CURRENT SALE</span><h2>Basket <span>{cart.reduce((n,line)=>n+line.quantity,0)}</span></h2></div><ShoppingBag size={18}/></div><div className="pos-live-cart-list">{cart.map((line)=><div className="pos-live-cart-item" key={line.variantId}><div className="pos-live-cart-thumb">{line.photo?<img src={line.photo} alt=""/>:<PackageIcon/>}</div><div className="pos-live-cart-description"><strong>{line.name}</strong><small>{line.sku}{line.color ? ` · ${line.color}` : ""}</small><div className="pos-live-qty"><button onClick={()=>setQuantity(line.variantId,line.quantity-1)} aria-label="Decrease quantity"><Minus size={12}/></button><span>{line.quantity}</span><button disabled={line.quantity>=line.available} onClick={()=>setQuantity(line.variantId,line.quantity+1)} aria-label="Increase quantity"><Plus size={12}/></button></div></div><div className="pos-live-cart-price"><b>{formatKes(line.price*line.quantity)}</b><button onClick={()=>setQuantity(line.variantId,0)} aria-label={`Remove ${line.name}`}><Trash2 size={13}/></button></div></div>)}{cart.length===0&&<div className="pos-live-cart-empty"><ShoppingBag size={21}/><span>Add an available product to start a sale.</span></div>}</div>
      <div className="pos-live-checkout-fields"><label>Customer name · optional<input value={customerName} onChange={(e)=>setCustomerName(e.target.value)} placeholder="Walk-in customer"/></label><label>Customer phone · optional<input type="tel" value={customerPhone} onChange={(e)=>setCustomerPhone(e.target.value)} placeholder="For customer receipt record"/></label><label>Cash received (KES)<input type="number" min="0" step="1" value={cashReceived} onChange={(e)=>setCashReceived(e.target.value)} placeholder="Enter tendered amount"/></label></div><div className="pos-live-total-row"><span>Amount due</span><strong>{formatKes(total)}</strong></div>{cashMinor>=total&&total>0&&<div className="pos-live-change-row"><span>Change due</span><strong>{formatKes(cashMinor-total)}</strong></div>}<button className="pos-live-complete" disabled={!drawer||!cart.length||cashMinor<total||completeSale.isPending} onClick={submitSale}><ShieldCheck size={15}/>{completeSale.isPending ? "Recording secure sale…" : "Complete cash sale"}</button><p className="pos-live-payment-note">Cash only in this release. M-Pesa, bank, split tender and offline mode remain disabled until provider and resilient sync workflows are configured.</p></section>
      {drawer && <form className="pos-live-close-card" onSubmit={submitClose}><div><Clock3 size={15}/><strong>End-of-session reconciliation</strong></div><label>Count actual cash (KES)<input required type="number" min="0" step="1" value={countedCash} onChange={(e)=>setCountedCash(e.target.value)} placeholder="Count drawer before close"/></label><button className="pos-live-close-button" disabled={closeRegister.isPending}>{closeRegister.isPending ? "Closing…" : "Review & close register"}</button><small>Closes this staff-owned session and records actual cash, expected balance and variance.</small></form>}
    </aside></div>
    {saleResult && <div className="pos-live-modal-backdrop"><section className="pos-live-receipt-modal" role="dialog" aria-modal="true" aria-labelledby="pos-sale-complete"><div className="pos-live-receipt-mark"><CheckCircle2 size={24}/></div><span className="pos-live-kicker">NEON-RECORDED POS SALE</span><h2 id="pos-sale-complete">Cash sale complete</h2><p>Reference <strong>{saleResult.reference}</strong></p><div className="pos-live-receipt-detail"><span>Receipt</span><strong>{saleResult.receiptNumber}</strong><span>Sale total</span><strong>{formatKes(saleResult.total)}</strong><span>Cash received</span><strong>{formatKes(saleResult.cashReceived)}</strong><span>Change due</span><strong>{formatKes(saleResult.change)}</strong></div><div className="pos-live-receipt-actions"><button onClick={()=>window.print()}><Printer size={14}/> Print</button><button onClick={()=>setSaleResult(null)}>Done</button></div></section></div>}
  </main>;
}

function PackageIcon(){return <ShoppingBag size={21} strokeWidth={1.4}/>;}
function ArrowRightIcon(){return <Plus size={15}/>;}
