import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminQuery, createRouter } from "./middleware";
import {
  countOtherActiveAdmins,
  createManagedAccount,
  deleteManagedAccount,
  findAccountById,
  listAccounts,
  updateManagedAccount,
  updateManagedAccountPassword,
} from "./queries/guests";
import { hashPassword } from "./utils";

const roleSchema = z.enum(["user", "admin"]);
const usernameSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-zA-Z0-9._-]+$/, "username_chars");

function publicManagedAccount(account: Awaited<ReturnType<typeof findAccountById>>) {
  if (!account) return null;
  return {
    id: account.id,
    username: account.username,
    fullName: account.fullName,
    email: account.email,
    role: account.role,
    isActive: account.isActive,
    createdAt: account.createdAt,
  };
}

function isDuplicateUsernameError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; errno?: number; message?: string };
  return maybe.code === "ER_DUP_ENTRY" || maybe.errno === 1062;
}

async function assertNotLastActiveAdmin(id: number, next?: { role?: "user" | "admin"; isActive?: boolean }) {
  const current = await findAccountById(id);
  if (!current || current.role !== "admin" || !current.isActive) return;
  const wouldRemoveAdmin = next?.role === "user" || next?.isActive === false;
  if (!wouldRemoveAdmin) return;
  if ((await countOtherActiveAdmins(id)) === 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "last_admin_protected" });
  }
}

export const accountsRouter = createRouter({
  list: adminQuery.query(async () => {
    const rows = await listAccounts();
    return rows.map((account) => ({
      id: account.id,
      username: account.username,
      fullName: account.fullName,
      email: account.email,
      role: account.role,
      isActive: account.isActive,
      createdAt: account.createdAt,
    }));
  }),

  create: adminQuery
    .input(
      z.object({
        username: usernameSchema,
        password: z.string().min(8).max(100),
        fullName: z.string().min(2).max(255),
        email: z.string().email().max(320).nullable().optional(),
        role: roleSchema,
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const account = await createManagedAccount({
          username: input.username.trim(),
          passwordHash: hashPassword(input.password),
          fullName: input.fullName.trim(),
          email: input.email?.toLowerCase() || null,
          role: input.role,
          isActive: input.isActive,
        });
        return publicManagedAccount(account);
      } catch (error) {
        if (isDuplicateUsernameError(error)) {
          throw new TRPCError({ code: "CONFLICT", message: "username_taken" });
        }
        throw error;
      }
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number().int(),
        username: usernameSchema,
        fullName: z.string().min(2).max(255),
        email: z.string().email().max(320).nullable().optional(),
        role: roleSchema,
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      await assertNotLastActiveAdmin(input.id, { role: input.role, isActive: input.isActive });
      try {
        const account = await updateManagedAccount(input.id, {
          username: input.username.trim(),
          fullName: input.fullName.trim(),
          email: input.email?.toLowerCase() || null,
          role: input.role,
          isActive: input.isActive,
        });
        return publicManagedAccount(account);
      } catch (error) {
        if (isDuplicateUsernameError(error)) {
          throw new TRPCError({ code: "CONFLICT", message: "username_taken" });
        }
        throw error;
      }
    }),

  resetPassword: adminQuery
    .input(z.object({ id: z.number().int(), password: z.string().min(8).max(100) }))
    .mutation(async ({ input }) => {
      await updateManagedAccountPassword(input.id, hashPassword(input.password));
      return { success: true };
    }),

  remove: adminQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await assertNotLastActiveAdmin(input.id, { isActive: false });
      await deleteManagedAccount(input.id);
      return { success: true };
    }),
});
