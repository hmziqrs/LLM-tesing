import { z } from "zod";
import { protectedProcedure } from "../index";
import { db } from "@minimax/db";
import { savingsGoal } from "@minimax/db/src/schema/goals";
import { nanoid } from "nanoid";

export const goalsRouter = {
	list: protectedProcedure.handler(async ({ context }) => {
		const goals = await db
			.select()
			.from(savingsGoal)
			.where(
				savingsGoal.userId.eq(context.session!.user.id).and(
					savingsGoal.active.eq(true),
				),
			);

		return goals;
	}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				description: z.string().optional(),
				targetAmount: z.number().min(0),
				currentAmount: z.number().min(0).default(0),
				targetDate: z.date().optional(),
				priority: z.enum(["low", "medium", "high"]).default("medium"),
				color: z.string().default("#10b981"),
				icon: z.string().default("target"),
			}),
		)
		.handler(async ({ input, context }) => {
			const id = nanoid();
			await db.insert(savingsGoal).values({
				id,
				userId: context.session!.user.id,
				name: input.name,
				description: input.description,
				targetAmount: input.targetAmount.toString(),
				currentAmount: input.currentAmount.toString(),
				targetDate: input.targetDate,
				priority: input.priority,
				color: input.color,
				icon: input.icon,
				active: true,
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
				targetAmount: z.number().min(0),
				currentAmount: z.number().min(0),
				targetDate: z.date().optional(),
				priority: z.enum(["low", "medium", "high"]),
				color: z.string(),
				icon: z.string(),
				active: z.boolean(),
			}),
		)
		.handler(async ({ input, context }) => {
			await db
				.update(savingsGoal)
				.set({
					name: input.name,
					description: input.description,
					targetAmount: input.targetAmount.toString(),
					currentAmount: input.currentAmount.toString(),
					targetDate: input.targetDate,
					priority: input.priority,
					color: input.color,
					icon: input.icon,
					active: input.active,
					updatedAt: new Date(),
				})
				.where(
					savingsGoal.id
						.eq(input.id)
						.and(savingsGoal.userId.eq(context.session!.user.id)),
				);

			return { success: true };
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			await db
				.update(savingsGoal)
				.set({ active: false, updatedAt: new Date() })
				.where(
					savingsGoal.id
						.eq(input.id)
						.and(savingsGoal.userId.eq(context.session!.user.id)),
				);

			return { success: true };
		}),

	addContribution: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				amount: z.number().min(0),
			}),
		)
		.handler(async ({ input, context }) => {
			const goal = await db
				.select()
				.from(savingsGoal)
				.where(
					savingsGoal.id
						.eq(input.id)
						.and(savingsGoal.userId.eq(context.session!.user.id)),
				)
				.limit(1);

			if (goal.length === 0) {
				throw new Error("Goal not found");
			}

			const currentAmount = parseFloat(goal[0].currentAmount);
			const newAmount = currentAmount + input.amount;

			await db
				.update(savingsGoal)
				.set({
					currentAmount: newAmount.toString(),
					updatedAt: new Date(),
				})
				.where(
					savingsGoal.id
						.eq(input.id)
						.and(savingsGoal.userId.eq(context.session!.user.id)),
				);

			return { success: true };
		}),

	getProgress: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			const goal = await db
				.select()
				.from(savingsGoal)
				.where(
					savingsGoal.id
						.eq(input.id)
						.and(savingsGoal.userId.eq(context.session!.user.id)),
				)
				.limit(1);

			if (goal.length === 0) {
				throw new Error("Goal not found");
			}

			const targetAmount = parseFloat(goal[0].targetAmount);
			const currentAmount = parseFloat(goal[0].currentAmount);
			const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

			return {
				...goal[0],
				progress,
			};
		}),
};
