import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { savingsGoals } from '../schema/goals';
import type { InferSelectModel } from 'drizzle-orm';

export type SavingsGoal = InferSelectModel<typeof savingsGoals>;

export const goalRepository = {
  async create(data: {
    userId: string;
    name: string;
    description?: string;
    targetAmount: string;
    currentAmount?: string;
    targetDate?: string;
    priority?: 'high' | 'medium' | 'low';
    color?: string;
  }) {
    const [goal] = await db
      .insert(savingsGoals)
      .values({
        userId: data.userId,
        name: data.name,
        description: data.description,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount ?? '0.00',
        targetDate: data.targetDate,
        priority: data.priority ?? 'medium',
        color: data.color ?? '#10b981',
      })
      .returning();
    return goal;
  },

  async findAll(userId: string) {
    return db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId))
      .orderBy(desc(savingsGoals.createdAt));
  },

  async findById(id: string, userId: string) {
    const result = await db
      .select()
      .from(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)))
      .limit(1);
    return result[0] || null;
  },

  async update(id: string, userId: string, data: Partial<Pick<SavingsGoal, 'name' | 'description' | 'targetAmount' | 'currentAmount' | 'targetDate' | 'priority' | 'color'>>) {
    const [goal] = await db
      .update(savingsGoals)
      .set(data)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)))
      .returning();
    return goal;
  },

  async addContribution(id: string, userId: string, amount: string) {
    const goal = await this.findById(id, userId);
    if (!goal) return null;

    const current = parseFloat(goal.currentAmount);
    const contribution = parseFloat(amount);
    const newAmount = (current + contribution).toFixed(2);

    return this.update(id, userId, { currentAmount: newAmount });
  },

  async delete(id: string, userId: string) {
    await db
      .delete(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
    return true;
  },

  async getTotalSaved(userId: string) {
    const result = await db
      .select({ currentAmount: savingsGoals.currentAmount })
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId));

    return result.reduce((sum, goal) => sum + parseFloat(goal.currentAmount), 0);
  },
};
