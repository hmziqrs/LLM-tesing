import { z } from "zod";
import { protectedProcedure } from "../index";
import { db, budgetCategory, budgetAllocation } from "@minimax/db";
import { nanoid } from "nanoid";

export const budgetsRouter = {
	listCategories: protectedProcedure.handler(async ({ context }) => {
		const categories = await db
			.select()
			.from(budgetCategory)
			.where(budgetCategory.userId.eq(context.session!.user.id));

		return categories;
	}),

	createCategory: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				description: z.string().optional(),
				color: z.string().default("#6366f1"),
				icon: z.string().default("circle"),
			}),
		)
		.handler(async ({ input, context }) => {
			const id = nanoid();
			await db.insert(budgetCategory).values({
				id,
				userId: context.session!.user.id,
				name: input.name,
				description: input.description,
				color: input.color,
				icon: input.icon,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			return { id };
		}),

	updateCategory: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1),
				description: z.string().optional(),
				color: z.string(),
				icon: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			await db
				.update(budgetCategory)
				.set({
					name: input.name,
					description: input.description,
					color: input.color,
					icon: input.icon,
					updatedAt: new Date(),
				})
				.where(
					budgetCategory.id
						.eq(input.id)
						.and(budgetCategory.userId.eq(context.session!.user.id)),
				);

			return { success: true };
		}),

	deleteCategory: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			await db
				.delete(budgetCategory)
				.where(
					budgetCategory.id
						.eq(input.id)
						.and(budgetCategory.userId.eq(context.session!.user.id)),
				);

			return { success: true };
		}),

	listAllocations: protectedProcedure
		.input(
			z.object({
				month: z.number().min(1).max(12),
				year: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			const allocations = await db
				.select()
				.from(budgetAllocation)
				.where(
					budgetAllocation.userId
						.eq(context.session!.user.id)
						.and(budgetAllocation.month.eq(input.month))
						.and(budgetAllocation.year.eq(input.year)),
				);

			return allocations;
		}),

	setAllocation: protectedProcedure
		.input(
			z.object({
				categoryId: z.string(),
				month: z.number().min(1).max(12),
				year: z.number(),
				allocatedAmount: z.number().min(0),
			}),
		)
		.handler(async ({ input, context }) => {
			const id = nanoid();
			await db.insert(budgetAllocation).values({
				id,
				userId: context.session!.user.id,
				categoryId: input.categoryId,
				month: input.month,
				year: input.year,
				allocatedAmount: input.allocatedAmount.toString(),
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			return { id };
		}),

	getOverview: protectedProcedure
		.input(
			z.object({
				month: z.number().min(1).max(12),
				year: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			const categories = await db
				.select()
				.from(budgetCategory)
				.where(budgetCategory.userId.eq(context.session!.user.id));

			const allocations = await db
				.select()
				.from(budgetAllocation)
				.where(
					budgetAllocation.userId
						.eq(context.session!.user.id)
						.and(budgetAllocation.month.eq(input.month))
						.and(budgetAllocation.year.eq(input.year)),
				);

			return categories.map((category) => {
				const allocation = allocations.find((a) => a.categoryId === category.id);
				return {
					...category,
					allocatedAmount: allocation?.allocatedAmount || "0",
					spentAmount: "0",
				};
			});
		}),
};
