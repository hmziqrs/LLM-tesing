import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { accounts } from '../schema/auth';
import type { InferSelectModel } from 'drizzle-orm';

export type Account = InferSelectModel<typeof accounts>;

export const accountRepository = {
  async findAll(userId: string) {
    return db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(desc(accounts.createdAt));
  },

  async findById(id: string, userId: string) {
    const result = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .limit(1);
    return result[0] || null;
  },

  async create(data: {
    userId: string;
    name: string;
    type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
    balance?: string;
  }) {
    const [account] = await db
      .insert(accounts)
      .values({
        userId: data.userId,
        name: data.name,
        type: data.type,
        balance: data.balance ?? '0.00',
      })
      .returning();
    return account;
  },

  async update(id: string, userId: string, data: Partial<Pick<Account, 'name' | 'balance' | 'type'>>) {
    const [account] = await db
      .update(accounts)
      .set(data)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning();
    return account;
  },

  async delete(id: string, userId: string) {
    await db
      .delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    return true;
  },

  async getTotalBalance(userId: string) {
    const result = await db
      .select({ balance: accounts.balance })
      .from(accounts)
      .where(eq(accounts.userId, userId));

    return result.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  },
};
