import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    // Access granted to a Kimi-OAuth admin, a guest account with the role
    // (the owners log in with e-mail + password on the guest login page),
    // or a valid admin magic-link token (sent via WhatsApp/e-mail).
    const isKimiAdmin = ctx.user?.role === role;
    const isGuestAdmin = ctx.guest?.role === role;
    const isTokenAdmin = ctx.adminViaToken === true;

    if (!isKimiAdmin && !isGuestAdmin && !isTokenAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx });
  });
}

export const authedQuery = t.procedure.use(requireAuth);
export const adminQuery = t.procedure.use(requireRole("admin"));
