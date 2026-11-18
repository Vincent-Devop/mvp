# PRINCE BENJA DESIGNS — Travel & Retail Platform

React / Express / tRPC / Drizzle starter configured for Neon PostgreSQL.

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and prerendered `dist/public/` routes.
- `pnpm check` / `pnpm test`: TypeScript checks and application tests.
- `pnpm db:migrate`: apply the reviewed additive PostgreSQL migration files in `drizzle-neon/`.
- `pnpm exec drizzle-kit generate --config=drizzle.config.ts`: generate the next migration for review.
- `pnpm db:seed`: add missing illustrative catalogue records only. The current six categories have ten demo products apiece; the additive seed never overwrites operational products or stock.
- `NEON_DATABASE_URL` is the protected Neon connection value used by the application and migrations. Never print or commit it. The project also has an already-provisioned managed MySQL database; this application deliberately does not read or use its `DATABASE_URL`.

The current authentication uses Manus OAuth. The application session cookie is `webdev_app_session`; admin and POS APIs require an authenticated user with the `admin` role. The owner role is assigned only when the returned OAuth `openId` exactly matches the protected `OWNER_OPEN_ID`; never use an email address or name in its place. Public storefront routes and guest checkout do not require login.

The Neon schema stores business data, orders, pending payments, branch inventory, stock movements, audit events, receipts and POS register sessions. Checkout for operational products creates a pending order and stock reservation; it never treats an STK request, frontend response or customer screenshot as verified payment. A separate test-only flow persists an `isDemo` order and pending payment in Neon, without any gateway call, payment capture, paid status, stock reservation or stock movement. The POS currently completes verified cash transactions only; live M-Pesa and bank-provider verification, refunds, eTIMS and automated customer messages are not configured.

Seeded catalogue products and quantities are marked `isDemo`; their prices, dimensions and stock are illustrative. Sample products cannot be sold, adjusted or fulfilled as real transactions; test-order rows are excluded from verified sales metrics. Live sales analytics read only non-demo orders with verified payments and show an honest zero-data state when none exist; they do not estimate profit or invent transactions. Pipeline Stage is the only seeded confirmed branch. Add real products and physical stock before sale. Branch transfers, supplier procurement, full staff/branch role administration, advanced financial/profit reporting, delivery-provider workflows and downloadable/PDF/thermal receipt templates remain outside the current working release. Do not represent these functions or legal compliance as live.

`client/public/manus-routes.json` declares public page routes. Private personal and staff routes are noindex, dynamic product routes use Neon data, unknown product slugs return 404, and the application does not guess a canonical production origin or publish a domain-specific sitemap. The platform serves managed `/manus-storage/` assets; reference stable paths directly and never commit temporary signed URLs. Platform settings are managed through the Webdev tools, and private credentials stay outside frontend bundles.
