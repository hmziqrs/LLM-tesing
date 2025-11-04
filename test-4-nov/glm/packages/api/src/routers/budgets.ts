import { z } from "zod";
import { protectedProcedure } from "../index";
import { budgetCategory, budgetAllocation, transaction, financialAccount } from "@glm/db/schema";
import { eq, and, sum, gte, lte } from "drizzle-orm";
import { sql } from "drizzle-orm";

const createCategorySchema = z.object({
	name: z.string().min(1).max(50),
	description: z.string().optional(),
	color: z.string().default("#6366f1"),
	icon: z.string().default("folder"),
});

const updateCategorySchema = z.object({
	id: z.number(),
	name: z.string().min(1).max(50).optional(),
	description: z.string().optional(),
	color: z.string().optional(),
	icon: z.string().optional(),
});

const createAllocationSchema = z.object({
	categoryId: z.number(),
	amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
	period: z.string().default("monthly"),
	year: z.number(),
	month: z.number(),
});

export const budgetsRouter = {
	// Categories
	getCategories: protectedProcedure
		.handler(async ({ context }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const categories = await context.db.query.budgetCategory.findMany({
				where: eq(budgetCategory.userId, userId),
				orderBy: (categories, { asc }) => [asc(categories.name)],
			});

			return categories;
		}),

	getCategoryById: protectedProcedure
		.input(z.number())
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const category = await context.db.query.budgetCategory.findFirst({
				where: and(
					eq(budgetCategory.id, input),
					eq(budgetCategory.userId, userId)
				),
			});

			if (!category) {
				throw new Error("Category not found");
			}

			return category;
		}),

	createCategory: protectedProcedure
		.input(createCategorySchema)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const [category] = await context.db.insert(budgetCategory).values({
				userId,
				name: input.name,
				description: input.description,
				color: input.color,
				icon: input.icon,
			}).returning();

			return category;
		}),

	updateCategory: protectedProcedure
		.input(updateCategorySchema)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const existingCategory = await context.db.query.budgetCategory.findFirst({
				where: and(
					eq(budgetCategory.id, input.id),
					eq(budgetCategory.userId, userId)
				),
			});

			if (!existingCategory) {
				throw new Error("Category not found");
			}

			const [updatedCategory] = await context.db
				.update(budgetCategory)
				.set({
					...(input.name && { name: input.name }),
					...(input.description !== undefined && { description: input.description }),
					...(input.color && { color: input.color }),
					...(input.icon && { icon: input.icon }),
					updatedAt: new Date(),
				})
				.where(eq(budgetCategory.id, input.id))
				.returning();

			return updatedCategory;
		}),

	deleteCategory: protectedProcedure
		.input(z.number())
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const existingCategory = await context.db.query.budgetCategory.findFirst({
				where: and(
					eq(budgetCategory.id, input),
					eq(budgetCategory.userId, userId)
				),
			});

			if (!existingCategory) {
				throw new Error("Category not found");
			}

			await context.db
				.delete(budgetCategory)
				.where(eq(budgetCategory.id, input));

			return { success: true, id: input };
		}),

	// Budget Allocations
	getAllocations: protectedProcedure
		.input(z.object({
			year: z.number().optional(),
			month: z.number().optional(),
		}))
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const currentDate = new Date();
			const year = input.year || currentDate.getFullYear();
			const month = input.month || currentDate.getMonth() + 1;

			const allocations = await context.db.query.budgetAllocation.findMany({
				where: and(
					eq(budgetAllocation.userId, userId),
					eq(budgetAllocation.year, year),
					eq(budgetAllocation.month, month)
				),
				with: {
					category: true,
				},
			});

			return allocations;
		}),

	createAllocation: protectedProcedure
		.input(createAllocationSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			// Verify category belongs to user
			const category = await context.db.query.budgetCategory.findFirst({
				where: and(
					eq(budgetCategory.id, input.categoryId),
					eq(budgetCategory.userId, userId)
				),
			});

			if (!category) {
				throw new Error("Category not found");
			}

			const [allocation] = await context.db.insert(budgetAllocation).values({
				userId,
				categoryId: input.categoryId,
				amount: input.amount,
				period: input.period,
				year: input.year,
				month: input.month,
			}).returning();

			return allocation;
		}),

	// Budget Overview
	getOverview: protectedProcedure
		.input(z.object({
			year: z.number().optional(),
			month: z.number().optional(),
		}))
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const currentDate = new Date();
			const year = input.year || currentDate.getFullYear();
			const month = input.month || currentDate.getMonth() + 1;

			// Get budget allocations
			const allocations = await context.db.query.budgetAllocation.findMany({
				where: and(
					eq(budgetAllocation.userId, userId),
					eq(budgetAllocation.year, year),
					eq(budgetAllocation.month, month)
				),
				with: {
					category: true,
				},
			});

			// Calculate total budget
			const totalBudget = allocations.reduce(
				(sum, allocation) => sum + parseFloat(allocation.amount || "0"),
				0
			);

			// Get spent amounts for current month
			const monthStart = new Date(year, month - 1, 1);
			const monthEnd = new Date(year, month, 0);

			const spendingResult = await context.db
				.select({
					categoryId: transaction.categoryId,
					spent: sum(sql`CAST(${transaction.amount} AS DECIMAL(12,2))`).mapWith(Number),
				})
				.from(transaction)
				.where(
					and(
						eq(transaction.userId, userId),
						eq(transaction.type, "expense"),
						gte(transaction.date, monthStart),
						lte(transaction.date, monthEnd)
					)
				)
				.groupBy(transaction.categoryId);

			const spentByCategory = new Map(
				spendingResult.map(item => [item.categoryId, Math.abs(item.spent || 0)])
			);

			// Combine allocations and spending
			const budgetCategories = allocations.map(allocation => ({
				category: allocation.category,
				allocated: parseFloat(allocation.amount || "0"),
				spent: spentByCategory.get(allocation.categoryId) || 0,
				remaining: parseFloat(allocation.amount || "0") - (spentByCategory.get(allocation.categoryId) || 0),
				percentage: Math.min(
					((spentByCategory.get(allocation.categoryId) || 0) / parseFloat(allocation.amount || "1")) * 100,
					100
				),
			}));

			const totalSpent = Array.from(spentByCategory.values()).reduce((sum, spent) => sum + spent, 0);

			return {
				period: { year, month },
				totalBudget: totalBudget.toString(),
				totalSpent: totalSpent.toString(),
				totalRemaining: (totalBudget - totalSpent).toString(),
				categories: budgetCategories,
			};
		}),
};