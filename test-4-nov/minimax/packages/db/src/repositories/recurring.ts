import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { recurringBills } from '../schema/recurring';
import type { InferSelectModel } from 'drizzle-orm';

export type RecurringBill = InferSelectModel<typeof recurringBills>;

export const recurringRepository = {
  async create(data: {
    userId: string;
    name: string;
    description?: string;
    amount: string;
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
    nextDueDate: string;
    autoPay?: boolean;
  }) {
    const [bill] = await db
      .insert(recurringBills)
      .values({
        userId: data.userId,
        name: data.name,
        description: data.description,
        amount: data.amount,
        frequency: data.frequency,
        nextDueDate: data.nextDueDate,
        autoPay: data.autoPay ?? false,
      })
      .returning();
    return bill;
  },

  async findAll(userId: string) {
    return db
      .select()
      .from(recurringBills)
      .where(eq(recurringBills.userId, userId))
      .orderBy(desc(recurringBills.createdAt));
  },

  async findById(id: string, userId: string) {
    const result = await db
      .select()
      .from(recurringBills)
      .where(and(eq(recurringBills.id, id), eq(recurringBills.userId, userId)))
      .limit(1);
    return result[0] || null;
  },

  async update(id: string, userId: string, data: Partial<Pick<RecurringBill, 'name' | 'description' | 'amount' | 'frequency' | 'nextDueDate' | 'autoPay'>>) {
    const [bill] = await db
      .update(recurringBills)
      .set(data)
      .where(and(eq(recurringBills.id, id), eq(recurringBills.userId, userId)))
      .returning();
    return bill;
  },

  async delete(id: string, userId: string) {
    await db
      .delete(recurringBills)
      .where(and(eq(recurringBills.id, id), eq(recurringBills.userId, userId)));
    return true;
  },

  async getUpcoming(userId: string, days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return db
      .select()
      .from(recurringBills)
      .where(
        and(
          eq(recurringBills.userId, userId),
          eq(recurringBills.nextDueDate, futureDate.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(recurringBills.nextDueDate));
  },

  async calculateNextDueDate(currentDate: string, frequency: RecurringBill['frequency']): Promise<string> {
    const date = new Date(currentDate);

    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date.toISOString().split('T')[0];
  },
};
