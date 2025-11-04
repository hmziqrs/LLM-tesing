import { z } from "zod";
import { protectedProcedure } from "../index";
import { db, transaction, budgetCategory } from "@minimax/db";
import { and, gte, lte } from "drizzle-orm";

export const reportsRouter = {
	cashflow: protectedProcedure
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date(),
			}),
		)
		.handler(async ({ input, context }) => {
			const transactions = await db
				.select({
					date: transaction.date,
					amount: transaction.amount,
					type: transaction.type,
				})
				.from(transaction)
				.where(
					and(
						transaction.userId.eq(context.session!.user.id),
						gte(transaction.date, input.startDate),
						lte(transaction.date, input.endDate),
					),
				);

			const monthlyData = new Map<
				string,
				{ income: number; expense: number; net: number }
			>();

			for (const tx of transactions) {
				const month = new Date(tx.date).toISOString().slice(0, 7);
				const amount = parseFloat(tx.amount);

				if (!monthlyData.has(month)) {
					monthlyData.set(month, { income: 0, expense: 0, net: 0 });
				}

				const data = monthlyData.get(month)!;
				if (tx.type === "income") {
					data.income += amount;
				} else {
					data.expense += Math.abs(amount);
				}
				data.net = data.income - data.expense;
			}

			return Array.from(monthlyData.entries()).map(([month, data]) => ({
				month,
				...data,
			}));
		}),

	categoryBreakdown: protectedProcedure
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date(),
			}),
		)
		.handler(async ({ input, context }) => {
			const categories = await db
				.select({
					categoryId: transaction.categoryId,
					amount: transaction.amount,
				})
				.from(transaction)
				.where(
					and(
						transaction.userId.eq(context.session!.user.id),
						transaction.type.eq("expense"),
						gte(transaction.date, input.startDate),
						lte(transaction.date, input.endDate),
					),
				);

			const categoryTotals = new Map<string, number>();

			for (const tx of categories) {
				const amount = parseFloat(tx.amount);
				categoryTotals.set(
					tx.categoryId,
					(categoryTotals.get(tx.categoryId) || 0) + Math.abs(amount),
				);
			}

			const result = await Promise.all(
				Array.from(categoryTotals.entries()).map(
					async ([categoryId, total]) => {
						const category = await db
							.select()
							.from(budgetCategory)
							.where(budgetCategory.id.eq(categoryId))
							.limit(1);

						return {
							categoryId,
							categoryName: category[0]?.name || "Unknown",
							color: category[0]?.color || "#666666",
							total,
						};
					},
				),
			);

			return result.sort((a, b) => b.total - a.total);
		}),

	budgetVsActual: protectedProcedure
		.input(
			z.object({
				month: z.number().min(1).max(12),
				year: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			return [];
		}),

	exportCsv: protectedProcedure
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date(),
			}),
		)
		.handler(async ({ input, context }) => {
			const transactions = await db
				.select()
				.from(transaction)
				.where(
					and(
						transaction.userId.eq(context.session!.user.id),
						gte(transaction.date, input.startDate),
						lte(transaction.date, input.endDate),
					),
				);

			const csv = [
				["Date", "Description", "Amount", "Type", "Status"].join(","),
				...transactions.map((tx) =>
					[
						new Date(tx.date).toISOString().split("T")[0],
						`"${tx.description.replace(/"/g, '""')}"`,
						tx.amount,
						tx.type,
						tx.status,
					].join(","),
				),
			].join("\n");

			return { csv };
		}),
};
