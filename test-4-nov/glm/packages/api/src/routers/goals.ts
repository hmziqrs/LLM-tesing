import { z } from "zod";
import { protectedProcedure } from "../index";
import { goal, budgetCategory, transaction } from "@glm/db/schema";
import { eq, and, sum } from "drizzle-orm";

const createGoalSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	targetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
	targetDate: z.date().optional(),
	categoryId: z.number().optional(),
});

const updateGoalSchema = z.object({
	id: z.number(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().optional(),
	targetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
	currentAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
	targetDate: z.date().optional(),
	status: z.enum(["active", "completed", "paused", "cancelled"]).optional(),
	categoryId: z.number().optional(),
});

const contributeToGoalSchema = z.object({
	id: z.number(),
	amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
	accountId: z.number(),
	description: z.string().optional(),
});

export const goalsRouter = {
	// Get all goals for user
	getAll: protectedProcedure
		.handler(async ({ context }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const goals = await context.db.query.goal.findMany({
				where: eq(goal.userId, userId),
				with: {
					category: true,
				},
				orderBy: (goals, { desc }) => [desc(goals.createdAt)],
			});

			// Calculate progress percentages and days remaining
			const goalsWithProgress = goals.map(goal => {
				const targetAmount = parseFloat(goal.targetAmount || "0");
				const currentAmount = parseFloat(goal.currentAmount || "0");
				const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

				const today = new Date();
				const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
				const daysRemaining = targetDate ? Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

				return {
					...goal,
					progressPercentage: Math.min(progress, 100),
					daysRemaining,
					isOverdue: targetDate && targetDate < today && goal.status === "active",
				};
			});

			return goalsWithProgress;
		}),

	// Get goal by ID
	getById: protectedProcedure
		.input(z.number())
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const goalRecord = await context.db.query.goal.findFirst({
				where: and(
					eq(goal.id, input),
					eq(goal.userId, userId)
				),
				with: {
					category: true,
				},
			});

			if (!goalRecord) {
				throw new Error("Goal not found");
			}

			// Calculate additional goal statistics
			const targetAmount = parseFloat(goalRecord.targetAmount || "0");
			const currentAmount = parseFloat(goalRecord.currentAmount || "0");
			const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
			const remaining = targetAmount - currentAmount;

			const today = new Date();
			const targetDate = goalRecord.targetDate ? new Date(goalRecord.targetDate) : null;
			const daysRemaining = targetDate ? Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

			// Calculate contributions history
			const { sql } = require("drizzle-orm");
			const contributionsResult = await context.db
				.select({
					totalContributions: sum(sql`CAST(${transaction.amount} AS DECIMAL(12,2))`).mapWith(Number),
					contributionCount: sql`COUNT(*)`.mapWith(Number),
				})
				.from(transaction)
				.where(
					and(
						eq(transaction.userId, userId),
						sql`${transaction.note} LIKE '%${goalRecord.name}%'`,
						eq(transaction.type, "expense") // Contributions are recorded as negative expenses
					)
				);

			return {
				...goalRecord,
				progressPercentage: Math.min(progress, 100),
				remaining: Math.max(remaining, 0).toString(),
				daysRemaining,
				isOverdue: targetDate && targetDate < today && goalRecord.status === "active",
				contributions: contributionsResult[0] || { totalContributions: 0, contributionCount: 0 },
			};
		}),

	// Create new goal
	create: protectedProcedure
		.input(createGoalSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

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

			const [goalRecord] = await context.db.insert(goal).values({
				userId,
				name: input.name,
				description: input.description,
				targetAmount: input.targetAmount,
				currentAmount: "0",
				targetDate: input.targetDate || null,
				categoryId: input.categoryId || null,
				status: "active",
			}).returning();

			return goalRecord;
		}),

	// Update goal
	update: protectedProcedure
		.input(updateGoalSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const existingGoal = await context.db.query.goal.findFirst({
				where: and(
					eq(goal.id, input.id),
					eq(goal.userId, userId)
				),
			});

			if (!existingGoal) {
				throw new Error("Goal not found");
			}

			// Verify category belongs to user (if provided)
			if (input.categoryId !== undefined && input.categoryId !== existingGoal.categoryId) {
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
			}

			const [updatedGoal] = await context.db
				.update(goal)
				.set({
					...(input.name && { name: input.name }),
					...(input.description !== undefined && { description: input.description }),
					...(input.targetAmount && { targetAmount: input.targetAmount }),
					...(input.currentAmount && { currentAmount: input.currentAmount }),
					...(input.targetDate && { targetDate: input.targetDate }),
					...(input.status && { status: input.status }),
					...(input.categoryId !== undefined && { categoryId: input.categoryId }),
					updatedAt: new Date(),
				})
				.where(eq(goal.id, input.id))
				.returning();

			return updatedGoal;
		}),

	// Delete goal
	delete: protectedProcedure
		.input(z.number())
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const existingGoal = await context.db.query.goal.findFirst({
				where: and(
					eq(goal.id, input),
					eq(goal.userId, userId)
				),
			});

			if (!existingGoal) {
				throw new Error("Goal not found");
			}

			await context.db
				.delete(goal)
				.where(eq(goal.id, input));

			return { success: true, id: input };
		}),

	// Contribute to a goal
	contribute: protectedProcedure
		.input(contributeToGoalSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			// Get goal and verify ownership
			const goalRecord = await context.db.query.goal.findFirst({
				where: and(
					eq(goal.id, input.id),
					eq(goal.userId, userId)
				),
			});

			if (!goalRecord) {
				throw new Error("Goal not found");
			}

			if (goalRecord.status !== "active") {
				throw new Error("Cannot contribute to an inactive goal");
			}

			// Verify account belongs to user
			const { financialAccount } = require("@glm/db/schema");
			const account = await context.db.query.financialAccount.findFirst({
				where: and(
					eq(financialAccount.id, input.accountId),
					eq(financialAccount.userId, userId)
				),
			});

			if (!account) {
				throw new Error("Account not found");
			}

			const contributionAmount = parseFloat(input.amount);
			const currentAmount = parseFloat(goalRecord.currentAmount || "0");
			const targetAmount = parseFloat(goalRecord.targetAmount || "0");

			const newCurrentAmount = Math.min(currentAmount + contributionAmount, targetAmount);

			// Create contribution transaction
			const { transaction } = require("@glm/db/schema");
			await context.db.insert(transaction).values({
				userId,
				accountId: input.accountId,
				amount: contributionAmount.toString(),
				description: `Contribution to goal: ${goalRecord.name}`,
				note: input.description || `Goal contribution for ${goalRecord.name}`,
				date: new Date(),
				type: "expense", // Treat contribution as expense from account
				isRecurring: false,
			});

			// Update account balance
			await context.db
				.update(financialAccount)
				.set({
					balance: require("drizzle-orm").sql`CAST(${financialAccount.balance} AS DECIMAL(12,2)) - ${contributionAmount}`,
					updatedAt: new Date(),
				})
				.where(eq(financialAccount.id, input.accountId));

			// Update goal current amount and status
			const newStatus = newCurrentAmount >= targetAmount ? "completed" : "active";
			await context.db
				.update(goal)
				.set({
					currentAmount: newCurrentAmount.toString(),
					status: newStatus,
					updatedAt: new Date(),
				})
				.where(eq(goal.id, input.id));

			return {
				goalId: input.id,
				contributionAmount: contributionAmount.toString(),
				newCurrentAmount: newCurrentAmount.toString(),
				goalCompleted: newCurrentAmount >= targetAmount,
			};
		}),

	// Get goals summary
	getSummary: protectedProcedure
		.handler(async ({ context }) => {
			const userId = context.session?.user?.id;
			if (!userId) throw new Error("User not authenticated");

			const goals = await context.db.query.goal.findMany({
				where: eq(goal.userId, userId),
			});

			const activeGoals = goals.filter(g => g.status === "active");
			const completedGoals = goals.filter(g => g.status === "completed");
			const pausedGoals = goals.filter(g => g.status === "paused");

			const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.targetAmount || "0"), 0);
			const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.currentAmount || "0"), 0);
			const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

			// Calculate upcoming goals (due in next 30 days)
			const thirtyDaysFromNow = new Date();
			thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

			const upcomingGoals = activeGoals.filter(g => {
				if (!g.targetDate) return false;
				const targetDate = new Date(g.targetDate);
				return targetDate <= thirtyDaysFromNow && targetDate >= new Date();
			});

			return {
				totalGoals: goals.length,
				activeGoals: activeGoals.length,
				completedGoals: completedGoals.length,
				pausedGoals: pausedGoals.length,
				totalTargetAmount: totalTarget.toString(),
				totalSavedAmount: totalSaved.toString(),
				overallProgressPercentage: overallProgress,
				upcomingGoalsCount: upcomingGoals.length,
				upcomingGoals: upcomingGoals.map(g => ({
					id: g.id,
					name: g.name,
					targetDate: g.targetDate,
					daysRemaining: Math.ceil((new Date(g.targetDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
				})),
			};
		}),
};