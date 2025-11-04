import { z } from "zod";
import { protectedProcedure } from "../index";
import { financialAccount, accountType } from "@glm/db/schema";
import { eq, and } from "drizzle-orm";
import { os } from "@orpc/server";

const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    "checking",
    "savings",
    "credit_card",
    "investment",
    "cash",
    "other",
  ]),
  balance: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().default("USD"),
  description: z.string().optional(),
});

const updateAccountSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  balance: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  currency: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const accountsRouter = os.router({
  // Get all accounts for the authenticated user
  getAll: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const accounts = await context.db.query.financialAccount.findMany({
      where: eq(financialAccount.userId, userId),
      orderBy: (accounts, { desc }) => [desc(accounts.createdAt)],
    });

    return accounts;
  }),

  // Get account by ID
  getById: protectedProcedure
    .input(z.number())
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const account = await context.db.query.financialAccount.findFirst({
        where: and(
          eq(financialAccount.id, input),
          eq(financialAccount.userId, userId),
        ),
      });

      if (!account) {
        throw new Error("Account not found");
      }

      return account;
    }),

  // Create new account
  create: protectedProcedure
    .input(createAccountSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const [account] = await context.db
        .insert(financialAccount)
        .values({
          userId,
          name: input.name,
          type: input.type,
          balance: input.balance,
          currency: input.currency || "USD",
          description: input.description,
          isActive: true,
        })
        .returning();

      return account;
    }),

  // Update account
  update: protectedProcedure
    .input(updateAccountSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) throw new Error("User not authenticated");

      // Verify account belongs to user
      const existingAccount = await context.db.query.financialAccount.findFirst(
        {
          where: and(
            eq(financialAccount.id, input.id),
            eq(financialAccount.userId, userId),
          ),
        },
      );

      if (!existingAccount) {
        throw new Error("Account not found");
      }

      const [updatedAccount] = await context.db
        .update(financialAccount)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.balance && { balance: input.balance }),
          ...(input.currency && { currency: input.currency }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
          updatedAt: new Date(),
        })
        .where(eq(financialAccount.id, input.id))
        .returning();

      return updatedAccount;
    }),

  // Delete account
  delete: protectedProcedure
    .input(z.number())
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) throw new Error("User not authenticated");

      // Verify account belongs to user
      const existingAccount = await context.db.query.financialAccount.findFirst(
        {
          where: and(
            eq(financialAccount.id, input),
            eq(financialAccount.userId, userId),
          ),
        },
      );

      if (!existingAccount) {
        throw new Error("Account not found");
      }

      await context.db
        .delete(financialAccount)
        .where(eq(financialAccount.id, input));

      return { success: true, id: input };
    }),

  // Get account summary
  getSummary: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const accounts = await context.db.query.financialAccount.findMany({
      where: eq(financialAccount.userId, userId),
    });

    const totalBalance = accounts.reduce((sum, account) => {
      return sum + parseFloat(account.balance || "0");
    }, 0);

    const totalAssets = accounts
      .filter((account) => account.type !== "credit_card")
      .reduce((sum, account) => sum + parseFloat(account.balance || "0"), 0);

    const totalDebts = accounts
      .filter((account) => account.type === "credit_card")
      .reduce(
        (sum, account) => Math.abs(parseFloat(account.balance || "0")),
        0,
      );

    return {
      totalBalance: totalBalance.toString(),
      totalAssets: totalAssets.toString(),
      totalDebts: totalDebts.toString(),
      accountCount: accounts.length,
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
        isActive: account.isActive,
      })),
    };
  }),
});
