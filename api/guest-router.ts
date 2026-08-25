import * as cookie from "cookie";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { getSessionCookieOptions } from "./lib/cookies";
import {
  createSession,
  deleteSession,
  findAccountByEmail,
  findAccountByLogin,
  findGuestByToken,
} from "./queries/guests";
import { applyPasswordReset, createPasswordReset } from "./queries/password-resets";
import { sendPasswordResetEmail } from "./mailer";
import { hashPassword, verifyPassword } from "./utils";
import { clientIp, rateLimit } from "./ratelimit";
import { countConfirmedReferrals } from "./queries/referrals";
import type { GuestAccount } from "@db/schema";

export const GUEST_COOKIE = "vsr_guest_sid";

function setGuestCookie(headers: Headers, resHeaders: Headers, token: string) {
  const opts = getSessionCookieOptions(headers);
  resHeaders.append(
    "set-cookie",
    cookie.serialize(GUEST_COOKIE, token, {
      httpOnly: true,
      path: "/",
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
    }),
  );
}

function clearGuestCookie(headers: Headers, resHeaders: Headers) {
  const opts = getSessionCookieOptions(headers);
  resHeaders.append(
    "set-cookie",
    cookie.serialize(GUEST_COOKIE, "", {
      httpOnly: true,
      path: "/",
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: 0,
    }),
  );
}

function requireGuest(guest?: GuestAccount): GuestAccount {
  if (!guest) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Login required" });
  }
  return guest;
}

function publicAccount(a: GuestAccount) {
  return {
    id: a.id,
    username: a.username,
    fullName: a.fullName,
    phone: a.phone,
    email: a.email,
    age: a.age,
    referralCode: a.referralCode,
    hasLifetimeDiscount: a.hasLifetimeDiscount,
    role: a.role,
    gender: a.gender,
    hasPet: a.hasPet,
    petName: a.petName,
    petBreed: a.petBreed,
    petAge: a.petAge,
    createdAt: a.createdAt,
  };
}

export const guestRouter = createRouter({
  register: publicQuery
    .input(z.any())
    .mutation(async () => {
      // Guest self-registration is disabled — only the owners hold accounts.
      throw new TRPCError({ code: "FORBIDDEN", message: "registration_disabled" });
    }),

  login: publicQuery
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ip = clientIp(ctx.req.headers);
      if (!rateLimit(`login:${ip}`, 10, 10 * 60 * 1000)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "too_many_attempts" });
      }
      const account = await findAccountByLogin(input.username);
      if (!account || !verifyPassword(input.password, account.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "invalid_credentials" });
      }
      if (!account.isActive) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "account_inactive" });
      }
      const { token } = await createSession(account.id);
      setGuestCookie(ctx.req.headers, ctx.resHeaders, token);
      return publicAccount(account);
    }),

  logout: publicQuery.mutation(async ({ ctx }) => {
    const cookieHeader = ctx.req.headers.get("cookie") ?? "";
    const token = cookie.parse(cookieHeader)[GUEST_COOKIE];
    if (token) await deleteSession(token);
    clearGuestCookie(ctx.req.headers, ctx.resHeaders);
    return { success: true };
  }),

  /**
   * Request a password reset. Always answers the same way (never reveals
   * whether the e-mail exists). Sends the link by e-mail when SMTP is set.
   */
  forgotPassword: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const ip = clientIp(ctx.req.headers);
      if (!rateLimit(`forgot:${ip}`, 5, 10 * 60 * 1000)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "too_many_attempts" });
      }
      const account = await findAccountByEmail(input.email);
      if (account) {
        const token = randomBytes(24).toString("hex");
        await createPasswordReset(input.email.toLowerCase(), token);
        const base = new URL(ctx.req.url).origin;
        await sendPasswordResetEmail(input.email, `${base}/redefinir-senha?token=${token}`);
      }
      return { success: true };
    }),

  /** Set a new password using a valid reset token. */
  resetPassword: publicQuery
    .input(
      z.object({
        token: z.string().min(32).max(64),
        password: z.string().min(8).max(100),
      }),
    )
    .mutation(async ({ input }) => {
      const ok = await applyPasswordReset(input.token, hashPassword(input.password));
      if (!ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "invalid_token" });
      }
      return { success: true };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const cookieHeader = ctx.req.headers.get("cookie") ?? "";
    const token = cookie.parse(cookieHeader)[GUEST_COOKIE];
    const guest = token ? await findGuestByToken(token) : undefined;
    if (!guest) return null;
    const confirmedReferrals = await countConfirmedReferrals(guest.id);
    return { ...publicAccount(guest), confirmedReferrals };
  }),

  /** Throws UNAUTHORIZED if not logged in — used by guarded actions. */
  requireMe: publicQuery.query(({ ctx }) => {
    return publicAccount(requireGuest(ctx.guest));
  }),
});
