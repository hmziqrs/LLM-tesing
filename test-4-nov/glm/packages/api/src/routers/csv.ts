import { z } from "zod";
import { protectedProcedure } from "../index";
import { transaction, financialAccount, budgetCategory } from "@glm/db/schema";
import { eq, and } from "drizzle-orm";

// CSV column mapping schema
const csvMappingSchema = z.object({
	date: z.string(),
	description: z.string(),
	amount: z.string(),
	type: z.string().optional(),
	category: z.string().optional(),
	note: z.string().optional(),
});

const csvUploadSchema = z.object({
	fileName: z.string(),
	csvData: z.array(z.record(z.string())),
	mapping: csvMappingSchema,
	accountId: z.number(),
});

export const csvRouter = {
	// Parse CSV data and return preview
	parseCsv: protectedProcedure
		.input(z.object({
			csvContent: z.string(),
		}))
		.handler(async ({ input }) => {
			const lines = input.csvContent.split('\n').filter(line => line.trim());

			if (lines.length < 2) {
				throw new Error("CSV file must have at least a header row and one data row");
			}

			const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
			const dataRows = lines.slice(1).map(line => {
				const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
				const row: Record<string, string> = {};
				headers.forEach((header, index) => {
					row[header] = values[index] || '';
				});
				return row;
			});

			return {
				headers,
				dataRows,
				totalRows: dataRows.length,
			};
		}),

	// Validate and preview transaction data based on mapping
	validateMapping: protectedProcedure
		.input(z.object({
			dataRows: z.array(z.record(z.string())),
			mapping: csvMappingSchema,
			accountId: z.number(),
		}))
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

			// Get user's categories for validation
			const categories = await context.db.query.budgetCategory.findMany({
				where: eq(budgetCategory.userId, userId),
			});

			const categoryMap = new Map(
				categories.map(cat => [cat.name.toLowerCase(), cat.id])
			);

			// Process and validate first 5 rows for preview
			const previewRows = input.dataRows.slice(0, 5);
			const processedTransactions = previewRows.map((row, index) => {
				try {
					const amount = row[input.mapping.amount]?.replace(/[$,]/g, '') || '0';
					const amountNum = parseFloat(amount);

					if (isNaN(amountNum)) {
						throw new Error(`Invalid amount: ${amount}`);
					}

					// Auto-detect transaction type if not specified
					let type = input.mapping.type ? row[input.mapping.type]?.toLowerCase() : '';
					if (!type) {
						type = amountNum >= 0 ? 'income' : 'expense';
					} else {
						type = type.includes('income') ? 'income' :
						       type.includes('expense') ? 'expense' : 'transfer';
					}

					// Find category by name
					let categoryId: number | undefined;
					if (input.mapping.category && row[input.mapping.category]) {
						const categoryName = row[input.mapping.category].toLowerCase().trim();
						categoryId = categoryMap.get(categoryName);
					}

					return {
						rowIndex: index + 1,
						date: row[input.mapping.date],
						description: row[input.mapping.description],
						amount: amountNum.toString(),
						type,
						categoryName: input.mapping.category && row[input.mapping.category] || '',
						categoryId,
						note: input.mapping.note ? row[input.mapping.note] : '',
						isValid: true,
						error: null,
					};
				} catch (error) {
					return {
						rowIndex: index + 1,
						date: row[input.mapping.date],
						description: row[input.mapping.description],
						amount: row[input.mapping.amount],
						type: '',
						categoryName: '',
						categoryId: undefined,
						note: '',
						isValid: false,
						error: error instanceof Error ? error.message : 'Unknown error',
					};
				}
			});

			const validCount = processedTransactions.filter(t => t.isValid).length;
			const invalidCount = processedTransactions.length - validCount;

			return {
				preview: processedTransactions,
				totalRows: input.dataRows.length,
				validCount,
				invalidCount,
				canImport: validCount > 0,
			};
		}),

	// Import validated transactions
	importTransactions: protectedProcedure
		.input(csvUploadSchema)
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

			// Get user's categories
			const categories = await context.db.query.budgetCategory.findMany({
				where: eq(budgetCategory.userId, userId),
			});

			const categoryMap = new Map(
				categories.map(cat => [cat.name.toLowerCase(), cat.id])
			);

			let successCount = 0;
			let errorCount = 0;
			const errors: Array<{ row: number; error: string }> = [];

			// Process each row
			for (let i = 0; i < input.csvData.length; i++) {
				try {
					const row = input.csvData[i];
					const amountStr = row[input.mapping.amount]?.replace(/[$,]/g, '') || '0';
					const amount = parseFloat(amountStr);

					if (isNaN(amount)) {
						throw new Error(`Invalid amount: ${amountStr}`);
					}

					// Auto-detect transaction type
					let type = input.mapping.type ? row[input.mapping.type]?.toLowerCase() : '';
					if (!type) {
						type = amount >= 0 ? 'income' : 'expense';
					} else {
						type = type.includes('income') ? 'income' :
						       type.includes('expense') ? 'expense' : 'transfer';
					}

					// Parse date
					let date: Date;
					try {
						date = new Date(row[input.mapping.date]);
						if (isNaN(date.getTime())) {
							throw new Error('Invalid date format');
						}
					} catch {
						date = new Date(); // Fallback to current date
					}

					// Find category
					let categoryId: number | undefined;
					if (input.mapping.category && row[input.mapping.category]) {
						const categoryName = row[input.mapping.category].toLowerCase().trim();
						categoryId = categoryMap.get(categoryName);
					}

					// Insert transaction
					await context.db.insert(transaction).values({
						userId,
						accountId: input.accountId,
						categoryId: categoryId || null,
						amount: amount.toString(),
						description: row[input.mapping.description] || 'Imported transaction',
						note: input.mapping.note ? row[input.mapping.note] : null,
						date,
						type,
						isRecurring: false,
					});

					successCount++;
				} catch (error) {
					errorCount++;
					errors.push({
						row: i + 1,
						error: error instanceof Error ? error.message : 'Unknown error',
					});
				}
			}

			// Update account balance
			const totalAmount = input.csvData.reduce((sum, row) => {
				const amount = parseFloat(row[input.mapping.amount]?.replace(/[$,]/g, '') || '0');
				return sum + (isNaN(amount) ? 0 : amount);
			}, 0);

			await context.db
				.update(financialAccount)
				.set({
					balance: require("drizzle-orm").sql`CAST(${financialAccount.balance} AS DECIMAL(12,2)) + ${totalAmount}`,
					updatedAt: new Date(),
				})
				.where(eq(financialAccount.id, input.accountId));

			return {
				fileName: input.fileName,
				totalRows: input.csvData.length,
				successCount,
				errorCount,
				errors,
				totalImported: successCount.toString(),
			};
		}),

	// Get supported CSV formats and examples
	getCsvFormats: protectedProcedure
		.handler(() => {
			return {
				supportedFormats: [
					{
						name: "Standard Bank Format",
						description: "Most banking exports",
						columns: ["Date", "Description", "Amount"],
						example: "2024-01-15,Grocery Store,-45.67",
					},
					{
						name: "Detailed Format",
						description: "With category and notes",
						columns: ["Date", "Description", "Category", "Amount", "Type", "Note"],
						example: "2024-01-15,Grocery Store,Food & Dining,-45.67,expense,Weekly groceries",
					},
					{
						name: "Credit Card Format",
						description: "Credit card statements",
						columns: ["Transaction Date", "Description", "Amount"],
						example: "01/15/24,AMAZON PURCHASE,-23.45",
					},
				],
				tips: [
					"Date formats: YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY are supported",
					"Amounts should be numbers (use - for expenses)",
					"Categories are optional and will be matched to your existing categories",
					"Type column is optional - will be auto-detected from amount",
				],
			};
		}),
};