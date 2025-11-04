import { eq, and, desc, like } from 'drizzle-orm';
import { db } from '../db';
import { budgetCategories, budgetAllocations } from '../schema/budget';
import type { InferSelectModel } from 'drizzle-orm';

export type BudgetCategory = InferSelectModel<typeof budgetCategories>;
export type BudgetAllocation = InferSelectModel<typeof budgetAllocations>;

export const budgetRepository = {
  async createCategory(data: {
    userId: string;
    name: string;
    color?: string;
    description?: string;
  }) {
    const [category] = await db
      .insert(budgetCategories)
      .values({
        userId: data.userId,
        name: data.name,
        color: data.color ?? '#3b82f6',
        description: data.description,
      })
      .returning();
    return category;
  },

  async getCategories(userId: string) {
    return db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.userId, userId))
      .orderBy(desc(budgetCategories.createdAt));
  },

  async getCategoryById(id: string, userId: string) {
    const result = await db
      .select()
      .from(budgetCategories)
      .where(and(eq(budgetCategories.id, id), eq(budgetCategories.userId, userId)))
      .limit(1);
    return result[0] || null;
  },

  async updateCategory(id: string, userId: string, data: Partial<Pick<BudgetCategory, 'name' | 'color' | 'description'>>) {
    const [category] = await db
      .update(budgetCategories)
      .set(data)
      .where(and(eq(budgetCategories.id, id), eq(budgetCategories.userId, userId)))
      .returning();
    return category;
  },

  async deleteCategory(id: string, userId: string) {
    await db
      .delete(budgetCategories)
      .where(and(eq(budgetCategories.id, id), eq(budgetCategories.userId, userId)));
    return true;
  },

  async createAllocation(data: {
    categoryId: string;
    month: string;
    allocated: string;
  }) {
    const [allocation] = await db
      .insert(budgetAllocations)
      .values({
        categoryId: data.categoryId,
        month: data.month,
        allocated: data.allocated,
        spent: '0.00',
      })
      .returning();
    return allocation;
  },

  async getAllocations(userId: string, month?: string) {
    const query = month
      ? db
          .select()
          .from(budgetAllocations)
          .innerJoin(budgetCategories, eq(budgetCategories.id, budgetAllocations.categoryId))
          .where(and(eq(budgetCategories.userId, userId), like(budgetAllocations.month, `${month}%`)))
      : db
          .select()
          .from(budgetAllocations)
          .innerJoin(budgetCategories, eq(budgetCategories.id, budgetAllocations.categoryId))
          .where(eq(budgetCategories.userId, userId));

    return query.orderBy(desc(budgetAllocations.month));
  },

  async updateAllocationSpent(categoryId: string, month: string, spent: string) {
    const [allocation] = await db
      .update(budgetAllocations)
      .set({ spent })
      .where(and(eq(budgetAllocations.categoryId, categoryId), eq(budgetAllocations.month, month)))
      .returning();
    return allocation;
  },

  async getAllocationByCategoryAndMonth(categoryId: string, month: string) {
    const result = await db
      .select()
      .from(budgetAllocations)
      .where(and(eq(budgetAllocations.categoryId, categoryId), eq(budgetAllocations.month, month)))
      .limit(1);
    return result[0] || null;
  },
};
