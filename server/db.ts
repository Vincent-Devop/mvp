import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let sqlClient: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

/** Connect exclusively to the explicitly configured Neon URL. */
export async function getDb() {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!_db && connectionString) {
    sqlClient = postgres(connectionString, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    _db = drizzle(sqlClient);
  }
  return _db;
}

export async function closeDb() {
  if (sqlClient) {
    await sqlClient.end({ timeout: 5 });
    sqlClient = null;
    _db = null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Neon database is not available");

  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
    lastSignedIn: user.lastSignedIn ?? new Date(),
    updatedAt: new Date(),
  };

  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: {
      name: values.name,
      email: values.email,
      loginMethod: values.loginMethod,
      role: values.role,
      lastSignedIn: values.lastSignedIn,
      updatedAt: new Date(),
    },
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
