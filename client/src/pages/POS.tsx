import { useMemo, useState } from "react";
import { PB_LOGO_SRC } from "@/lib/brand";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Backpack,
  Banknote,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  Minus,
  Package,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  ShoppingBag,
  ScanLine,
  ShoppingCart,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import "./pos.css";

type Category =
  | "All"
  | "Suitcases"
  | "Backpacks"
  | "Duffel bags"
  | "Accessories";
type PaymentMethod = "M-Pesa" | "Cash" | "Bank" | "Split";
type Product = {
  id: string;
  name: string;
  sku: string;
  category: Exclude<Category, "All">;
  price: number;
  variant: string;
  swatch: string;
  icon: typeof Briefcase;
  tag?: string;
};
type CartLine = { product: Product; qty: number };
type SaleRecord = {
  id: string;
  amount: number;
  cash: number;
  method: PaymentMethod;
  time: string;
  customer: string;
  discount: number;
  lines: CartLine[];
};

const products: Product[] = [
  {
    id: "cabin-shell",
    name: "Cabin shell suitcase",
    sku: "TRV-CS-204",
    category: "Suitcases",
    price: 6500,
    variant: "Sand · cabin size",
    swatch: "sand",
    icon: Briefcase,
    tag: "Carry-on",
  },
  {
    id: "travel-pack",
    name: "Travel backpack",
    sku: "TRV-BP-118",
    category: "Backpacks",
    price: 3500,
    variant: "Olive · 24 L",
    swatch: "olive",
    icon: Backpack,
    tag: "Everyday",
  },
  {
    id: "weekender",
    name: "Canvas weekender",
    sku: "TRV-DB-072",
    category: "Duffel bags",
    price: 4200,
    variant: "Clay · medium",
    swatch: "clay",
    icon: ShoppingBag,
  },
  {
    id: "packing-cubes",
    name: "Packing cube set",
    sku: "TRV-AC-031",
    category: "Accessories",
    price: 1800,
    variant: "Natural · 3 piece",
    swatch: "linen",
    icon: Package,
  },
  {
    id: "daypack",
    name: "City daypack",
    sku: "TRV-BP-092",
    category: "Backpacks",
    price: 2900,
    variant: "Ink · 18 L",
    swatch: "ink",
    icon: Backpack,
  },
  {
    id: "luggage-tag",
    name: "Leather luggage tag",
    sku: "TRV-AC-014",
    category: "Accessories",
    price: 950,
    variant: "Cognac · single",
    swatch: "brass",
    icon: Package,
  },
];
const categories: { name: Category; icon: typeof Briefcase }[] = [
  { name: "All", icon: ShoppingBag },
  { name: "Suitcases", icon: Briefcase },
  { name: "Backpacks", icon: Backpack },
  { name: "Duffel bags", icon: Wallet },
  { name: "Accessories", icon: Package },
];
const customers = [
  "Walk-in customer",
  "Amina Wanjiku",
  "Daniel Mwangi",
  "Njeri Kamau",
];
const kes = (amount: number) =>
  `KES ${Math.max(0, amount).toLocaleString("en-KE")}`;

export default function POS() {
  const [category, setCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([
    { product: products[0], qty: 1 },
  ]);
  const [customer, setCustomer] = useState("Walk-in customer");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("M-Pesa");
  const [cashReceived, setCashReceived] = useState("");
  const [splitCash, setSplitCash] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountNote, setDiscountNote] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerActive, setRegisterActive] = useState(true);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<SaleRecord | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [openingFloat, setOpeningFloat] = useState(5000);
  const [actualCash, setActualCash] = useState("");
  const [cashIn, setCashIn] = useState(0);
  const [cashOut, setCashOut] = useState(0);
  const [refunds, setRefunds] = useState(0);
  const [movementKind, setMovementKind] = useState<"in" | "out" | "refund">(
    "in"
  );
  const [movementAmount, setMovementAmount] = useState("");
  const [movementNote, setMovementNote] = useState("");

  const subtotal = useMemo(
    () =>
      cart.reduce((total, line) => total + line.product.price * line.qty, 0),
    [cart]
  );
  const total = Math.max(0, subtotal - discount);
  const expectedDrawer =
    openingFloat +
    sales.reduce((sum, sale) => sum + sale.cash, 0) +
    cashIn -
    cashOut -
    refunds;
  const filteredProducts = products.filter(product => {
    const matchesCategory = category === "All" || product.category === category;
    const term = query.trim().toLowerCase();
    const matchesQuery =
      !term ||
      `${product.name} ${product.sku} ${product.variant} ${product.category}`
        .toLowerCase()
        .includes(term);
    return matchesCategory && matchesQuery;
  });
  const filteredCustomers = customers.filter(name =>
    name.toLowerCase().includes(customerQuery.toLowerCase())
  );

  const addProduct = (product: Product) => {
    setCart(current => {
      const existing = current.find(line => line.product.id === product.id);
      return existing
        ? current.map(line =>
            line.product.id === product.id
              ? { ...line, qty: line.qty + 1 }
              : line
          )
        : [...current, { product, qty: 1 }];
    });
  };
  const changeQty = (id: string, change: number) => {
    setCart(current =>
      current.flatMap(line =>
        line.product.id !== id
          ? [line]
          : line.qty + change > 0
            ? [{ ...line, qty: line.qty + change }]
            : []
      )
    );
  };
  const handleScanKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    const term = query.trim().toLowerCase();
    if (!term) return;
    const match =
      products.find(
        product =>
          product.sku.toLowerCase() === term ||
          product.name.toLowerCase() === term
      ) ?? filteredProducts[0];
    if (match) {
      addProduct(match);
      setQuery("");
    }
  };
  const completeDemoSale = () => {
    if (!cart.length) return;
    const cash =
      paymentMethod === "Cash"
        ? total
        : paymentMethod === "Split"
          ? Math.min(total, Number(splitCash) || 0)
          : 0;
    const sale: SaleRecord = {
      id: `DEMO-${String(sales.length + 1).padStart(4, "0")}`,
      amount: total,
      cash,
      method: paymentMethod,
      time: new Date().toLocaleTimeString("en-KE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      customer,
      discount,
      lines: cart.map(line => ({ ...line })),
    };
    setSales(current => [...current, sale]);
    setReceiptSale(sale);
    setReceiptOpen(true);
    setCart([]);
    setDiscount(0);
    setCashReceived("");
    setSplitCash("");
  };
  const applyDemoDiscount = () => {
    const value = Number(discountAmount);
    if (
      discountCode.trim().toUpperCase() !== "DEMO" ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value > subtotal
    )
      return;
    setDiscount(value);
    setDiscountNote("Demo-only authorization entered · not verified");
    setDiscountOpen(false);
    setDiscountCode("");
    setDiscountAmount("");
  };
  const recordMovement = () => {
    const amount = Number(movementAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (movementKind === "in") setCashIn(current => current + amount);
    else if (movementKind === "refund") setRefunds(current => current + amount);
    else setCashOut(current => current + amount);
    setMovementAmount("");
    setMovementNote("");
  };

  return (
    <main className="pos-page">
      <div className="pos-shell">
        <header className="pos-header">
          <div className="pos-brand-lockup">
            <img className="pos-mark" src={PB_LOGO_SRC} alt="" />
            <div>
              <div className="pos-brand-name">
                PRINCE BENJA DESIGNS
              </div>
              <div className="pos-brand-caption">TRAVEL GOODS · COUNTER</div>
            </div>
          </div>
          <div className="pos-location">
            <span className="pos-location-dot" /> Pipeline Stage{" "}
            <span className="pos-location-divider" /> Terminal 01{" "}
            <ChevronDown size={14} />
          </div>
          <div className="pos-header-actions">
            <button
              className="pos-register-pill"
              onClick={() => setRegisterOpen(true)}
              aria-label="Open demo register and reconciliation view"
            >
              <span className="pos-register-light" /> Register{" "}
              <b>DEMO · {registerActive ? "OPEN" : "CLOSED"}</b>
              <ChevronRight size={14} />
            </button>
            <div className="pos-avatar" title="Demo associate">
              <UserRound size={15} />
            </div>
          </div>
        </header>

        <div className="pos-demo-banner" role="note">
          <span className="pos-demo-banner-icon">
            <ShieldCheck size={16} />
          </span>
          <span>
            <strong>DEMO MODE</strong>
            <span className="pos-demo-banner-dash">—</span> no live transaction
          </span>
          <span className="pos-demo-banner-note">
            Illustrative products and local-only sales state
          </span>
          <span className="pos-demo-banner-terminal">TERMINAL 01</span>
        </div>

        <section className="pos-workspace" aria-label="Point of sale">
          <div className="pos-catalog">
            <div className="pos-page-intro">
              <div>
                <div className="pos-eyebrow">COUNTER · PIPELINE STAGE</div>
                <h1>Point of sale</h1>
                <p>A considered collection for the journey ahead.</p>
              </div>
              <button
                className="pos-reconcile-shortcut"
                onClick={() => setRegisterOpen(true)}
              >
                <Clock3 size={15} /> Reconcile register
              </button>
            </div>

            <div
              className="pos-categories"
              role="tablist"
              aria-label="Product category"
            >
              {categories.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  className={`pos-category ${category === name ? "is-active" : ""}`}
                  onClick={() => setCategory(name)}
                  role="tab"
                  aria-selected={category === name}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  <span>{name}</span>
                </button>
              ))}
            </div>

            <div className="pos-search-row">
              <label className="pos-search-box">
                <Search size={17} />
                <input
                  aria-label="Search products by name or SKU"
                  placeholder="Find a product or SKU…"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  onKeyDown={handleScanKey}
                />
                <kbd>↵</kbd>
              </label>
              <span className="pos-scanner-hint">
                <ScanLine size={15} /> Scanner-ready
              </span>
            </div>

            <div className="pos-results-heading">
              <div>
                <span>CURATED FOR THE COUNTER</span>
                <small>{filteredProducts.length} illustrative items</small>
              </div>
              <span className="pos-fixture-stamp">
                <i /> ILLUSTRATIVE FIXTURES
              </span>
            </div>
            <div className="pos-product-grid">
              {filteredProducts.map(product => {
                const Icon = product.icon;
                return (
                  <button
                    key={product.id}
                    className="pos-product-card"
                    onClick={() => addProduct(product)}
                    aria-label={`Add ${product.name}, ${kes(product.price)}, illustrative fixture`}
                  >
                    <div
                      className={`pos-product-art pos-art-${product.swatch}`}
                    >
                      <span className="pos-art-monogram">
                        P<span>·</span>P
                      </span>
                      <Icon
                        className="pos-product-icon"
                        size={54}
                        strokeWidth={1.05}
                      />
                      <span className="pos-art-size">
                        {product.category === "Suitcases"
                          ? "01"
                          : product.category === "Backpacks"
                            ? "02"
                            : product.category === "Duffel bags"
                              ? "03"
                              : "04"}
                      </span>
                    </div>
                    <div className="pos-product-copy">
                      <div className="pos-product-category">
                        {product.category}
                        {product.tag && <span>· {product.tag}</span>}
                      </div>
                      <div className="pos-product-name">{product.name}</div>
                      <div className="pos-product-variant">
                        <span
                          className={`pos-swatch-dot pos-swatch-${product.swatch}`}
                        />
                        {product.variant}
                      </div>
                      <div className="pos-product-bottom">
                        <span className="pos-product-price">
                          {kes(product.price)}
                        </span>
                        <span className="pos-product-add">
                          <Plus size={15} />
                        </span>
                      </div>
                      <div className="pos-product-meta">
                        <span>{product.sku}</span>
                        <span>Branch availability · illustrative</span>
                      </div>
                    </div>
                  </button>
                );
              })}
              {!filteredProducts.length && (
                <div className="pos-empty-results">
                  <Search size={23} />
                  <strong>No matching pieces</strong>
                  <span>Try another name, category, or SKU.</span>
                </div>
              )}
            </div>
            <div className="pos-catalog-footnote">
              <CircleHelp size={14} /> Fixture data is illustrative;
              availability and pricing are not live.
            </div>
          </div>

          <aside className="pos-ticket" aria-label="Current sale">
            <div className="pos-ticket-top">
              <div>
                <div className="pos-eyebrow">
                  CURRENT SALE <span className="pos-ticket-number">· DEMO</span>
                </div>
                <h2>Sale details</h2>
              </div>
              <button
                className="pos-icon-button pos-ticket-help"
                title="Demo-only cart"
              >
                <CircleHelp size={17} />
              </button>
            </div>
            <div className="pos-customer-wrap">
              <div className="pos-section-label">
                <span>CUSTOMER</span>
                <button
                  onClick={() => {
                    setCustomer("Walk-in customer");
                    setCustomerPickerOpen(false);
                  }}
                >
                  Clear
                </button>
              </div>
              <button
                className="pos-customer-select"
                onClick={() => setCustomerPickerOpen(open => !open)}
                aria-expanded={customerPickerOpen}
              >
                <span className="pos-customer-avatar">
                  <UserRound size={17} />
                </span>
                <span className="pos-customer-value">
                  <strong>{customer}</strong>
                  <small>
                    {customer === "Walk-in customer"
                      ? "No customer attached"
                      : "Selected for this demo sale"}
                  </small>
                </span>
                <ChevronDown size={16} />
              </button>
              {customerPickerOpen && (
                <div className="pos-customer-picker">
                  <label>
                    <Search size={15} />
                    <input
                      autoFocus
                      placeholder="Search customer"
                      value={customerQuery}
                      onChange={event => setCustomerQuery(event.target.value)}
                    />
                  </label>
                  {filteredCustomers.map(name => (
                    <button
                      key={name}
                      onClick={() => {
                        setCustomer(name);
                        setCustomerPickerOpen(false);
                        setCustomerQuery("");
                      }}
                    >
                      {name}
                      {customer === name && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="pos-ticket-items-header">
              <span>
                ITEMS <b>{cart.reduce((sum, item) => sum + item.qty, 0)}</b>
              </span>
              <button
                onClick={() => {
                  setCart([]);
                  setDiscount(0);
                }}
              >
                Clear sale
              </button>
            </div>
            <div className="pos-cart-list">
              {cart.map(({ product, qty }) => {
                const Icon = product.icon;
                return (
                  <div className="pos-cart-line" key={product.id}>
                    <div className={`pos-cart-thumb pos-art-${product.swatch}`}>
                      <Icon size={21} strokeWidth={1.25} />
                    </div>
                    <div className="pos-cart-info">
                      <strong>{product.name}</strong>
                      <span>{product.variant}</span>
                      <small>{product.sku}</small>
                      <div className="pos-qty-control">
                        <button
                          aria-label={`Decrease ${product.name} quantity`}
                          onClick={() => changeQty(product.id, -1)}
                        >
                          <Minus size={13} />
                        </button>
                        <span>{qty}</span>
                        <button
                          aria-label={`Increase ${product.name} quantity`}
                          onClick={() => changeQty(product.id, 1)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="pos-cart-price">
                      <strong>{kes(product.price * qty)}</strong>
                      <button
                        aria-label={`Remove ${product.name}`}
                        onClick={() => changeQty(product.id, -qty)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {!cart.length && (
                <div className="pos-cart-empty">
                  <div className="pos-cart-empty-icon">
                    <ShoppingCart size={20} />
                  </div>
                  <strong>Your sale is ready to begin</strong>
                  <span>Add an illustrative item from the collection.</span>
                </div>
              )}
            </div>
            <button
              className="pos-discount-button"
              onClick={() => setDiscountOpen(true)}
            >
              <span className="pos-discount-mark">%</span>
              <span>
                <strong>
                  {discount ? "Demo discount applied" : "Apply a discount"}
                </strong>
                <small>Supervisor authorization required</small>
              </span>
              {discount ? (
                <span className="pos-discount-value">−{kes(discount)}</span>
              ) : (
                <ChevronRight size={15} />
              )}
            </button>
            {discountNote && (
              <div className="pos-discount-note">
                <CircleHelp size={12} />
                {discountNote}
                <button
                  onClick={() => {
                    setDiscount(0);
                    setDiscountNote("");
                  }}
                  aria-label="Remove discount"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <div className="pos-total-block">
              <div>
                <span>Subtotal</span>
                <strong>{kes(subtotal)}</strong>
              </div>
              {discount > 0 && (
                <div className="pos-total-discount">
                  <span>Demo discount</span>
                  <strong>−{kes(discount)}</strong>
                </div>
              )}
              <div className="pos-total-final">
                <span>Total due</span>
                <strong>{kes(total)}</strong>
              </div>
              <div className="pos-tax-caption">
                Tax treatment not configured in this demo.
              </div>
            </div>

            <div className="pos-payment-section">
              <div className="pos-section-label">
                <span>PAYMENT METHOD</span>
                <span className="pos-unverified-tag">
                  <i /> UNVERIFIED
                </span>
              </div>
              <div
                className="pos-payment-options"
                role="group"
                aria-label="Payment method"
              >
                {(["M-Pesa", "Cash", "Bank", "Split"] as PaymentMethod[]).map(
                  method => {
                    const Icon =
                      method === "M-Pesa"
                        ? Wallet
                        : method === "Cash"
                          ? Banknote
                          : method === "Bank"
                            ? CreditCard
                            : ArrowLeftRight;
                    return (
                      <button
                        key={method}
                        className={
                          paymentMethod === method ? "is-selected" : ""
                        }
                        onClick={() => setPaymentMethod(method)}
                      >
                        <Icon size={15} />
                        <span>{method}</span>
                      </button>
                    );
                  }
                )}
              </div>
              {paymentMethod === "Cash" && (
                <label className="pos-cash-field">
                  <span>Cash received</span>
                  <div>
                    <span>KES</span>
                    <input
                      inputMode="numeric"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={cashReceived}
                      onChange={event => setCashReceived(event.target.value)}
                    />
                  </div>
                  {Number(cashReceived) > total && (
                    <small>
                      Change due <b>{kes(Number(cashReceived) - total)}</b>
                    </small>
                  )}
                </label>
              )}
              {paymentMethod === "Split" && (
                <div className="pos-split-fields">
                  <label>
                    <span>Cash portion (KES)</span>
                    <input
                      inputMode="numeric"
                      type="number"
                      min="0"
                      max={total}
                      placeholder="0"
                      value={splitCash}
                      onChange={event => setSplitCash(event.target.value)}
                    />
                  </label>
                  <div>
                    <span>Non-cash portion</span>
                    <strong>
                      {kes(Math.max(0, total - (Number(splitCash) || 0)))}
                    </strong>
                  </div>
                </div>
              )}
              <p className="pos-payment-caveat">
                <ShieldCheck size={14} />
                <span>
                  <strong>Payment not verified.</strong> Selection or screenshot
                  is not proof of payment. No STK Push, bank confirmation, or
                  live payment connection.
                </span>
              </p>
            </div>
            <button
              className="pos-complete-button"
              disabled={!cart.length || !registerActive}
              onClick={completeDemoSale}
            >
              <span>Complete demo sale</span>
              <span>
                {kes(total)} <ChevronRight size={16} />
              </span>
            </button>
            <div className="pos-ticket-footer">
              <span>
                <ShieldCheck size={13} /> Local demo state only
              </span>
              <span>No inventory deduction</span>
            </div>
          </aside>
        </section>
        <footer className="pos-page-footer">
          <span>
            PRINCE BENJA DESIGNS <i>·</i> COUNTER EXPERIENCE
          </span>
          <span>
            Pipeline Stage <i>·</i> Terminal 01
          </span>
        </footer>
      </div>

      {discountOpen && (
        <div
          className="pos-modal-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setDiscountOpen(false);
          }}
        >
          <section
            className="pos-modal pos-discount-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-discount-title"
          >
            <div className="pos-modal-top">
              <span className="pos-modal-icon">
                <ShieldCheck size={18} />
              </span>
              <button
                className="pos-icon-button"
                onClick={() => setDiscountOpen(false)}
                aria-label="Close discount"
              >
                <X size={18} />
              </button>
            </div>
            <div className="pos-eyebrow">SUPERVISOR CONTROL · DEMO</div>
            <h2 id="pos-discount-title">Apply a discount</h2>
            <p>
              Discounts require supervisor authorization in a live register.
              This illustrative screen does not verify credentials.
            </p>
            <label className="pos-modal-field">
              <span>Demo authorization code</span>
              <input
                autoFocus
                value={discountCode}
                onChange={event => setDiscountCode(event.target.value)}
                placeholder="Enter DEMO to continue"
              />
            </label>
            <label className="pos-modal-field">
              <span>Discount amount</span>
              <div className="pos-modal-amount">
                <span>KES</span>
                <input
                  type="number"
                  min="1"
                  max={subtotal}
                  inputMode="numeric"
                  value={discountAmount}
                  onChange={event => setDiscountAmount(event.target.value)}
                  placeholder="0"
                />
              </div>
              <small>
                Cannot exceed the illustrative sale subtotal of {kes(subtotal)}.
              </small>
            </label>
            <div className="pos-modal-disclaimer">
              <CircleHelp size={15} /> Demo code “DEMO” only simulates this
              control; it grants no real authorization.
            </div>
            <button
              className="pos-modal-primary"
              disabled={
                discountCode.trim().toUpperCase() !== "DEMO" ||
                Number(discountAmount) <= 0 ||
                Number(discountAmount) > subtotal
              }
              onClick={applyDemoDiscount}
            >
              Apply demo discount <ChevronRight size={15} />
            </button>
          </section>
        </div>
      )}

      {receiptOpen && receiptSale && (
        <div
          className="pos-modal-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setReceiptOpen(false);
          }}
        >
          <section
            className="pos-modal pos-receipt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-receipt-title"
          >
            <div className="pos-receipt-head">
              <img className="pos-mark pos-mark-small" src={PB_LOGO_SRC} alt="" />
              <div className="pos-brand-name">
                PRINCE BENJA DESIGNS
              </div>
              <span className="pos-receipt-demo">
                DEMO PREVIEW · NOT A RECEIPT
              </span>
            </div>
            <h2 id="pos-receipt-title">Sale recorded locally</h2>
            <p className="pos-receipt-location">
              Pipeline Stage <span>·</span> Terminal 01
            </p>
            <div className="pos-receipt-status">
              <span className="pos-unverified-tag">
                <i /> PAYMENT UNVERIFIED
              </span>
              <small>No payment confirmed or receipt issued.</small>
            </div>
            <div className="pos-receipt-meta">
              <span>Demo reference</span>
              <strong>{receiptSale.id}</strong>
              <span>Time</span>
              <strong>{receiptSale.time}</strong>
              <span>Customer</span>
              <strong>{receiptSale.customer}</strong>
              <span>Selected tender</span>
              <strong>
                {receiptSale.method}
                {receiptSale.method === "Split"
                  ? ` · ${kes(receiptSale.cash)} cash`
                  : ""}
              </strong>
            </div>
            <div className="pos-receipt-line" />
            {receiptSale.lines.map(({ product, qty }) => (
              <div className="pos-receipt-item" key={product.id}>
                <span>
                  {product.name} × {qty}
                  <small>{product.sku}</small>
                </span>
                <strong>{kes(product.price * qty)}</strong>
              </div>
            ))}
            <div className="pos-receipt-line" />
            <div className="pos-receipt-item">
              <span>Subtotal</span>
              <strong>
                {kes(
                  receiptSale.lines.reduce(
                    (sum, line) => sum + line.product.price * line.qty,
                    0
                  )
                )}
              </strong>
            </div>
            {receiptSale.discount > 0 && (
              <div className="pos-receipt-item">
                <span>Demo discount</span>
                <strong>−{kes(receiptSale.discount)}</strong>
              </div>
            )}
            <div className="pos-receipt-total">
              <span>Demo total</span>
              <strong>{kes(receiptSale.amount)}</strong>
            </div>
            <div className="pos-receipt-warning">
              This is an on-screen illustration only. No live transaction,
              inventory change, payment verification, or actual receipt.
            </div>
            <div className="pos-receipt-actions">
              <button
                className="pos-modal-secondary"
                onClick={() => setReceiptOpen(false)}
              >
                Close preview
              </button>
              <button
                className="pos-modal-primary pos-print-button"
                onClick={() => setReceiptOpen(false)}
              >
                <Printer size={15} /> Done
              </button>
            </div>
          </section>
        </div>
      )}

      {registerOpen && (
        <div
          className="pos-modal-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setRegisterOpen(false);
          }}
        >
          <section
            className="pos-modal pos-register-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-register-title"
          >
            <div className="pos-modal-top">
              <span className="pos-modal-icon">
                <Banknote size={19} />
              </span>
              <button
                className="pos-icon-button"
                onClick={() => setRegisterOpen(false)}
                aria-label="Close register view"
              >
                <X size={18} />
              </button>
            </div>
            <div className="pos-eyebrow">PIPELINE STAGE · TERMINAL 01</div>
            <h2 id="pos-register-title">Register reconciliation</h2>
            <div className="pos-register-state">
              <span className="pos-register-light" />
              <strong>
                DEMO REGISTER · {registerActive ? "OPEN" : "CLOSED"}
              </strong>
              <small>Local illustration · not a live till</small>
            </div>
            <div className="pos-register-fields">
              <label>
                <span>Opening float</span>
                <div>
                  <span>KES</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={openingFloat}
                    onChange={event =>
                      setOpeningFloat(Number(event.target.value) || 0)
                    }
                  />
                </div>
              </label>
              <div className="pos-register-field-read">
                <span>Illustrative sales</span>
                <strong>
                  {kes(sales.reduce((sum, sale) => sum + sale.amount, 0))}
                </strong>
                <small>
                  {sales.length} locally recorded demo sale
                  {sales.length === 1 ? "" : "s"}
                </small>
              </div>
              <div className="pos-register-field-read">
                <span>Refunds</span>
                <strong>{kes(refunds)}</strong>
                <small>Local adjustment only</small>
              </div>
              <div className="pos-register-field-read">
                <span>Cash in</span>
                <strong>{kes(cashIn)}</strong>
                <small>Non-sale movement</small>
              </div>
              <div className="pos-register-field-read">
                <span>Cash out</span>
                <strong>{kes(cashOut)}</strong>
                <small>Non-sale movement</small>
              </div>
            </div>
            <div className="pos-register-note">
              <Wallet size={15} />
              <span>
                Expected drawer cash excludes M-Pesa and bank tenders. Split
                sales include only their cash portion.
              </span>
            </div>
            <div className="pos-drawer-recon">
              <div>
                <span>Expected drawer</span>
                <strong>{kes(expectedDrawer)}</strong>
              </div>
              <label>
                <span>Actual counted cash</span>
                <div>
                  <span>KES</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="Enter count"
                    value={actualCash}
                    onChange={event => setActualCash(event.target.value)}
                  />
                </div>
              </label>
              <div className="pos-variance-row">
                <span>Variance</span>
                <strong>
                  {actualCash === ""
                    ? "—"
                    : `${Number(actualCash) - expectedDrawer < 0 ? "−" : Number(actualCash) - expectedDrawer > 0 ? "+" : ""}${kes(Math.abs(Number(actualCash) - expectedDrawer))}`}
                </strong>
              </div>
            </div>
            <div className="pos-movement-panel">
              <div className="pos-section-label">
                <span>DEMO CASH MOVEMENT</span>
                <span>Optional</span>
              </div>
              <div className="pos-movement-switch">
                <button
                  className={movementKind === "in" ? "is-selected" : ""}
                  onClick={() => setMovementKind("in")}
                >
                  <ArrowDownLeft size={14} /> Cash in
                </button>
                <button
                  className={movementKind === "out" ? "is-selected" : ""}
                  onClick={() => setMovementKind("out")}
                >
                  <ArrowUpRight size={14} /> Cash out
                </button>
                <button
                  className={movementKind === "refund" ? "is-selected" : ""}
                  onClick={() => setMovementKind("refund")}
                >
                  <ArrowUpRight size={14} /> Cash refund
                </button>
              </div>
              <div className="pos-movement-inputs">
                <label>
                  <span>Amount (KES)</span>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    placeholder="0"
                    value={movementAmount}
                    onChange={event => setMovementAmount(event.target.value)}
                  />
                </label>
                <label>
                  <span>Note</span>
                  <input
                    placeholder="Illustrative note"
                    value={movementNote}
                    onChange={event => setMovementNote(event.target.value)}
                  />
                </label>
                <button
                  onClick={recordMovement}
                  disabled={!Number(movementAmount)}
                >
                  Record
                </button>
              </div>
            </div>
            <div className="pos-register-foot">
              <span>All figures are local demo state.</span>
              <div className="pos-register-actions">
                <button onClick={() => setRegisterActive(active => !active)}>
                  {registerActive
                    ? "Close demo register"
                    : "Reopen demo register"}
                </button>
                <button
                  onClick={() => {
                    setRegisterOpen(false);
                    setActualCash("");
                  }}
                >
                  Close view <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
