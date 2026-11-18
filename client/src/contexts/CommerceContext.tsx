import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoProducts } from "@shared/demoCatalog";

export type CartLine = {
  productId: number;
  variantId: number;
  slug: string;
  name: string;
  sku: string;
  price: number;
  image: string;
  quantity: number;
  isDemo: boolean;
};

type CommerceContextValue = {
  cart: CartLine[];
  wishlist: string[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  removeFromCart: (variantId: number) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  isWished: (slug: string) => boolean;
};

const CommerceContext = createContext<CommerceContextValue | null>(null);
const CART_KEY = "pb-designs-cart-v1";
const WISHLIST_KEY = "pb-designs-wishlist-v1";
const demoImageBySlug = new Map(demoProducts.map((product) => [product.slug, product.imageUrl] as const));

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(() => readStored<CartLine[]>(CART_KEY, []).map((line) => (
    line.isDemo ? { ...line, image: demoImageBySlug.get(line.slug) ?? "/images/product-placeholder.svg" } : line
  )));
  const [wishlist, setWishlist] = useState<string[]>(() => readStored<string[]>(WISHLIST_KEY, []));

  useEffect(() => {
    try { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* Storage can be unavailable in private mode. */ }
  }, [cart]);
  useEffect(() => {
    try { window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); } catch { /* Storage can be unavailable in private mode. */ }
  }, [wishlist]);

  const value = useMemo<CommerceContextValue>(() => ({
    cart,
    wishlist,
    cartCount: cart.reduce((sum, line) => sum + line.quantity, 0),
    cartSubtotal: cart.reduce((sum, line) => sum + line.price * line.quantity, 0),
    addToCart: (line, quantity = 1) => setCart((current) => {
      const found = current.find((item) => item.variantId === line.variantId);
      if (found) return current.map((item) => item.variantId === line.variantId ? { ...item, quantity: Math.min(20, item.quantity + quantity) } : item);
      return [...current, { ...line, quantity: Math.max(1, Math.min(20, quantity)) }];
    }),
    setQuantity: (variantId, quantity) => setCart((current) => quantity <= 0 ? current.filter((line) => line.variantId !== variantId) : current.map((line) => line.variantId === variantId ? { ...line, quantity: Math.min(20, quantity) } : line)),
    removeFromCart: (variantId) => setCart((current) => current.filter((line) => line.variantId !== variantId)),
    clearCart: () => setCart([]),
    toggleWishlist: (slug) => setWishlist((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]),
    isWished: (slug) => wishlist.includes(slug),
  }), [cart, wishlist]);

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useCommerce must be used inside CommerceProvider");
  return context;
}
