import { z } from "zod";
import { protectedProcedure } from "../index";
import { db } from "@minimax/db";
import { budgetCategory } from "@minimax/db/src/schema/budget";
import { nanoid } from "nanoid";

export const accountsRouter = {
	list: protectedProcedure.handler(async ({ context }) => {
		const accounts = await db
			.select()
			.from(budgetCategory)
			.where(budgetCategory.userId.eq(context.session!.user.id));

		const accountsWithBalance = await Promise.all(
			accounts.map(async (account) => {
				const result = await db
					.select({
						balance: db
							.$count()
							.$as<number>(),
					})
					.from(budgetCategory)
					.where(budgetCategory.userId.eq(context.session!.user.id));

				return {
					...account,
					balance: 0,
				};
			}),
		);

		return accountsWithBalance;
	}),

	create: protectedProcedure
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

	update: protectedProcedure
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

	delete: protectedProcedure
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
};
