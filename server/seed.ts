import { and, eq } from "drizzle-orm";
import { demoBranch, demoCategories, demoProducts } from "../shared/demoCatalog";
import { branches, categories, inventoryBalances, productImages, productVariants, products } from "../drizzle/schema";
import { closeDb, getDb } from "./db";

async function seed() {
  const db = await getDb();
  if (!db) throw new Error("Neon connection is not configured");

  await db.insert(branches).values({
    code: demoBranch.code,
    name: demoBranch.name,
    address: demoBranch.address,
    phone: demoBranch.phone,
    city: "Nairobi",
    isActive: true,
    isConfirmed: true,
  }).onConflictDoNothing({ target: branches.code });
  const [branch] = await db.select().from(branches).where(eq(branches.code, demoBranch.code)).limit(1);
  if (!branch) throw new Error("Could not prepare the confirmed Pipeline branch");

  for (const [index, category] of demoCategories.entries()) {
    await db.insert(categories).values({ ...category, sortOrder: index }).onConflictDoNothing({ target: categories.slug });
  }

  for (const demo of demoProducts) {
    const [category] = await db.select().from(categories).where(eq(categories.slug, demo.categorySlug)).limit(1);
    if (!category) continue;
    await db.insert(products).values({
      name: demo.name,
      slug: demo.slug,
      sku: demo.sku,
      categoryId: category.id,
      description: demo.description,
      material: demo.material,
      retailPrice: demo.retailPrice,
      compareAtPrice: demo.compareAtPrice,
      imageUrl: demo.imageUrl,
      isFeatured: demo.isFeatured,
      isBestseller: demo.isBestseller,
      isNew: demo.isNew,
      isDemo: true,
      isActive: true,
    }).onConflictDoNothing({ target: products.slug });
    const [product] = await db.select().from(products).where(eq(products.slug, demo.slug)).limit(1);
    if (!product || !product.isDemo) continue;
    await db.update(products).set({
      isFeatured: demo.isFeatured,
      isBestseller: false,
      isNew: false,
      compareAtPrice: null,
      updatedAt: new Date(),
    }).where(and(eq(products.id, product.id), eq(products.isDemo, true)));
    const [existingImage] = await db.select({ id: productImages.id }).from(productImages)
      .where(and(eq(productImages.productId, product.id), eq(productImages.url, demo.imageUrl))).limit(1);
    if (!existingImage) {
      await db.insert(productImages).values({
        productId: product.id,
        url: demo.imageUrl,
        alt: `${demo.name} — illustrative sample travel product imagery`,
        sortOrder: 0,
      });
    }
    await db.insert(productVariants).values({
      productId: product.id,
      sku: `${demo.sku}-DEFAULT`,
      color: demo.color,
      size: demo.size,
      retailPrice: demo.retailPrice,
      isActive: true,
    }).onConflictDoNothing({ target: productVariants.sku });
    const [variant] = await db.select().from(productVariants)
      .where(and(eq(productVariants.sku, `${demo.sku}-DEFAULT`), eq(productVariants.productId, product.id))).limit(1);
    if (!variant) continue;
    await db.insert(inventoryBalances).values({
      variantId: variant.id,
      branchId: branch.id,
      onHand: demo.stock,
      reserved: 0,
      damaged: 0,
      inTransit: 0,
    }).onConflictDoNothing({ target: [inventoryBalances.variantId, inventoryBalances.branchId] });
  }
  console.log(`${demoProducts.length} illustrative sample catalogue products are ready across ${demoCategories.length} categories; no real sales, payment or customer records were created.`);
}

seed().catch((error) => {
  console.error("Demo seed failed. Check Neon connectivity and migration status; connection details are redacted.", error instanceof Error ? error.name : "unknown error");
  process.exitCode = 1;
}).finally(async () => {
  await closeDb();
});
