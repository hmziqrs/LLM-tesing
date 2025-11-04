import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { transactions, transactionAttachments } from '../schema/transactions';
import type { InferSelectModel } from 'drizzle-orm';

export type Transaction = InferSelectModel<typeof transactions>;
export type TransactionAttachment = InferSelectModel<typeof transactionAttachments>;

export const transactionRepository = {
  async create(data: {
    userId: string;
    accountId: string;
    amount: string;
    description: string;
    type: 'income' | 'expense';
    date: string;
    categoryId?: string;
    isRecurring?: boolean;
  }) {
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId: data.userId,
        accountId: data.accountId,
        amount: data.amount,
        description: data.description,
        type: data.type,
        date: data.date,
        categoryId: data.categoryId,
        isRecurring: data.isRecurring ?? false,
      })
      .returning();
    return transaction;
  },

  async findAll(userId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    accountId?: string;
    categoryId?: string;
  }) {
    let query = db.select().from(transactions).where(eq(transactions.userId, userId));

    if (options?.startDate) {
      query = query.where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, options.startDate)
        )
      ) as any;
    }

    if (options?.endDate) {
      query = query.where(
        and(
          eq(transactions.userId, userId),
          lte(transactions.date, options.endDate)
        )
      ) as any;
    }

    if (options?.accountId) {
      query = query.where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.accountId, options.accountId)
        )
      ) as any;
    }

    if (options?.categoryId) {
      query = query.where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.categoryId, options.categoryId)
        )
      ) as any;
    }

    query = query.orderBy(desc(transactions.date));

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return query;
  },

  async findById(id: string, userId: string) {
    const result = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);
    return result[0] || null;
  },

  async update(id: string, userId: string, data: Partial<Pick<Transaction, 'amount' | 'description' | 'date' | 'categoryId'>>) {
    const [transaction] = await db
      .update(transactions)
      .set(data)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();
    return transaction;
  },

  async delete(id: string, userId: string) {
    await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return true;
  },

  async getSpendingByCategory(userId: string, startDate: string, endDate: string) {
    const results = await db
      .select({
        categoryId: transactions.categoryId,
        total: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(transactions.categoryId);

    return results;
  },

  async getCashflow(userId: string, startDate: string, endDate: string) {
    const income = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}::numeric), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'income'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    const expense = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}::numeric), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    return {
      income: parseFloat(income[0].total),
      expense: parseFloat(expense[0].total),
    };
  },

  async addAttachment(data: {
    transactionId: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    size: number;
  }) {
    const [attachment] = await db
      .insert(transactionAttachments)
      .values({
        transactionId: data.transactionId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        mimeType: data.mimeType,
        size: data.size,
      })
      .returning();
    return attachment;
  },

  async getAttachments(transactionId: string, userId: string) {
    return db
      .select()
      .from(transactionAttachments)
      .innerJoin(transactions, eq(transactionAttachments.transactionId, transactions.id))
      .where(and(eq(transactionAttachments.transactionId, transactionId), eq(transactions.userId, userId)));
  },
};
