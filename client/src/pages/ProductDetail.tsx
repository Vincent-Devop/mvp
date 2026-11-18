import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Heart, MapPin, MessageCircle, PackageCheck, ShieldCheck } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import StorefrontLayout from "@/components/StorefrontLayout";
import ProductCard from "@/components/ProductCard";
import { useCommerce } from "@/contexts/CommerceContext";
import { fallbackProducts, getProductImage, getWhatsAppUrl } from "@/lib/catalog";
import { formatKes, setPageMeta } from "@/lib/format";
import { trpc } from "@/lib/trpc";

export default function ProductDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const result = trpc.catalog.bySlug.useQuery({ slug }, { retry: false });
  const product = result.data ?? fallbackProducts.find((item) => item.slug === slug);
  const imageResult = trpc.catalog.images.useQuery({ productId: product?.id ?? 0 }, { enabled: Boolean(product && product.id > 0), retry: false });
  const [variantId, setVariantId] = useState<number | null>(null);
  const { addToCart, toggleWishlist, isWished } = useCommerce();

  useEffect(() => {
    setVariantId(product?.variants[0]?.id ?? null);
    if (product) setPageMeta(`${product.name} | PRINCE BENJA DESIGNS`, `${product.name}: considered travel gear from PRINCE BENJA DESIGNS. Catalogue details, price and stock shown are illustrative until confirmed by our team.`);
  }, [product?.slug]);

  if (!product) return <StorefrontLayout><main className="product-missing"><span className="eyebrow">Page not found</span><h1>This piece has moved.</h1><Link href="/shop" className="text-link"><ArrowLeft size={15} /> Back to the collection</Link></main></StorefrontLayout>;
  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  const image = getProductImage(product);
  const productImages = [image, ...(imageResult.data?.map((item) => item.url).filter((url) => url !== image) ?? [])];
  const price = variant?.retailPrice ?? product.retailPrice;
  const whatsappUrl = getWhatsAppUrl(`Hello PRINCE BENJA DESIGNS — could you confirm current availability, dimensions, warranty, price and delivery cost for ${product.name}?`);
  const add = () => {
    if (!variant || variant.id < 1) { window.open(whatsappUrl, "_blank", "noopener,noreferrer"); return; }
    addToCart({ productId: product.id, variantId: variant.id, slug: product.slug, name: product.name, sku: variant.sku, price, image, isDemo: product.isDemo });
    toast.success(product.isDemo ? "Sample added to your test bag" : "Added to your bag");
  };
  const related = fallbackProducts.filter((item) => item.slug !== product.slug).slice(0, 3);

  return <StorefrontLayout><main className="pdp-page">
    <div className="shop-breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/shop">Shop</Link><span>/</span><span>{product.name}</span></div>
    {product.isDemo && <div className="shop-demo-notice"><span>ILLUSTRATIVE CATALOGUE</span><p>Sample product details, stock and prices require confirmation before purchase.</p></div>}
    <div className="pdp-main"><section className="pdp-gallery"><div className="pdp-main-image"><img src={productImages[0]} alt={product.name} /></div>{productImages.length > 1 && <div className="pdp-image-grid">{productImages.slice(1, 3).map((src, index) => <img key={`${src}-${index}`} src={src} alt={`${product.name} view ${index + 2}`} loading="lazy" />)}</div>}</section>
      <section className="pdp-info"><span className="eyebrow">{product.categoryName || "Travel essential"} · {product.sku}</span><h1>{product.name}</h1><p className="pdp-description">{product.description}</p><div className="pdp-price"><strong>{formatKes(price)}</strong>{product.compareAtPrice && product.compareAtPrice > price && <del>{formatKes(product.compareAtPrice)}</del>}<small>Indicative sample price</small></div>
        {product.variants.length > 0 && <div className="variant-picker"><span>Choose your style</span><div className="variant-list">{product.variants.map((item) => <button key={item.id} className={variantId === item.id ? "variant-option selected" : "variant-option"} onClick={() => setVariantId(item.id)}><strong>{item.color || "Standard"}</strong><small>{item.size || "One size"}</small></button>)}</div></div>}
        {product.material && <div className="pdp-spec"><span>Material</span><strong>{product.material}</strong></div>}
        {variant && <div className="pdp-spec"><span>Availability</span><strong>{product.isDemo ? "Illustrative only — please confirm" : product.available > 0 ? "Contact us to confirm" : "Please enquire"}</strong></div>}
        <div className="pdp-actions"><button className="button-primary button-dark" onClick={add}>{product.isDemo ? "Add sample to test bag" : variant?.id ? "Add to bag" : "Ask about this piece"}<ArrowRight size={16} /></button><button className={`pdp-wishlist${isWished(product.slug) ? " wished" : ""}`} aria-label="Save to wishlist" onClick={() => { toggleWishlist(product.slug); toast(isWished(product.slug) ? "Removed from wishlist" : "Saved to wishlist"); }}><Heart size={19} fill={isWished(product.slug) ? "currentColor" : "none"} /></button></div>
        <a className="pdp-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Ask us about this product on WhatsApp <ArrowRight size={14} /></a>
        <div className="pdp-assurance"><div><PackageCheck size={17} /><span><strong>Delivery or collection</strong><small>Final delivery quote confirmed by our team.</small></span></div><div><MapPin size={17} /><span><strong>Pipeline Stage, Nairobi</strong><small>Our only confirmed location.</small></span></div><div><ShieldCheck size={17} /><span><strong>Product details</strong><small>Ask us to confirm size, warranty and care.</small></span></div></div>
        <details className="pdp-details"><summary>Details &amp; care</summary><p>{product.description} Please contact us for dimensions, weight, warranty terms and specific care guidance before ordering.</p></details><details className="pdp-details"><summary>Reviews</summary><p>Verified customer reviews have not yet been supplied. We do not publish sample or invented reviews.</p></details>
      </section>
    </div>
    <section className="related-section"><div className="section-heading"><div><span className="eyebrow">Keep exploring</span><h2>A few more<br /><em>good companions.</em></h2></div><Link href="/shop" className="text-link">See all pieces <ArrowRight size={15} /></Link></div><div className="product-grid">{related.map((item) => <ProductCard key={item.slug} product={item} />)}</div></section>
  </main></StorefrontLayout>;
}
