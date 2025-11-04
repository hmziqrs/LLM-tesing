import { z } from "zod";
import { protectedProcedure } from "../index";
import { recurringBill, financialAccount, budgetCategory } from "@glm/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

const createRecurringBillSchema = z.object({
	accountId: z.number(),
	categoryId: z.number().optional(),
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
	frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"]),
	startDate: z.date(),
	endDate: z.date().optional(),
});

const updateRecurringBillSchema = z.object({
	id: z.number(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().optional(),
	amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
	frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"]).optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	isActive: z.boolean().optional(),
});

export const recurringRouter = {
	// Get all recurring bills for user
	getAll: protectedProcedure
		.handler(async ({ context }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const recurringBills = await context.db.query.recurringBill.findMany({
				where: eq(recurringBill.userId, userId),
				with: {
					account: true,
					category: true,
				},
				orderBy: (bills, { asc }) => [asc(bills.nextDue)],
			});

			return recurringBills;
		}),

	// Get recurring bill by ID
	getById: protectedProcedure
		.input(z.number())
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const bill = await context.db.query.recurringBill.findFirst({
				where: and(
					eq(recurringBill.id, input),
					eq(recurringBill.userId, userId)
				),
				with: {
					account: true,
					category: true,
				},
			});

			if (!bill) {
				throw new Error("Recurring bill not found");
			}

			return bill;
		}),

	// Create new recurring bill
	create: protectedProcedure
		.input(createRecurringBillSchema)
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

			// Calculate next due date
			const nextDue = calculateNextDueDate(input.startDate, input.frequency);

			const [recurringBillRecord] = await context.db.insert(recurringBill).values({
				userId,
				accountId: input.accountId,
				categoryId: input.categoryId || null,
				name: input.name,
				description: input.description,
				amount: input.amount,
				frequency: input.frequency,
				startDate: input.startDate,
				endDate: input.endDate || null,
				nextDue,
				isActive: true,
			}).returning();

			return recurringBillRecord;
		}),

	// Update recurring bill
	update: protectedProcedure
		.input(updateRecurringBillSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			// Verify bill belongs to user
			const existingBill = await context.db.query.recurringBill.findFirst({
				where: and(
					eq(recurringBill.id, input.id),
					eq(recurringBill.userId, userId)
				),
			});

			if (!existingBill) {
				throw new Error("Recurring bill not found");
			}

			const [updatedBill] = await context.db
				.update(recurringBill)
				.set({
					...(input.name && { name: input.name }),
					...(input.description !== undefined && { description: input.description }),
					...(input.amount && { amount: input.amount }),
					...(input.frequency && { frequency: input.frequency }),
					...(input.startDate && { startDate: input.startDate }),
					...(input.endDate !== undefined && { endDate: input.endDate }),
					...(input.isActive !== undefined && { isActive: input.isActive }),
					updatedAt: new Date(),
				})
				.where(eq(recurringBill.id, input.id))
				.returning();

			return updatedBill;
		}),

	// Delete recurring bill
	delete: protectedProcedure
		.input(z.number())
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const existingBill = await context.db.query.recurringBill.findFirst({
				where: and(
					eq(recurringBill.id, input),
					eq(recurringBill.userId, userId)
				),
			});

			if (!existingBill) {
				throw new Error("Recurring bill not found");
			}

			await context.db
				.delete(recurringBill)
				.where(eq(recurringBill.id, input));

			return { success: true, id: input };
		}),

	// Get upcoming bills (next 30 days)
	getUpcoming: protectedProcedure
		.handler(async ({ context }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const thirtyDaysFromNow = new Date();
			thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

			const upcomingBills = await context.db.query.recurringBill.findMany({
				where: and(
					eq(recurringBill.userId, userId),
					eq(recurringBill.isActive, true),
					gte(recurringBill.nextDue, new Date()),
					lte(recurringBill.nextDue, thirtyDaysFromNow)
				),
				with: {
					account: true,
					category: true,
				},
				orderBy: (bills, { asc }) => [asc(bills.nextDue)],
			});

			return upcomingBills;
		}),

	// Process recurring bills (would typically be called by a cron job)
	processDueBills: protectedProcedure
		.handler(async ({ context }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const dueBills = await context.db.query.recurringBill.findMany({
				where: and(
					eq(recurringBill.userId, userId),
					eq(recurringBill.isActive, true),
					lte(recurringBill.nextDue, today)
				),
			});

			const processedBills = [];
			const skippedBills = [];

			for (const bill of dueBills) {
				// Check if bill has end date and if it's past
				if (bill.endDate && bill.endDate < today) {
					// Deactivate expired bills
					await context.db
						.update(recurringBill)
						.set({ isActive: false, updatedAt: new Date() })
						.where(eq(recurringBill.id, bill.id));
					skippedBills.push({ bill, reason: "Expired" });
					continue;
				}

				// Create transaction for this bill
				const { transaction } = require("@glm/db/schema");
				const amountFloat = parseFloat(bill.amount);

				try {
					await context.db.insert(transaction).values({
						userId,
						accountId: bill.accountId,
						categoryId: bill.categoryId || null,
						amount: (-amountFloat).toString(), // Recurring bills are typically expenses
						description: bill.name,
						note: `Recurring bill - ${bill.description || ""}`,
						date: today,
						type: "expense",
						isRecurring: true,
						recurringBillId: bill.id,
					});

					// Update account balance
					await context.db
						.update(financialAccount)
						.set({
							balance: require("drizzle-orm").sql`CAST(${financialAccount.balance} AS DECIMAL(12,2)) - ${amountFloat}`,
							updatedAt: new Date(),
						})
						.where(eq(financialAccount.id, bill.accountId));

					// Calculate next due date
					const nextDue = calculateNextDueDate(bill.nextDue, bill.frequency);

					await context.db
						.update(recurringBill)
						.set({
							nextDue,
							lastProcessed: today,
							updatedAt: new Date(),
						})
						.where(eq(recurringBill.id, bill.id));

					processedBills.push({ bill, nextDue });
				} catch (error) {
					skippedBills.push({ bill, reason: error instanceof Error ? error.message : "Unknown error" });
				}
			}

			return {
				processed: processedBills.length,
				skipped: skippedBills.length,
				processedBills,
				skippedBills,
			};
		}),
};

// Helper function to calculate next due date based on frequency
function calculateNextDueDate(currentDate: Date, frequency: string): Date {
	const nextDue = new Date(currentDate);

	switch (frequency) {
		case "daily":
			nextDue.setDate(nextDue.getDate() + 1);
			break;
		case "weekly":
			nextDue.setDate(nextDue.getDate() + 7);
			break;
		case "biweekly":
			nextDue.setDate(nextDue.getDate() + 14);
			break;
		case "monthly":
			nextDue.setMonth(nextDue.getMonth() + 1);
			break;
		case "quarterly":
			nextDue.setMonth(nextDue.getMonth() + 3);
			break;
		case "yearly":
			nextDue.setFullYear(nextDue.getFullYear() + 1);
			break;
		default:
			nextDue.setMonth(nextDue.getMonth() + 1);
	}

	return nextDue;
}