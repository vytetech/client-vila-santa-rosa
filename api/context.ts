import * as cookie from "cookie";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { GuestAccount, User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { GUEST_COOKIE } from "./guest-router";
import { findGuestByToken } from "./queries/guests";
import { validateAdminToken } from "./admin-tokens";

export const ADMIN_COOKIE = "vsr_admin_key";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  guest?: GuestAccount;
  /** True when the request carries a valid admin magic-link cookie. */
  adminViaToken?: boolean;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // Kimi authentication is optional here
  }
  try {
    const cookieHeader = opts.req.headers.get("cookie") ?? "";
    const parsed = cookie.parse(cookieHeader);
    const token = parsed[GUEST_COOKIE];
    if (token) {
      ctx.guest = await findGuestByToken(token);
    }
    const adminKey = parsed[ADMIN_COOKIE];
    if (adminKey) {
      ctx.adminViaToken = await validateAdminToken(adminKey);
    }
  } catch {
    // Guest session / admin token are optional here
  }
  return ctx;
}
