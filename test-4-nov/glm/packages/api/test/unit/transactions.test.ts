import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transactionsRouter } from '../../src/routers/transactions';

// Mock the database and context
const mockDb = {
  query: {
    transaction: {
      findMany: vi.fn(),
      findById: vi.fn(),
    },
    financialAccount: {
      findById: vi.fn(),
    },
    budgetCategory: {
      findById: vi.fn(),
    },
  },
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockContext = {
  session: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
  },
  db: mockDb,
};

describe('Transactions Router - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all transactions for the authenticated user', async () => {
      const mockTransactions = [
        {
          id: 1,
          userId: 'test-user-id',
          accountId: 1,
          categoryId: 1,
          amount: '-50.00',
          type: 'expense',
          description: 'Grocery shopping',
          date: new Date(),
          note: 'Weekly groceries',
          createdAt: new Date(),
          updatedAt: new Date(),
          account: { id: 1, name: 'Checking Account' },
          category: { id: 1, name: 'Groceries' },
        },
      ];

      mockDb.query.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await transactionsRouter.getAll.handler({
        context: mockContext,
        input: { limit: 50, offset: 0 },
      });

      expect(mockDb.query.transaction.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        with: expect.any(Object),
        orderBy: expect.any(Function),
        limit: 50,
        offset: 0,
      });
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('create', () => {
    it('should create a new expense transaction', async () => {
      const newTransaction = {
        accountId: 1,
        categoryId: 1,
        amount: '-75.00',
        type: 'expense' as const,
        description: 'Restaurant dinner',
        date: new Date(),
        note: 'Date night',
      };

      const mockCreatedTransaction = {
        id: 2,
        userId: 'test-user-id',
        ...newTransaction,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockCreatedTransaction]),
      };
      mockDb.insert.mockReturnValue(mockChain);

      const result = await transactionsRouter.create.handler({
        context: mockContext,
        input: newTransaction,
      });

      expect(result).toEqual(mockCreatedTransaction);
    });

    it('should create an income transaction', async () => {
      const incomeTransaction = {
        accountId: 1,
        categoryId: null,
        amount: '3000.00',
        type: 'income' as const,
        description: 'Monthly salary',
        date: new Date(),
      };

      const mockCreatedTransaction = {
        id: 3,
        userId: 'test-user-id',
        ...incomeTransaction,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockCreatedTransaction]),
      };
      mockDb.insert.mockReturnValue(mockChain);

      const result = await transactionsRouter.create.handler({
        context: mockContext,
        input: incomeTransaction,
      });

      expect(result).toEqual(mockCreatedTransaction);
    });
  });

  describe('getSummary', () => {
    it('should return transaction summary with income and expenses', async () => {
      const mockTransactions = [
        { amount: '3000.00', type: 'income' },
        { amount: '-50.00', type: 'expense' },
        { amount: '-75.00', type: 'expense' },
        { amount: '-200.00', type: 'expense' },
      ];

      mockDb.query.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await transactionsRouter.getSummary.handler({
        context: mockContext,
        input: {
          startDate: new Date(2024, 0, 1),
          endDate: new Date(2024, 0, 31),
        },
      });

      expect(result).toEqual({
        income: '3000.00',
        expenses: '325.00',
        net: '2675.00',
        count: 4,
      });
    });

    it('should handle empty transaction list', async () => {
      mockDb.query.transaction.findMany.mockResolvedValue([]);

      const result = await transactionsRouter.getSummary.handler({
        context: mockContext,
        input: {
          startDate: new Date(2024, 0, 1),
          endDate: new Date(2024, 0, 31),
        },
      });

      expect(result).toEqual({
        income: '0.00',
        expenses: '0.00',
        net: '0.00',
        count: 0,
      });
    });
  });

  describe('delete', () => {
    it('should delete a transaction', async () => {
      const mockDeletedTransaction = {
        id: 1,
        userId: 'test-user-id',
        accountId: 1,
        categoryId: 1,
        amount: '-50.00',
        type: 'expense',
        description: 'Old transaction',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockChain = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockDeletedTransaction]),
      };
      mockDb.delete.mockReturnValue(mockChain);

      const result = await transactionsRouter.delete.handler({
        context: mockContext,
        input: { id: 1 },
      });

      expect(result).toEqual(mockDeletedTransaction);
    });
  });
});