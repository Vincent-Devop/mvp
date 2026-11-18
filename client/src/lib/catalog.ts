import { demoProducts } from "@shared/demoCatalog";

export type StoreVariant = {
  id: number;
  sku: string;
  color: string | null;
  size: string | null;
  retailPrice: number;
  availability: { branchId: number; branchName: string; available: number }[];
};

export type StoreProduct = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  material: string | null;
  retailPrice: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  isFeatured: boolean;
  isBestseller: boolean;
  isNew: boolean;
  isDemo: boolean;
  categoryName: string | null;
  categorySlug: string | null;
  variants: StoreVariant[];
  available: number;
};

export const fallbackProducts: StoreProduct[] = demoProducts.map((product, index) => ({
  id: 0,
  name: product.name,
  slug: product.slug,
  sku: product.sku,
  description: product.description,
  material: product.material,
  retailPrice: product.retailPrice,
  compareAtPrice: product.compareAtPrice,
  imageUrl: product.imageUrl,
  isFeatured: product.isFeatured,
  isBestseller: product.isBestseller,
  isNew: product.isNew,
  isDemo: true,
  categoryName: product.categorySlug.replace(/-/g, " "),
  categorySlug: product.categorySlug,
  variants: [{ id: 0, sku: `${product.sku}-DEFAULT`, color: product.color, size: product.size, retailPrice: product.retailPrice, availability: [{ branchId: 0, branchName: "Pipeline Stage (sample)", available: product.stock + index * 0 }] }],
  available: product.stock,
}));

export function getProductImage(product: Pick<StoreProduct, "imageUrl">) {
  return product.imageUrl || "/images/brand-placeholder.svg";
}

export function getWhatsAppUrl(message: string) {
  return `https://wa.me/254768524870?text=${encodeURIComponent(message)}`;
}
