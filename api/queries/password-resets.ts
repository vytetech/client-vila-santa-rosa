import { getDb } from "./connection";
import { guestAccounts, guestSessions, passwordResets } from "@db/schema";
import { and, eq, gt } from "drizzle-orm";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Store a reset token for the e-mail (valid 1 h). */
export async function createPasswordReset(email: string, token: string) {
  await getDb().insert(passwordResets).values({
    email,
    token,
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
  });
}

/**
 * Apply a reset: validates the token, updates the account password,
 * invalidates all sessions of that account and burns the token.
 * Returns false when the token is unknown / expired / already used.
 */
export async function applyPasswordReset(token: string, newPasswordHash: string): Promise<boolean> {
  const db = getDb();
  const row = await db.query.passwordResets.findFirst({
    where: and(
      eq(passwordResets.token, token),
      eq(passwordResets.used, false),
      gt(passwordResets.expiresAt, new Date()),
    ),
  });
  if (!row) return false;
  const account = await db.query.guestAccounts.findFirst({
    where: eq(guestAccounts.email, row.email),
  });
  if (!account) return false;
  await db
    .update(guestAccounts)
    .set({ passwordHash: newPasswordHash })
    .where(eq(guestAccounts.id, account.id));
  await db.delete(guestSessions).where(eq(guestSessions.accountId, account.id));
  await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.id, row.id));
  return true;
}
