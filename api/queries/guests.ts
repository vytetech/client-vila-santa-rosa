import { getDb } from "./connection";
import { guestAccounts, guestSessions } from "@db/schema";
import { and, eq, gt, ne } from "drizzle-orm";
import { newReferralCode, newSessionToken } from "../utils";

export async function findAccountByUsername(username: string) {
  return getDb().query.guestAccounts.findFirst({
    where: eq(guestAccounts.username, username),
  });
}

export async function findAccountByEmail(email: string) {
  return getDb().query.guestAccounts.findFirst({
    where: eq(guestAccounts.email, email.toLowerCase()),
  });
}

/** Login accepts username OR e-mail. */
export async function findAccountByLogin(login: string) {
  const db = getDb();
  const byUsername = await db.query.guestAccounts.findFirst({
    where: eq(guestAccounts.username, login),
  });
  if (byUsername) return byUsername;
  if (login.includes("@")) {
    return db.query.guestAccounts.findFirst({
      where: eq(guestAccounts.email, login),
    });
  }
  return undefined;
}

export async function findAccountById(id: number) {
  return getDb().query.guestAccounts.findFirst({
    where: eq(guestAccounts.id, id),
  });
}

export async function findAccountByReferralCode(code: string) {
  return getDb().query.guestAccounts.findFirst({
    where: eq(guestAccounts.referralCode, code),
  });
}

export async function createAccount(data: {
  username: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  email?: string;
  age: number;
  referredByCode?: string;
  gender?: "male" | "female" | "other";
  hasPet?: boolean;
  petName?: string;
  petBreed?: string;
  petAge?: number;
}) {
  const db = getDb();
  const referralCode = newReferralCode(data.fullName);
  const [{ id }] = await db
    .insert(guestAccounts)
    .values({ ...data, referralCode })
    .$returningId();
  return findAccountById(id);
}

export async function createSession(accountId: number) {
  const db = getDb();
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(guestSessions).values({ token, accountId, expiresAt });
  return { token, expiresAt };
}

export async function deleteSession(token: string) {
  await getDb().delete(guestSessions).where(eq(guestSessions.token, token));
}

export async function findGuestByToken(token: string) {
  const db = getDb();
  const session = await db.query.guestSessions.findFirst({
    where: and(
      eq(guestSessions.token, token),
      gt(guestSessions.expiresAt, new Date()),
    ),
  });
  if (!session) return undefined;
  const account = await findAccountById(session.accountId);
  if (!account?.isActive) {
    await db.delete(guestSessions).where(eq(guestSessions.token, token));
    return undefined;
  }
  return account;
}

export async function listAccounts() {
  return getDb().query.guestAccounts.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}

export async function grantLifetimeDiscount(accountId: number) {
  await getDb()
    .update(guestAccounts)
    .set({ hasLifetimeDiscount: true })
    .where(eq(guestAccounts.id, accountId));
}

export type ManagedAccountInput = {
  username: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  email?: string | null;
  age?: number;
  role: "user" | "admin";
  isActive?: boolean;
};

export async function createManagedAccount(data: ManagedAccountInput) {
  const referralCode = newReferralCode(data.fullName);
  const [{ id }] = await getDb()
    .insert(guestAccounts)
    .values({
      username: data.username,
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      phone: data.phone || "",
      email: data.email || null,
      age: data.age ?? 18,
      referralCode,
      role: data.role,
      isActive: data.isActive ?? true,
    })
    .$returningId();
  return findAccountById(id);
}

export async function updateManagedAccount(
  id: number,
  data: {
    username?: string;
    fullName?: string;
    email?: string | null;
    role?: "user" | "admin";
    isActive?: boolean;
  },
) {
  await getDb().update(guestAccounts).set(data).where(eq(guestAccounts.id, id));
  return findAccountById(id);
}

export async function updateManagedAccountPassword(id: number, passwordHash: string) {
  await getDb().update(guestAccounts).set({ passwordHash }).where(eq(guestAccounts.id, id));
  await getDb().delete(guestSessions).where(eq(guestSessions.accountId, id));
}

export async function deleteManagedAccount(id: number) {
  await getDb().delete(guestSessions).where(eq(guestSessions.accountId, id));
  await getDb().delete(guestAccounts).where(eq(guestAccounts.id, id));
}

export async function countOtherActiveAdmins(id: number) {
  const rows = await getDb()
    .select({ id: guestAccounts.id })
    .from(guestAccounts)
    .where(
      and(
        eq(guestAccounts.role, "admin"),
        eq(guestAccounts.isActive, true),
        ne(guestAccounts.id, id),
      ),
    );
  return rows.length;
}
