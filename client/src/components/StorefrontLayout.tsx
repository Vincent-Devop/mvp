import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, Menu, PackageSearch, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useCommerce } from "@/contexts/CommerceContext";
import { getWhatsAppUrl } from "@/lib/catalog";
import { PB_LOGO_SRC } from "@/lib/brand";

export function BrandMark({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`brand-lockup${light ? " brand-lockup-light" : ""}`} aria-label="PRINCE BENJA DESIGNS home">
    <img className="brand-logo-image" src={PB_LOGO_SRC} alt="" />
    <span className="brand-wordmark"><strong>PRINCE BENJA</strong><small>DESIGNS</small></span>
  </Link>;
}

const links = [
  ["Shop", "/shop"],
  ["Suitcases", "/categories/suitcases"],
  ["Bags", "/categories/duffel-bags"],
  ["Travel accessories", "/categories/travel-accessories"],
  ["Wholesale", "/wholesale"],
] as const;

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [location, setLocation] = useLocation();
  const { cartCount } = useCommerce();
  const openSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setLocation(`/search?q=${encodeURIComponent(searchText.trim())}`);
    setSearchOpen(false);
  };
  const closeMenu = () => setMobileOpen(false);

  return <div className="store-shell">
    <div className="announce-bar"><span>Travel, thoughtfully chosen.</span><a href={getWhatsAppUrl("Hello PRINCE BENJA DESIGNS — I would like to ask about your travel bags.")} target="_blank" rel="noreferrer">Questions? Chat with us <ArrowUpRight size={13} /></a></div>
    <header className="store-header">
      <button className="icon-button mobile-menu-trigger" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close menu" : "Open menu"}>{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button>
      <BrandMark />
      <nav className="desktop-nav" aria-label="Main navigation">{links.map(([label, href]) => <Link key={href} href={href} className={location === href ? "nav-active" : ""}>{label}</Link>)}</nav>
      <div className="header-actions">
        <button className="icon-button search-trigger" aria-label="Search products" onClick={() => setSearchOpen((value) => !value)}><Search size={19} /></button>
        <Link className="icon-button account-shortcut" href="/account" aria-label="My account"><UserRound size={19} /></Link>
        <Link className="icon-button track-shortcut" href="/track-order" aria-label="Track order"><PackageSearch size={19} /></Link>
        <Link className="icon-button cart-shortcut" href="/cart" aria-label={`Shopping bag with ${cartCount} items`}><ShoppingBag size={19} /><span className="cart-dot">{cartCount}</span></Link>
      </div>
      {searchOpen && <form className="header-search" onSubmit={openSearch}><Search size={17} /><input autoFocus value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search travel bags…" aria-label="Search travel bags" /><button type="submit">Search</button><button type="button" className="search-close" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={18} /></button></form>}
    </header>
    {mobileOpen && <div className="mobile-nav-scrim" onClick={closeMenu}><nav className="mobile-nav" aria-label="Mobile navigation" onClick={(event) => event.stopPropagation()}>
      <div className="mobile-nav-top"><BrandMark /><button className="icon-button" onClick={closeMenu} aria-label="Close menu"><X size={20} /></button></div>
      {links.map(([label, href]) => <Link key={href} href={href} onClick={closeMenu}>{label}<ArrowUpRight size={16} /></Link>)}
      <Link href="/about" onClick={closeMenu}>Our story<ArrowUpRight size={16} /></Link>
      <Link href="/contact" onClick={closeMenu}>Contact<ArrowUpRight size={16} /></Link>
    </nav></div>}
    {children}
    <footer className="store-footer">
      <div className="footer-main">
        <div className="footer-brand"><BrandMark light /><p>Travel essentials for the places that move you.</p><a className="footer-whatsapp" href={getWhatsAppUrl("Hello PRINCE BENJA DESIGNS — I have a question.")} target="_blank" rel="noreferrer">Chat on WhatsApp <ArrowUpRight size={15} /></a></div>
        <div><h3>Explore</h3><Link href="/shop">Shop all</Link><Link href="/categories">Categories</Link><Link href="/new-arrivals">New arrivals</Link><Link href="/best-sellers">Best sellers</Link><Link href="/wholesale">Wholesale</Link></div>
        <div><h3>Help</h3><Link href="/contact">Contact us</Link><Link href="/track-order">Track an order</Link><Link href="/faq">FAQs</Link><Link href="/delivery-policy">Delivery information</Link><Link href="/returns">Returns &amp; refunds</Link></div>
        <div><h3>Find us</h3><Link href="/branches">Pipeline Stage, Nairobi</Link><a href={getWhatsAppUrl("Hello PRINCE BENJA DESIGNS — I would like to get in touch.")} target="_blank" rel="noreferrer">+254 768 524 870</a><a href="https://www.instagram.com/prince_benja_designs/" target="_blank" rel="noreferrer" aria-label="Instagram link; profile ownership is unverified">Instagram · unverified ↗</a><Link href="/about">Our story</Link></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} PRINCE BENJA DESIGNS</span><div><Link href="/privacy-policy">Privacy</Link><Link href="/terms">Terms</Link><span>Prices shown in KES</span></div></div>
      <div className="footer-demo-note">Illustrative catalogue content. Confirm current product availability, final price, delivery charge and payment arrangements with the store.</div>
    </footer>
  </div>;
}
