import { useEffect, useState, type FormEvent } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, Globe2, MapPin, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import StorefrontLayout from "@/components/StorefrontLayout";
import ProductCard from "@/components/ProductCard";
import { fallbackProducts } from "@/lib/catalog";
import { setPageMeta } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { getWhatsAppUrl } from "@/lib/catalog";
import { PB_LOGO_SRC } from "@/lib/brand";

const categoryTiles = [
  { title: "Suitcases & trolleys", kicker: "Make room for the journey", href: "/categories/suitcases", slug: "suitcases", image: "/images/suitcases-01.webp" },
  { title: "Travel duffels", kicker: "The easy getaway", href: "/categories/duffel-bags", slug: "duffel-bags", image: "/images/duffel-bags-17.webp" },
  { title: "Travel backpacks", kicker: "Everyday, taken further", href: "/categories/backpacks", slug: "backpacks", image: "/images/backpacks-25.webp" },
  { title: "Travel accessories", kicker: "The little things, considered", href: "/categories/travel-accessories", slug: "travel-accessories", image: "/images/travel-accessories-49.webp" },
];

export default function Home() {
  const catalog = trpc.catalog.list.useQuery({ limit: 8, sort: "popular" }, { retry: false, refetchOnWindowFocus: false });
  const subscribe = trpc.marketing.subscribe.useMutation();
  const [email, setEmail] = useState("");
  const [consented, setConsented] = useState(false);
  useEffect(() => setPageMeta("PRINCE BENJA DESIGNS | Travel well. Go further.", "Considered travel essentials for Kenyan travellers. Explore luggage, travel bags and everyday carry by PRINCE BENJA DESIGNS."), []);

  const products = (catalog.data?.length ? catalog.data : fallbackProducts) as typeof fallbackProducts[number][];
  const featured = products.filter((product) => product.isFeatured || product.isBestseller).slice(0, 4);
  const subscribeNow = async (event: FormEvent) => {
    event.preventDefault();
    if (!consented) { toast.error("Please agree to receive occasional email updates."); return; }
    try {
      await subscribe.mutateAsync({ email, consent: true });
      toast.success("You’re on the list. Thank you.");
      setEmail("");
      setConsented(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not save that address. Try again or contact us on WhatsApp.");
    }
  };

  return <StorefrontLayout>
    <main>
      <section className="hero-editorial">
        <div className="hero-image"><img src="/images/suitcases-02.webp" alt="Travel bags set beside a light-filled lodge terrace" /></div>
        <div className="hero-overlay" />
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow"><span /> Nairobi · Made for the move</div>
          <h1>Travel well.<br /><em>Go further.</em></h1>
          <p>Considered bags and travel essentials for wherever you’re headed next.</p>
          <div className="hero-actions"><Link href="/shop" className="button-primary">Shop the collection <ArrowRight size={16} /></Link><Link href="/about" className="button-quiet">Our story <ArrowUpRight size={15} /></Link></div>
          <div className="hero-note"><span className="hero-note-line" /><span>Thoughtful things for the road ahead</span></div>
        </div>
        <div className="hero-index"><span>01</span><span className="hero-index-rule" /><span>04</span></div>
        <a className="hero-scroll" href="#collections"><ArrowDownRight size={16} /> Scroll to explore</a>
      </section>

      <section className="demo-disclosure" role="note"><span className="demo-disclosure-dot" /><p><strong>Catalogue preview</strong> — sample products, prices and stock are illustrative. Please confirm current availability and your delivery quote with our team.</p><a href={getWhatsAppUrl("Hello PRINCE BENJA DESIGNS — please confirm current product availability, price and delivery cost.")} target="_blank" rel="noreferrer">Ask us <ArrowUpRight size={13} /></a></section>

      <section className="section-pad collections-section" id="collections">
        <div className="section-heading"><div><span className="eyebrow">Find your way</span><h2>Carry what<br /><em>moves you.</em></h2></div><p>From a quick overnight to a long-planned escape, start with the pieces that fit your way of going.</p></div>
        <div className="collection-grid">{categoryTiles.map((item, index) => <Link className={`collection-tile collection-tile-${index + 1}`} href={item.href} key={item.slug}><img src={item.image} alt="" loading="lazy" /><span className="collection-shade" /><span className="collection-index">0{index + 1}</span><span className="collection-meta"><small>{item.kicker}</small><strong>{item.title}</strong></span><span className="collection-arrow"><ArrowUpRight size={18} /></span></Link>)}</div>
        <Link href="/categories" className="text-link collection-more">Explore every category <ArrowRight size={15} /></Link>
      </section>

      <section className="featured-section section-pad">
        <div className="section-heading featured-heading"><div><span className="eyebrow">Thoughtfully selected</span><h2>Pieces for<br /><em>the long way.</em></h2></div><Link href="/shop" className="button-outline">View all pieces <ArrowRight size={16} /></Link></div>
        <div className="demo-strip"><Sparkles size={14} /><span>Illustrative catalogue · prices and stock require confirmation</span></div>
        <div className="product-grid">{featured.length ? featured.map((product) => <ProductCard key={product.slug} product={product} />) : fallbackProducts.slice(0, 4).map((product) => <ProductCard key={product.slug} product={product} />)}</div>
        <div className="centered-cta"><Link href="/shop" className="button-primary button-dark">Discover the collection <ArrowRight size={16} /></Link></div>
      </section>

      <section className="editorial-split">
        <div className="editorial-image"><img src="/images/duffel-bags-17.webp" alt="A cognac weekender bag styled in warm natural light" loading="lazy" /><span className="editorial-image-caption">A little room for the unexpected</span></div>
        <div className="editorial-copy"><span className="eyebrow">Made for your next move</span><h2>Less about<br />the luggage.<br /><em>More about where.</em></h2><p>Good travel gear earns its place. We bring together considered silhouettes and dependable everyday utility, ready for the plans you make and the ones that find you.</p><Link href="/about" className="text-link">The PRINCE BENJA story <ArrowRight size={15} /></Link><div className="editorial-stamp"><img src={PB_LOGO_SRC} alt=""/><small>GO WELL.<br />COME BACK<br />WITH STORIES.</small></div></div>
      </section>

      <section className="service-ribbon"><div><ShieldCheck size={21} /><span><strong>Thoughtful selection</strong><small>Useful pieces for real journeys</small></span></div><div><Globe2 size={21} /><span><strong>Here in Kenya</strong><small>Connect with our local team</small></span></div><div><MessageCircle size={21} /><span><strong>Need a hand?</strong><small>We’re a WhatsApp away</small></span></div></section>

      <section className="visit-callout section-pad"><div className="visit-copy"><span className="eyebrow">Come say hello</span><h2>Visit us in<br /><em>Pipeline Stage.</em></h2><p>Find our confirmed Nairobi branch adjacent to Think Twice. Reach out before visiting to confirm opening hours and today’s assortment.</p><Link href="/branches" className="text-link">Branch details <ArrowRight size={15} /></Link></div><div className="visit-card"><div className="visit-card-top"><MapPin size={17} /><span>ONE CONFIRMED LOCATION</span></div><strong>Pipeline Stage</strong><span>Adjacent to Think Twice<br />Nairobi, Kenya</span><a href="https://maps.google.com/?q=Pipeline+Stage+Nairobi" target="_blank" rel="noreferrer">Open map <ArrowUpRight size={14} /></a><span className="visit-note">Please confirm current operating hours with the team.</span></div></section>

      <section className="newsletter-section"><div className="newsletter-mark"><img src={PB_LOGO_SRC} alt=""/><Check size={16} /></div><div className="newsletter-copy"><span className="eyebrow">The road ahead</span><h2>Notes for the<br /><em>next journey.</em></h2><p>Occasional new arrivals, travel ideas and thoughtful picks. No noise.</p></div><form className="newsletter-form" onSubmit={subscribeNow}><label htmlFor="newsletter-email">Your email address</label><div className="newsletter-input"><input id="newsletter-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /><button type="submit" disabled={subscribe.isPending}>{subscribe.isPending ? "Joining…" : "Join the list"}<ArrowRight size={15} /></button></div><label className="consent-check"><input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} /><span>I agree to receive occasional updates. See our <Link href="/privacy-policy">privacy policy</Link>.</span></label></form></section>
    </main>
  </StorefrontLayout>;
}
