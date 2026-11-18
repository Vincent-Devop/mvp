import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import { listCatalog } from "../commerce";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    // Keep the file-serving limits of vite.config.ts; only the options above differ here.
    server: { ...viteConfig.server, ...serverOptions },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(import.meta.dirname, "../..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

function productHtml(template: string, product: NonNullable<Awaited<ReturnType<typeof listCatalog>>[number]>) {
  const title = `${product.name} | PRINCE BENJA DESIGNS`;
  const description = `${product.name}: ${product.description.slice(0, 62)} Confirm current price and availability with PRINCE BENJA DESIGNS.`.slice(0, 158);
  const body = `<main class="seo-page"><header><p>PRINCE BENJA DESIGNS · ${product.isDemo ? "ILLUSTRATIVE CATALOGUE PREVIEW" : "TRAVEL ESSENTIALS · NAIROBI"}</p><h1>${escapeHtml(product.name)}</h1></header><h2>Product details</h2><p>${escapeHtml(product.description)}</p><p>${escapeHtml(product.material || "Please contact the store for material and specification details.")}</p><p>${product.isDemo ? "This is illustrative product content. The price and stock are not verified." : `Current catalogue price: ${new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(product.retailPrice / 100)}. Please confirm current variant and branch availability with the store.`}</p><nav><a href="/shop">Browse the travel collection</a><a href="/contact">Confirm details with the team</a></nav></main>`;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  let html = template
    .replace(/<title>[^<]*<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${safeDescription}" />`)
    .replace(/<meta\s+property="og:type"[^>]*>/i, `<meta property="og:type" content="product" />`)
    .replace(/<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${safeTitle}" />`)
    .replace(/<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${safeDescription}" />`)
    .replace(/<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${safeTitle}" />`)
    .replace(/<meta\s+name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${safeDescription}" />`)
    .replace(/<meta\s+name="robots"[^>]*>/i, "")
    .replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${body}</div>`);
  if (product.isDemo) html = html.replace("</head>", `<meta name="robots" content="noindex, nofollow" />\n  </head>`);
  return html;
}

export function serveStatic(app: Express) {
  const distPath = process.env.NODE_ENV === "development"
    ? path.resolve(import.meta.dirname, "../..", "dist", "public")
    : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) console.error(`Could not find the build directory: ${distPath}, make sure to build the client first`);

  app.use(express.static(distPath));

  app.get(/^\/products\/([^/]+)\/?$/, async (req, res, next) => {
    try {
      const slug = String(req.params[0] ?? "");
      const [product] = await listCatalog({ slug, limit: 1 });
      if (!product) return res.status(404).sendFile(path.resolve(distPath, "404.html"));
      const template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf8");
      return res.status(200).type("html").send(productHtml(template, product));
    } catch (error) {
      return next(error);
    }
  });

  app.get("/404", (_req, res) => res.status(404).sendFile(path.resolve(distPath, "404.html")));

  app.use("*", (req, res) => {
    const pathname = new URL(req.originalUrl, "http://local.invalid").pathname.replace(/\/$/, "") || "/";
    const noindexPages = ["/cart", "/checkout", "/compare", "/track-order", "/wishlist", "/admin", "/admin/preview", "/pos", "/pos/preview"];
    if (noindexPages.includes(pathname) || pathname === "/account" || pathname.startsWith("/account/") || pathname.startsWith("/order-confirmation/")) {
      return res.status(200).sendFile(path.resolve(distPath, "account", "index.html"));
    }
    return res.status(404).sendFile(path.resolve(distPath, "404.html"));
  });
}
