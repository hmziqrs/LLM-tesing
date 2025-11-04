import { z } from "zod";
import { protectedProcedure } from "../index";
import { db, transaction, transactionAttachment, budgetCategory } from "@minimax/db";
import { nanoid } from "nanoid";

export const transactionsRouter = {
	list: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.handler(async ({ input, context }) => {
			const transactions = await db
				.select()
				.from(transaction)
				.where(transaction.userId.eq(context.session!.user.id))
				.limit(input.limit)
				.offset(input.offset);

			return transactions;
		}),

	create: protectedProcedure
		.input(
			z.object({
				accountId: z.string(),
				categoryId: z.string(),
				amount: z.number(),
				description: z.string().min(1),
				date: z.date(),
				type: z.enum(["income", "expense"]),
			}),
		)
		.handler(async ({ input, context }) => {
			const id = nanoid();
			await db.insert(transaction).values({
				id,
				userId: context.session!.user.id,
				accountId: input.accountId,
				categoryId: input.categoryId,
				amount: input.amount.toString(),
				description: input.description,
				date: input.date,
				type: input.type,
				status: "completed",
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			return { id };
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				accountId: z.string(),
				categoryId: z.string(),
				amount: z.number(),
				description: z.string().min(1),
				date: z.date(),
				type: z.enum(["income", "expense"]),
				status: z.enum(["pending", "completed", "cancelled"]),
			}),
		)
		.handler(async ({ input, context }) => {
			await db
				.update(transaction)
				.set({
					accountId: input.accountId,
					categoryId: input.categoryId,
					amount: input.amount.toString(),
					description: input.description,
					date: input.date,
					type: input.type,
					status: input.status,
					updatedAt: new Date(),
				})
				.where(
					transaction.id
						.eq(input.id)
						.and(transaction.userId.eq(context.session!.user.id)),
				);

			return { success: true };
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			await db
				.delete(transaction)
				.where(
					transaction.id
						.eq(input.id)
						.and(transaction.userId.eq(context.session!.user.id)),
				);

			return { success: true };
		}),

	uploadAttachment: protectedProcedure
		.input(
			z.object({
				transactionId: z.string(),
				filename: z.string(),
				originalName: z.string(),
				mimeType: z.string(),
				size: z.number(),
				path: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const id = nanoid();
			await db.insert(transactionAttachment).values({
				id,
				transactionId: input.transactionId,
				filename: input.filename,
				originalName: input.originalName,
				mimeType: input.mimeType,
				size: input.size,
				path: input.path,
				createdAt: new Date(),
			});

			return { id };
		}),
};
