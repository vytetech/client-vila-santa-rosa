import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** scrypt password hashing — format: "salt:hash" (hex) */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Short, human-friendly referral code derived from the guest's name. */
export function newReferralCode(fullName: string): string {
  const base =
    fullName
      .normalize("NFD")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 4)
      .toUpperCase() || "VSR";
  return base + randomBytes(3).toString("hex").toUpperCase();
}
