import { z } from "zod";
import { protectedProcedure } from "../index";
import { db, recurringBill } from "@minimax/db";
import { nanoid } from "nanoid";

export const recurringRouter = {
	list: protectedProcedure.handler(async ({ context }) => {
		const bills = await db
			.select()
			.from(recurringBill)
			.where(
				recurringBill.userId.eq(context.session!.user.id).and(
					recurringBill.active.eq(true),
				),
			);

		return bills;
	}),

	create: protectedProcedure
		.input(
			z.object({
				categoryId: z.string(),
				name: z.string().min(1),
				description: z.string().optional(),
				amount: z.number().min(0),
				frequency: z.enum(["weekly", "monthly", "yearly"]),
				dayOfWeek: z.number().min(0).max(6).optional(),
				dayOfMonth: z.number().min(1).max(31).optional(),
				monthOfYear: z.number().min(1).max(12).optional(),
				startDate: z.date(),
				endDate: z.date().optional(),
				autoPay: z.boolean().default(false),
			}),
		)
		.handler(async ({ input, context }) => {
			const id = nanoid();
			const nextDueDate = calculateNextDueDate(
				input.frequency,
				input.startDate,
				input.dayOfWeek,
				input.dayOfMonth,
				input.monthOfYear,
			);

			await db.insert(recurringBill).values({
				id,
				userId: context.session!.user.id,
				categoryId: input.categoryId,
				name: input.name,
				description: input.description,
				amount: input.amount.toString(),
				frequency: input.frequency,
				dayOfWeek: input.dayOfWeek,
				dayOfMonth: input.dayOfMonth,
				monthOfYear: input.monthOfYear,
				startDate: input.startDate,
				endDate: input.endDate,
				autoPay: input.autoPay,
				nextDueDate,
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
				categoryId: z.string(),
				name: z.string().min(1),
				description: z.string().optional(),
				amount: z.number().min(0),
				frequency: z.enum(["weekly", "monthly", "yearly"]),
				dayOfWeek: z.number().min(0).max(6).optional(),
				dayOfMonth: z.number().min(1).max(31).optional(),
				monthOfYear: z.number().min(1).max(12).optional(),
				startDate: z.date(),
				endDate: z.date().optional(),
				autoPay: z.boolean(),
				active: z.boolean(),
			}),
		)
		.handler(async ({ input, context }) => {
			const nextDueDate = calculateNextDueDate(
				input.frequency,
				input.startDate,
				input.dayOfWeek,
				input.dayOfMonth,
				input.monthOfYear,
			);

			await db
				.update(recurringBill)
				.set({
					categoryId: input.categoryId,
					name: input.name,
					description: input.description,
					amount: input.amount.toString(),
					frequency: input.frequency,
					dayOfWeek: input.dayOfWeek,
					dayOfMonth: input.dayOfMonth,
					monthOfYear: input.monthOfYear,
					startDate: input.startDate,
					endDate: input.endDate,
					autoPay: input.autoPay,
					nextDueDate,
					active: input.active,
					updatedAt: new Date(),
				})
				.where(
					recurringBill.id
						.eq(input.id)
						.and(recurringBill.userId.eq(context.session!.user.id)),
				);

			return { success: true };
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			await db
				.update(recurringBill)
				.set({ active: false, updatedAt: new Date() })
				.where(
					recurringBill.id
						.eq(input.id)
						.and(recurringBill.userId.eq(context.session!.user.id)),
				);

			return { success: true };
		}),
};

function calculateNextDueDate(
	frequency: "weekly" | "monthly" | "yearly",
	startDate: Date,
	dayOfWeek?: number,
	dayOfMonth?: number,
	monthOfYear?: number,
): Date {
	const now = new Date();
	const next = new Date(startDate);

	switch (frequency) {
		case "weekly":
			if (dayOfWeek !== undefined) {
				const diff = (dayOfWeek + 7 - now.getDay()) % 7;
				next.setDate(now.getDate() + (diff || 7));
			} else {
				next.setDate(now.getDate() + 7);
			}
			break;
		case "monthly":
			if (dayOfMonth) {
				next.setMonth(now.getMonth() + (now.getDate() > dayOfMonth ? 1 : 0));
				next.setDate(dayOfMonth);
			} else {
				next.setMonth(now.getMonth() + 1);
			}
			break;
		case "yearly":
			if (monthOfYear && dayOfMonth) {
				next.setFullYear(
					now.getFullYear() +
						(now.getMonth() > monthOfYear - 1 ||
						(now.getMonth() === monthOfYear - 1 && now.getDate() > dayOfMonth)
							? 1
							: 0),
				);
				next.setMonth(monthOfYear - 1);
				next.setDate(dayOfMonth);
			} else {
				next.setFullYear(now.getFullYear() + 1);
			}
			break;
	}

	return next;
}
