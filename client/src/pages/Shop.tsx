import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowDownWideNarrow, ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import StorefrontLayout from "@/components/StorefrontLayout";
import ProductCard from "@/components/ProductCard";
import { fallbackProducts, type StoreProduct } from "@/lib/catalog";
import { setPageMeta } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { demoCategories } from "@shared/demoCatalog";

export default function Shop() {
  const [, setLocation] = useLocation();
  const path = window.location.pathname;
  const categorySlug = path.startsWith("/categories/") ? path.split("/")[2] : undefined;
  const initialQuery = new URLSearchParams(window.location.search).get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc" | "popular">("popular");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState("all");
  const category = categorySlug || undefined;
  const collection = path === "/new-arrivals" ? "new" : path === "/best-sellers" ? "popular" : path === "/offers" ? "offers" : undefined;
  const result = trpc.catalog.list.useQuery({ q: initialQuery || undefined, category, sort, maxPrice: maxPrice === "all" ? undefined : Number(maxPrice) * 100, limit: 80 }, { retry: false, refetchOnWindowFocus: false });
  const products = (result.data?.length ? result.data : fallbackProducts) as StoreProduct[];
  const categoriesQuery = trpc.catalog.categories.useQuery(undefined, { retry: false });
  const categories = categoriesQuery.data?.length ? categoriesQuery.data : demoCategories;
  const visible = useMemo(() => products.filter((item) => {
    const matchesQuery = !initialQuery || `${item.name} ${item.sku} ${item.description}`.toLowerCase().includes(initialQuery.toLowerCase());
    const matchesCategory = !category || item.categorySlug === category;
    const matchesPrice = maxPrice === "all" || item.retailPrice <= Number(maxPrice) * 100;
    const matchesCollection = !collection || collection === "new" ? (!collection || item.isNew) : collection === "popular" ? item.isBestseller : Boolean(item.compareAtPrice && item.compareAtPrice > item.retailPrice);
    return matchesQuery && matchesCategory && matchesPrice && matchesCollection;
  }), [products, initialQuery, category, maxPrice, collection]);
  const title = category ? category.replace(/-/g, " & ") : collection === "new" ? "New arrivals" : collection === "popular" ? "Best sellers" : collection === "offers" ? "Current offers" : initialQuery ? "Find your next essential." : "Find your way.";
  useEffect(() => setPageMeta(`${title} | PRINCE BENJA DESIGNS`, "Discover travel bags, luggage, duffels and everyday carry from PRINCE BENJA DESIGNS."), [title]);
  const submitSearch = (event: FormEvent) => { event.preventDefault(); const q = query.trim(); setLocation(q ? `/search?q=${encodeURIComponent(q)}` : "/shop"); };
  const clearFilters = () => { setQuery(""); setMaxPrice("all"); setLocation("/shop"); };

  return <StorefrontLayout><main className="shop-page">
    <div className="shop-breadcrumb"><Link href="/">Home</Link><span>/</span><span>{title}</span></div>
    <section className="shop-hero"><div><span className="eyebrow">The travel collection</span><h1>{title}</h1><p>Considered pieces for the journey ahead. Browse the catalogue and message our team to confirm current details.</p></div><div className="shop-hero-count"><span>{visible.length.toString().padStart(2, "0")}</span><small>{visible.some((item) => item.isDemo) ? "sample styles" : "styles"}<br/>to explore</small></div></section>
    <div className="shop-demo-notice"><span>DEMO CATALOGUE</span><p>Sample prices and stock are illustrative and not a live availability promise.</p></div>
    <form className="shop-search" onSubmit={submitSearch}><Search size={18}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search by product or keyword" aria-label="Search by product or keyword"/><button type="submit">Search <ArrowRight size={15}/></button></form>
    <div className="shop-toolbar"><div className="shop-categories"><Link href="/shop" className={!category ? "selected" : ""}>All pieces</Link>{categories.map((item)=><Link href={`/categories/${item.slug}`} key={item.slug} className={category===item.slug ? "selected" : ""}>{item.name}</Link>)}</div><button className="filter-mobile-toggle" onClick={()=>setMobileFilters((open)=>!open)}><SlidersHorizontal size={16}/> Filter &amp; sort</button><label className="shop-sort"><ArrowDownWideNarrow size={15}/><span>Sort</span><select value={sort} onChange={(event)=>setSort(event.target.value as typeof sort)}><option value="popular">Popular</option><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label></div>
    <div className={`shop-content${mobileFilters ? " filters-open" : ""}`}><aside className="shop-filter-panel"><div className="filter-head"><strong>Refine</strong><button onClick={clearFilters}>Clear all <X size={13}/></button></div><div className="filter-group"><span>Category</span>{categories.map((item)=><Link key={item.slug} href={`/categories/${item.slug}`} className={category===item.slug ? "filter-selected" : ""}>{item.name}<ArrowRight size={13}/></Link>)}</div><div className="filter-group"><label htmlFor="price-filter">Maximum price</label><select id="price-filter" value={maxPrice} onChange={(event)=>setMaxPrice(event.target.value)}><option value="all">Any price</option><option value="2000">Up to KES 2,000</option><option value="4000">Up to KES 4,000</option><option value="7000">Up to KES 7,000</option></select></div><div className="filter-help"><span>Need help choosing?</span><Link href="/faq">See luggage size guide <ArrowRight size={13}/></Link></div></aside>
      <div className="shop-results"><div className="results-title"><span>{initialQuery ? <>Results for <strong>“{initialQuery}”</strong></> : category ? "Selected pieces" : "Current styles"}</span><span>{visible.length} items</span></div>{visible.length ? <div className="product-grid shop-product-grid">{visible.map((product)=><ProductCard key={product.slug} product={product}/>)}</div> : <div className="empty-results"><span>Nothing found just yet.</span><p>Try another search or ask our team about the piece you have in mind.</p><button onClick={clearFilters}>Clear filters</button></div>}<div className="catalog-help"><span>Looking for something specific?</span><a href="https://wa.me/254768524870?text=Hello%20PRINCE%20BENJA%20DESIGNS%20%E2%80%94%20I%27m%20looking%20for%20a%20travel%20bag." target="_blank" rel="noreferrer">Ask us on WhatsApp <ArrowRight size={14}/></a></div></div></div>
  </main></StorefrontLayout>;
}
