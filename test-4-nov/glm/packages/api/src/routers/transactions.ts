import { z } from "zod";
import { protectedProcedure } from "../index";
import { transaction, financialAccount, budgetCategory } from "@glm/db/schema";
import { eq, and, desc, like, gte, lte } from "drizzle-orm";

const createTransactionSchema = z.object({
	accountId: z.number(),
	categoryId: z.number().optional(),
	amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
	description: z.string().min(1).max(200),
	note: z.string().optional(),
	date: z.date().optional(),
	type: z.enum(["income", "expense", "transfer"]).default("expense"),
	isRecurring: z.boolean().default(false),
});

const updateTransactionSchema = z.object({
	id: z.number(),
	accountId: z.number().optional(),
	categoryId: z.number().optional(),
	amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/).optional(),
	description: z.string().min(1).max(200).optional(),
	note: z.string().optional(),
	date: z.date().optional(),
	type: z.enum(["income", "expense", "transfer"]).optional(),
});

const getTransactionsSchema = z.object({
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(20),
	accountId: z.number().optional(),
	categoryId: z.number().optional(),
	type: z.enum(["income", "expense", "transfer"]).optional(),
	search: z.string().optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
});

export const transactionsRouter = {
	getAll: protectedProcedure
		.input(getTransactionsSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const offset = (input.page - 1) * input.limit;

			// Build query conditions
			let conditions = [eq(transaction.userId, userId)];

			if (input.accountId) {
				conditions.push(eq(transaction.accountId, input.accountId));
			}
			if (input.categoryId) {
				conditions.push(eq(transaction.categoryId, input.categoryId));
			}
			if (input.type) {
				conditions.push(eq(transaction.type, input.type));
			}
			if (input.search) {
				conditions.push(like(transaction.description, `%${input.search}%`));
			}
			if (input.startDate) {
				conditions.push(gte(transaction.date, input.startDate));
			}
			if (input.endDate) {
				conditions.push(lte(transaction.date, input.endDate));
			}

			const transactions = await context.db.query.transaction.findMany({
				where: and(...conditions),
				with: {
					account: true,
					category: true,
				},
				orderBy: [desc(transaction.date), desc(transaction.createdAt)],
				limit: input.limit,
				offset,
			});

			// Get total count for pagination
			const totalCountResult = await context.db
				.select({ count: require("drizzle-orm").sql<number>`count(*)` })
				.from(transaction)
				.where(and(...conditions));

			const totalCount = totalCountResult[0]?.count || 0;

			return {
				transactions,
				pagination: {
					page: input.page,
					limit: input.limit,
					total: totalCount,
					totalPages: Math.ceil(totalCount / input.limit),
				},
			};
		}),

	getById: protectedProcedure
		.input(z.number())
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const transactionRecord = await context.db.query.transaction.findFirst({
				where: and(
					eq(transaction.id, input),
					eq(transaction.userId, userId)
				),
				with: {
					account: true,
					category: true,
					attachments: true,
				},
			});

			if (!transactionRecord) {
				throw new Error("Transaction not found");
			}

			return transactionRecord;
		}),

	create: protectedProcedure
		.input(createTransactionSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			// Verify account belongs to user
			const account = await context.db.query.financialAccount.findFirst({
				where: and(
					eq(financialAccount.id, input.accountId),
					eq(financialAccount.userId, userId)
				),
			});

			if (!account) {
				throw new Error("Account not found");
			}

			// Verify category belongs to user (if provided)
			if (input.categoryId) {
				const category = await context.db.query.budgetCategory.findFirst({
					where: and(
						eq(budgetCategory.id, input.categoryId),
						eq(budgetCategory.userId, userId)
					),
				});

				if (!category) {
					throw new Error("Category not found");
				}
			}

			const [newTransaction] = await context.db.insert(transaction).values({
				userId,
				accountId: input.accountId,
				categoryId: input.categoryId || null,
				amount: input.amount,
				description: input.description,
				note: input.note,
				date: input.date || new Date(),
				type: input.type,
				isRecurring: input.isRecurring,
			}).returning();

			// Update account balance
			const amountFloat = parseFloat(input.amount);
			await context.db
				.update(financialAccount)
				.set({
					balance: require("drizzle-orm").sql`CAST(${financialAccount.balance} AS DECIMAL(12,2)) + ${amountFloat}`,
					updatedAt: new Date(),
				})
				.where(eq(financialAccount.id, input.accountId));

			return newTransaction;
		}),

	update: protectedProcedure
		.input(updateTransactionSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			// Get original transaction
			const originalTransaction = await context.db.query.transaction.findFirst({
				where: and(
					eq(transaction.id, input.id),
					eq(transaction.userId, userId)
				),
			});

			if (!originalTransaction) {
				throw new Error("Transaction not found");
			}

			// Verify new account belongs to user (if changed)
			if (input.accountId && input.accountId !== originalTransaction.accountId) {
				const account = await context.db.query.financialAccount.findFirst({
					where: and(
						eq(financialAccount.id, input.accountId),
						eq(financialAccount.userId, userId)
					),
				});

				if (!account) {
					throw new Error("Account not found");
				}
			}

			// Verify category belongs to user (if provided and changed)
			if (input.categoryId !== undefined && input.categoryId !== originalTransaction.categoryId) {
				if (input.categoryId) {
					const category = await context.db.query.budgetCategory.findFirst({
						where: and(
							eq(budgetCategory.id, input.categoryId),
							eq(budgetCategory.userId, userId)
						),
					});

					if (!category) {
						throw new Error("Category not found");
					}
				}
			}

			const [updatedTransaction] = await context.db
				.update(transaction)
				.set({
					...(input.accountId && { accountId: input.accountId }),
					...(input.categoryId !== undefined && { categoryId: input.categoryId }),
					...(input.amount && { amount: input.amount }),
					...(input.description && { description: input.description }),
					...(input.note !== undefined && { note: input.note }),
					...(input.date && { date: input.date }),
					...(input.type && { type: input.type }),
					updatedAt: new Date(),
				})
				.where(eq(transaction.id, input.id))
				.returning();

			// Update account balances if amount or account changed
			if (input.amount || input.accountId) {
				const originalAmount = parseFloat(originalTransaction.amount);
				const newAmount = parseFloat(input.amount || originalTransaction.amount);
				const amountDiff = newAmount - originalAmount;
				const targetAccountId = input.accountId || originalTransaction.accountId;

				// Revert original amount from original account
				await context.db
					.update(financialAccount)
					.set({
						balance: require("drizzle-orm").sql`CAST(${financialAccount.balance} AS DECIMAL(12,2)) - ${originalAmount}`,
						updatedAt: new Date(),
					})
					.where(eq(financialAccount.id, originalTransaction.accountId));

				// Apply new amount to target account
				await context.db
					.update(financialAccount)
					.set({
						balance: require("drizzle-orm").sql`CAST(${financialAccount.balance} AS DECIMAL(12,2)) + ${newAmount}`,
						updatedAt: new Date(),
					})
					.where(eq(financialAccount.id, targetAccountId));
			}

			return updatedTransaction;
		}),

	delete: protectedProcedure
		.input(z.number())
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const transactionRecord = await context.db.query.transaction.findFirst({
				where: and(
					eq(transaction.id, input),
					eq(transaction.userId, userId)
				),
			});

			if (!transactionRecord) {
				throw new Error("Transaction not found");
			}

			const amount = parseFloat(transactionRecord.amount);

			await context.db
				.delete(transaction)
				.where(eq(transaction.id, input));

			// Update account balance
			await context.db
				.update(financialAccount)
				.set({
					balance: require("drizzle-orm").sql`CAST(${financialAccount.balance} AS DECIMAL(12,2)) - ${amount}`,
					updatedAt: new Date(),
				})
				.where(eq(financialAccount.id, transactionRecord.accountId));

			return { success: true, id: input };
		}),

	getSummary: protectedProcedure
		.input(z.object({
			accountId: z.number().optional(),
			startDate: z.date().optional(),
			endDate: z.date().optional(),
		}))
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const currentDate = new Date();
			const startDate = input.startDate || new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
			const endDate = input.endDate || currentDate;

			// Build conditions
			let conditions = [
				eq(transaction.userId, userId),
				gte(transaction.date, startDate),
				lte(transaction.date, endDate),
			];

			if (input.accountId) {
				conditions.push(eq(transaction.accountId, input.accountId));
			}

			const transactions = await context.db.query.transaction.findMany({
				where: and(...conditions),
			});

			const income = transactions
				.filter(t => t.type === "income")
				.reduce((sum, t) => sum + parseFloat(t.amount), 0);

			const expenses = transactions
				.filter(t => t.type === "expense")
				.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

			const transfers = transactions
				.filter(t => t.type === "transfer")
				.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

			return {
				period: { startDate, endDate },
				income: income.toString(),
				expenses: expenses.toString(),
				transfers: transfers.toString(),
				net: (income - expenses).toString(),
				transactionCount: transactions.length,
			};
		}),
};