import { defineConfig } from "drizzle-kit";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  throw new Error("NEON_DATABASE_URL is required to run Neon PostgreSQL migrations");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle-neon",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
