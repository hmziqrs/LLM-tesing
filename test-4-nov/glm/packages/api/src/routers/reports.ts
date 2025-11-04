import { z } from "zod";
import { protectedProcedure } from "../index";
import { transaction, financialAccount, budgetCategory } from "@glm/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

const exportQuerySchema = z.object({
	type: z.enum(["transactions", "accounts", "budgets", "goals"]),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	format: z.enum(["csv"]).default("csv"),
});

export const reportsRouter = {
	// Export data in various formats
	export: protectedProcedure
		.input(exportQuerySchema)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			let csvContent = "";
			let filename = "";

			switch (input.type) {
				case "transactions":
					const transactions = await context.db.query.transaction.findMany({
						where: and(
							eq(transaction.userId, userId),
							input.startDate ? gte(transaction.date, input.startDate) : undefined,
							input.endDate ? lte(transaction.date, input.endDate) : undefined,
						),
						with: {
							account: true,
							category: true,
						},
						orderBy: (transactions, { desc }) => [desc(transactions.date)],
					});

					// CSV Headers
					csvContent = "Date,Description,Amount,Type,Account,Category,Note,Created\n";

					// CSV Data
					transactions.forEach(t => {
						const row = [
							t.date?.toISOString().split('T')[0] || '',
							`"${t.description?.replace(/"/g, '""') || ''}"`,
							t.amount || '0',
							t.type || '',
							`"${t.account?.name?.replace(/"/g, '""') || ''}"`,
							`"${t.category?.name?.replace(/"/g, '""') || ''}"`,
							`"${t.note?.replace(/"/g, '""') || ''}"`,
							t.createdAt?.toISOString().split('T')[0] || '',
						].join(',');
						csvContent += row + '\n';
					});

					filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
					break;

				case "accounts":
					const accounts = await context.db.query.financialAccount.findMany({
						where: eq(financialAccount.userId, userId),
						orderBy: (accounts, { asc }) => [asc(accounts.name)],
					});

					// CSV Headers
					csvContent = "Name,Type,Balance,Currency,Description,Status,Created\n";

					// CSV Data
					accounts.forEach(a => {
						const row = [
							`"${a.name?.replace(/"/g, '""') || ''}"`,
							a.type || '',
							a.balance || '0',
							a.currency || 'USD',
							`"${a.description?.replace(/"/g, '""') || ''}"`,
							a.isActive ? 'Active' : 'Inactive',
							a.createdAt?.toISOString().split('T')[0] || '',
						].join(',');
						csvContent += row + '\n';
					});

					filename = `accounts_${new Date().toISOString().split('T')[0]}.csv`;
					break;

				case "budgets":
					const currentDate = new Date();
					const currentYear = currentDate.getFullYear();
					const currentMonth = currentDate.getMonth() + 1;

					const budgetAllocations = await context.db.query.budgetAllocation.findMany({
						where: and(
							eq(budgetAllocation.userId, userId),
							eq(budgetAllocation.year, currentYear),
							eq(budgetAllocation.month, currentMonth),
						),
						with: {
							category: true,
						},
					});

					// CSV Headers
					csvContent = "Category,Allocated Amount,Period,Year,Month,Created\n";

					// CSV Data
					budgetAllocations.forEach(b => {
						const row = [
							`"${b.category?.name?.replace(/"/g, '""') || ''}"`,
							b.amount || '0',
							b.period || 'monthly',
							b.year?.toString() || '',
							b.month?.toString() || '',
							b.createdAt?.toISOString().split('T')[0] || '',
						].join(',');
						csvContent += row + '\n';
					});

					filename = `budgets_${currentYear}_${currentMonth.toString().padStart(2, '0')}.csv`;
					break;

				case "goals":
					const goals = await context.db.query.goal.findMany({
						where: eq(goal.userId, userId),
						with: {
							category: true,
						},
						orderBy: (goals, { desc }) => [desc(goals.createdAt)],
					});

					// CSV Headers
					csvContent = "Name,Description,Target Amount,Current Amount,Status,Target Date,Category,Created\n";

					// CSV Data
					goals.forEach(g => {
						const progress = parseFloat(g.targetAmount || "0") > 0
							? ((parseFloat(g.currentAmount || "0") / parseFloat(g.targetAmount || "1")) * 100).toFixed(2)
							: "0";

						const row = [
							`"${g.name?.replace(/"/g, '""') || ''}"`,
							`"${g.description?.replace(/"/g, '""') || ''}"`,
							g.targetAmount || '0',
							g.currentAmount || '0',
							g.status || '',
							g.targetDate?.toISOString().split('T')[0] || '',
							`"${g.category?.name?.replace(/"/g, '""') || ''}"`,
							g.createdAt?.toISOString().split('T')[0] || '',
						].join(',');
						csvContent += row + '\n';
					});

					filename = `goals_${new Date().toISOString().split('T')[0]}.csv`;
					break;

				default:
					throw new Error(`Unsupported export type: ${input.type}`);
			}

			// Return base64 encoded CSV for browser download
			const base64Content = Buffer.from(csvContent, 'utf-8').toString('base64');

			return {
				content: base64Content,
				filename,
				mimeType: 'text/csv',
				size: csvContent.length,
			};
		}),

	// Get report summary for analytics
	getSummary: protectedProcedure
		.input(z.object({
			period: z.enum(["week", "month", "quarter", "year"]).default("month"),
			startDate: z.date().optional(),
			endDate: z.date().optional(),
		}))
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			// Calculate date range based on period
			let startDate: Date;
			let endDate: Date = new Date();

			if (input.startDate && input.endDate) {
				startDate = input.startDate;
				endDate = input.endDate;
			} else {
				const now = new Date();
				switch (input.period) {
					case "week":
						startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
						break;
					case "month":
						startDate = new Date(now.getFullYear(), now.getMonth(), 1);
						break;
					case "quarter":
						const quarter = Math.floor(now.getMonth() / 3);
						startDate = new Date(now.getFullYear(), quarter * 3, 1);
						break;
					case "year":
						startDate = new Date(now.getFullYear(), 0, 1);
						break;
				}
			}

			// Get transactions in period
			const { sql } = require("drizzle-orm");
			const transactionStats = await context.db
				.select({
					totalIncome: sql<number>`SUM(CASE WHEN ${transaction.type} = 'income' THEN CAST(${transaction.amount} AS DECIMAL(12,2)) ELSE 0 END)`,
					totalExpenses: sql<number>`SUM(CASE WHEN ${transaction.type} = 'expense' THEN CAST(${transaction.amount} AS DECIMAL(12,2)) ELSE 0 END)`,
					transactionCount: sql<number>`COUNT(*)`,
				})
				.from(transaction)
				.where(
					and(
						eq(transaction.userId, userId),
						gte(transaction.date, startDate),
						lte(transaction.date, endDate)
					)
				);

			const stats = transactionStats[0] || {
				totalIncome: 0,
				totalExpenses: 0,
				transactionCount: 0,
			};

			// Get spending by category
			const spendingByCategory = await context.db
				.select({
					categoryName: budgetCategory.name,
					totalSpent: sql<number>`SUM(ABS(CAST(${transaction.amount} AS DECIMAL(12,2))))`,
					transactionCount: sql<number>`COUNT(*)`,
				})
				.from(transaction)
				.leftJoin(budgetCategory, eq(transaction.categoryId, budgetCategory.id))
				.where(
					and(
						eq(transaction.userId, userId),
						eq(transaction.type, 'expense'),
						gte(transaction.date, startDate),
						lte(transaction.date, endDate)
					)
				)
				.groupBy(budgetCategory.name)
				.orderBy(sql`totalSpent DESC`);

			// Get account balances at period start and end
			const accountChanges = await context.db.query.financialAccount.findMany({
				where: eq(financialAccount.userId, userId),
			});

			return {
				period: input.period,
				startDate,
				endDate,
				summary: {
					totalIncome: stats.totalIncome?.toString() || "0",
					totalExpenses: Math.abs(stats.totalExpenses || 0).toString(),
					netAmount: (stats.totalIncome - Math.abs(stats.totalExpenses || 0)).toString(),
					transactionCount: stats.transactionCount || 0,
				},
				spendingByCategory: spendingByCategory.map(item => ({
					categoryName: item.categoryName || "Uncategorized",
					totalSpent: item.totalSpent?.toString() || "0",
					transactionCount: item.transactionCount || 0,
				})),
				accountCount: accountChanges.length,
			};
		}),
};