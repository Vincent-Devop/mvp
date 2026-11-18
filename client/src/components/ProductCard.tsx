import { ArrowUpRight, Heart, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useCommerce } from "@/contexts/CommerceContext";
import { formatKes } from "@/lib/format";
import { getProductImage, getWhatsAppUrl, type StoreProduct } from "@/lib/catalog";

export default function ProductCard({ product, compact = false }: { product: StoreProduct; compact?: boolean }) {
  const { addToCart, toggleWishlist, isWished } = useCommerce();
  const variant = product.variants[0];
  const wished = isWished(product.slug);
  const imageUrl = getProductImage(product);
  const add = () => {
    if (!variant || variant.id < 1) {
      window.open(getWhatsAppUrl(`Hello PRINCE BENJA DESIGNS — please confirm availability and current price for ${product.name}.`), "_blank", "noopener,noreferrer");
      return;
    }
    addToCart({ productId: product.id, variantId: variant.id, slug: product.slug, name: product.name, sku: variant.sku, price: variant.retailPrice, image: imageUrl, isDemo: product.isDemo });
    toast.success(product.isDemo ? `${product.name} added to your test bag` : `${product.name} added to your bag`);
  };
  return <article className={`product-card${compact ? " product-card-compact" : ""}`}>
    <div className="product-card-image-wrap">
      <Link href={`/products/${product.slug}`} className="product-card-image-link" aria-label={`View ${product.name}`}>
        <img className="product-card-image" src={imageUrl} alt={product.name} loading="lazy" />
      </Link>
      <div className="product-card-badges">
        {product.isNew && <span className="product-badge badge-new">New in</span>}
        {!product.isNew && product.isBestseller && <span className="product-badge">Bestseller</span>}
        {product.compareAtPrice && product.compareAtPrice > product.retailPrice && <span className="product-badge badge-sale">Offer</span>}
      </div>
      <button className={`wishlist-button${wished ? " is-wished" : ""}`} aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} onClick={() => { toggleWishlist(product.slug); toast(wished ? "Removed from wishlist" : "Saved to wishlist"); }}><Heart size={17} fill={wished ? "currentColor" : "none"} /></button>
      <button className="quick-add-button" onClick={add} aria-label={product.isDemo ? `Add sample ${product.name} to test bag` : `Add ${product.name} to bag`}><ShoppingBag size={16} /><span>{product.isDemo ? "Add sample" : variant?.id ? "Add to bag" : "Ask about it"}</span></button>
    </div>
    <div className="product-card-info">
      <div className="product-card-topline"><span>{product.categoryName || "Travel essential"}</span>{product.isDemo && <span className="demo-product-label">Sample</span>}</div>
      <Link href={`/products/${product.slug}`} className="product-card-name">{product.name}</Link>
      <div className="product-card-price"><strong>{formatKes(variant?.retailPrice ?? product.retailPrice)}</strong>{product.compareAtPrice && product.compareAtPrice > product.retailPrice && <del>{formatKes(product.compareAtPrice)}</del>}</div>
      <div className="product-card-stock">{product.isDemo ? "Illustrative sample" : product.available > 0 ? "Available to enquire" : "Ask us about availability"}</div>
      <Link className="product-card-detail" href={`/products/${product.slug}`}>Discover <ArrowUpRight size={14} /></Link>
    </div>
  </article>;
}
