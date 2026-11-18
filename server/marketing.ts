import { TRPCError } from "@trpc/server";
import { newsletterSubscribers } from "../drizzle/schema";
import { getDb } from "./db";

export async function subscribeToNewsletter(input: { email: string; consent: true }) {
  if (input.consent !== true) throw new TRPCError({ code: "BAD_REQUEST", message: "Consent is required to subscribe." });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Email sign-up is not connected." });
  const normalizedEmail = input.email.trim().toLowerCase();
  await db.insert(newsletterSubscribers).values({
    email: normalizedEmail,
    consentAt: new Date(),
    source: "website",
  }).onConflictDoNothing({ target: newsletterSubscribers.email });
  return { success: true } as const;
}
