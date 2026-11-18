import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, MessageCircle } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import StorefrontLayout from "@/components/StorefrontLayout";
import { useCommerce } from "@/contexts/CommerceContext";
import { formatKes, setPageMeta } from "@/lib/format";
import { getWhatsAppUrl } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";

export default function Checkout() {
  const { cart, cartSubtotal, clearCart } = useCommerce();
  const [, setLocation] = useLocation();
  const formRef = useRef<HTMLFormElement>(null);
  const branches = trpc.catalog.branches.useQuery(undefined, { retry: false });
  const orderMutation = trpc.commerce.createOrder.useMutation();
  const [fulfillment, setFulfillment] = useState<"delivery" | "collection">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cash" | "bank">("mpesa");
  const [branchId, setBranchId] = useState<number | undefined>();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", instructions: "", paymentReference: "" });
  useEffect(() => setPageMeta("Checkout & Payment | PRINCE BENJA DESIGNS", "Place an order request or store a clearly labelled test checkout in Neon. No online payment gateway is connected."), []);
  const update = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((old) => ({ ...old, [key]: event.target.value }));
  const hasDemoItems = cart.some((line) => line.isDemo);
  const hasOperationalItems = cart.some((line) => !line.isDemo);
  const mixedCart = hasDemoItems && hasOperationalItems;

  const saveOrder = async (simulation: boolean) => {
    if (!cart.length) return;
    if (simulation && (mixedCart || !hasDemoItems)) {
      toast.error("Test mode accepts illustrative demo products only. Separate any live products from the test cart.");
      return;
    }
    try {
      const order = await orderMutation.mutateAsync({
        items: cart.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
        fulfillment,
        paymentMethod,
        customerName: form.name,
        customerPhone: form.phone,
        customerEmail: form.email || undefined,
        deliveryAddress: fulfillment === "delivery" ? form.address : undefined,
        deliveryInstructions: form.instructions || undefined,
        branchId,
        paymentReference: !simulation && paymentMethod === "bank" ? form.paymentReference || undefined : undefined,
        simulation,
      });
      try { sessionStorage.setItem("pb-last-order", JSON.stringify(order)); } catch { /* Private browsing may block session storage. */ }
      clearCart();
      setLocation(`/order-confirmation/${encodeURIComponent(order.reference)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn’t save your request. Please message us on WhatsApp.");
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (hasDemoItems) return;
    await saveOrder(false);
  };
  const simulate = async () => {
    if (!formRef.current?.reportValidity()) return;
    await saveOrder(true);
  };

  if (!cart.length) return <StorefrontLayout><main className="empty-checkout section-pad"><span className="eyebrow">Your bag is empty</span><h1>Nothing to check out yet.</h1><Link href="/shop" className="button-primary button-dark">Browse the collection <ArrowRight size={16} /></Link></main></StorefrontLayout>;
  const currentBranches = branches.data ?? [];

  return <StorefrontLayout><main className="checkout-page">
    <div className="shop-breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/cart">Your bag</Link><span>/</span><span>Checkout &amp; payment</span></div>
    <div className="checkout-title"><span className="eyebrow">Guest checkout</span><h1>Almost <em>there.</em></h1><p>Choose a fulfilment and payment preference. Live payment gateways are not connected; ordinary requests remain pending until the store confirms them.</p></div>
    <div className="checkout-notice"><LockKeyhole size={17} /><span><strong>No live payment is processed here.</strong> M-Pesa, bank-transfer and cash requests remain pending until independently verified by the store.</span></div>
    {hasDemoItems && <div className="checkout-notice demo-preview-notice"><span><strong>Illustrative sample catalogue.</strong> These sample products are not verified merchandise and cannot be placed as live orders. Use the explicit test-only action below to store a simulated order record.</span></div>}
    <form ref={formRef} className="checkout-layout" onSubmit={submit}>
      <div className="checkout-fields">
        <section className="checkout-card"><div className="checkout-card-heading"><span>01</span><div><h2>Your details</h2><small>{hasDemoItems ? "For test mode, use test-only contact details; form data is stored with the simulated order in Neon." : "We’ll use these to follow up on your order request."}</small></div></div><div className="checkout-form-grid">
          <label>Full name<input required minLength={2} maxLength={160} value={form.name} onChange={update("name")} placeholder="Your name" autoComplete="name" /></label>
          <label>Phone<input required minLength={9} maxLength={32} type="tel" value={form.phone} onChange={update("phone")} placeholder="+254 7…" autoComplete="tel" /></label>
          <label className="field-full">Email <small>(optional)</small><input type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" autoComplete="email" /></label>
        </div></section>

        <section className="checkout-card"><div className="checkout-card-heading"><span>02</span><div><h2>How would you like to receive it?</h2><small>Choose delivery or collection. All final arrangements are confirmed by our team.</small></div></div>
          <div className="choice-cards">
            <label className={fulfillment === "delivery" ? "choice-card selected" : "choice-card"}><input type="radio" checked={fulfillment === "delivery"} onChange={() => setFulfillment("delivery")} /><span><strong>Delivery</strong><small>Delivery cost and timing confirmed before processing.</small></span></label>
            <label className={fulfillment === "collection" ? "choice-card selected" : "choice-card"}><input type="radio" checked={fulfillment === "collection"} onChange={() => setFulfillment("collection")} /><span><strong>Collect in person</strong><small>Collection at a confirmed branch, after availability is checked.</small></span></label>
          </div>
          {fulfillment === "delivery" ? <div className="checkout-form-grid delivery-fields"><label className="field-full">Delivery address<textarea required maxLength={1000} value={form.address} onChange={update("address")} placeholder="Building, street and area" rows={3} autoComplete="street-address" /></label><label className="field-full">Directions or delivery notes <small>(optional)</small><input value={form.instructions} onChange={update("instructions")} placeholder="Anything helpful for our team" /></label></div> : <div className="branch-picker"><label htmlFor="branch">Collection branch</label><select id="branch" value={branchId ?? ""} onChange={(event) => setBranchId(event.target.value ? Number(event.target.value) : undefined)}><option value="">Choose a confirmed branch</option>{currentBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} — {branch.address || branch.city}</option>)}</select><small>Only confirmed locations are shown. We’ll confirm stock and collection timing.</small></div>}
        </section>

        <section className="checkout-card"><div className="checkout-card-heading"><span>03</span><div><h2>Payment preference</h2><small>No payment method is connected to a live gateway.</small></div></div>
          <div className="payment-options">
            <label className={paymentMethod === "mpesa" ? "payment-option selected" : "payment-option"}><input type="radio" checked={paymentMethod === "mpesa"} onChange={() => setPaymentMethod("mpesa")} /><span><strong>M-Pesa</strong><small>Provider connection is not configured.</small></span></label>
            <label className={paymentMethod === "cash" ? "payment-option selected" : "payment-option"}><input type="radio" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} /><span><strong>Cash</strong><small>Arrangement and recording confirmed by staff.</small></span></label>
            <label className={paymentMethod === "bank" ? "payment-option selected" : "payment-option"}><input type="radio" checked={paymentMethod === "bank"} onChange={() => setPaymentMethod("bank")} /><span><strong>Bank transfer</strong><small>Not complete until independently verified.</small></span></label>
          </div>
          {paymentMethod === "bank" && !hasDemoItems && <label className="payment-reference">Transfer reference <small>(optional, not proof of payment)</small><input value={form.paymentReference} onChange={update("paymentReference")} placeholder="Enter reference for staff review" /></label>}
          {hasDemoItems && <div className="payment-integration-status"><strong>Integration status: simulation only</strong><span>No M-Pesa/STK push, card charge, bank connection or customer payment will be initiated. Test orders are stored as demo orders with payment still pending.</span></div>}
        </section>
      </div>

      <aside className="checkout-summary"><span className="eyebrow">Review</span><h2>Your request</h2>
        {cart.map((line) => <div className="checkout-item" key={line.variantId}><img src={line.image} alt="" /><span>{line.name}<small>Qty {line.quantity}{line.isDemo ? " · illustrative" : ""}</small></span><strong>{formatKes(line.price * line.quantity)}</strong></div>)}
        <div className="checkout-summary-row"><span>Subtotal</span><strong>{formatKes(cartSubtotal)}</strong></div><div className="checkout-summary-row"><span>Delivery</span><span>Quote pending</span></div><div className="checkout-summary-row total"><span>{hasDemoItems ? "Illustrative amount" : "Order amount"}</span><strong>{formatKes(cartSubtotal)}</strong></div>
        <p>{hasDemoItems ? "Sample amount only. Test mode creates a demo order and pending payment row in Neon, but no payment, stock reservation, fulfilment or receipt." : "Submitting creates a pending order request and temporary stock reservation. It does not charge you or confirm delivery."}</p>
        {hasDemoItems ? <div className="checkout-simulation-action"><button className="button-primary button-dark checkout-submit" type="button" onClick={() => void simulate()} disabled={orderMutation.isPending || mixedCart}>{orderMutation.isPending ? "Saving test order…" : "Simulate & save test order to Neon"}<ArrowRight size={16} /></button><small>{mixedCart ? "Separate sample and operational items before simulation." : "Test only · payment remains pending · no stock or customer profile is changed."}</small></div> : <button className="button-primary button-dark checkout-submit" type="submit" disabled={orderMutation.isPending}>{orderMutation.isPending ? "Submitting…" : "Submit order request"}<ArrowRight size={16} /></button>}
        <a className="checkout-whatsapp" href={getWhatsAppUrl("Hello PRINCE BENJA DESIGNS — I need help with a product request.")} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Prefer WhatsApp? Message us</a><small className="checkout-consent">By continuing, you agree that the store may use these details to respond to this order enquiry. See the <Link href="/privacy-policy">privacy policy</Link>.</small>
      </aside>
    </form>
  </main></StorefrontLayout>;
}

export function OrderConfirmation() {
  const { reference = "" } = useParams<{ reference: string }>();
  const [lastOrder, setLastOrder] = useState<{ isDemo?: boolean; simulation?: boolean } | null>(null);
  useEffect(() => {
    setPageMeta("Order Request Received | PRINCE BENJA DESIGNS", "Your order request is recorded and remains pending store confirmation.");
    try { const raw = sessionStorage.getItem("pb-last-order"); if (raw) setLastOrder(JSON.parse(raw)); } catch { /* Keep the confirmation page useful without storage. */ }
  }, []);
  const safeReference = decodeURIComponent(reference);
  return <StorefrontLayout><main className="confirmation-page"><div className="confirmation-mark"><CheckCircle2 size={33} /></div><span className="eyebrow">{lastOrder?.simulation ? "Test order stored" : "Request received"}</span><h1>{lastOrder?.simulation ? <>Saved for<br /><em>simulation.</em></> : <>Thank you.<br /><em>We’ll take it from here.</em></>}</h1><p>Your reference is <strong>{safeReference}</strong>. {lastOrder?.simulation ? "A demo order and pending payment row were written to Neon. No payment was requested, stock changed, customer profile updated or sale receipt issued. This test order is excluded from sales analytics." : "This is not a payment receipt. The order is pending, and our team must confirm stock, delivery cost and payment directly with you."}</p>{lastOrder?.isDemo && !lastOrder.simulation && <div className="confirmation-demo">Your order includes sample catalogue items. The submission is for demonstration and product details are not live.</div>}<div className="confirmation-actions"><Link href="/track-order" className="button-primary button-dark">Check order status <ArrowRight size={15} /></Link><a href={getWhatsAppUrl(`Hello PRINCE BENJA DESIGNS — I submitted order ${safeReference}. Please confirm details.`)} target="_blank" rel="noreferrer">Message the team <MessageCircle size={15} /></a></div></main></StorefrontLayout>;
}
