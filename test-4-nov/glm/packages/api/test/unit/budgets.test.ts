import { describe, it, expect, vi, beforeEach } from 'vitest';
import { budgetsRouter } from '../../src/routers/budgets';

// Mock the database and context
const mockDb = {
  query: {
    budgetCategory: {
      findMany: vi.fn(),
      findById: vi.fn(),
    },
    budgetAllocation: {
      findMany: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
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

describe('Budgets Router - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOverview', () => {
    it('should return budget overview with spending data', async () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      const mockAllocations = [
        {
          id: 1,
          userId: 'test-user-id',
          categoryId: 1,
          amount: '500.00',
          period: 'monthly',
          year: currentYear,
          month: currentMonth,
          category: {
            id: 1,
            name: 'Groceries',
            color: '#00C49F',
          },
        },
        {
          id: 2,
          userId: 'test-user-id',
          categoryId: 2,
          amount: '200.00',
          period: 'monthly',
          year: currentYear,
          month: currentMonth,
          category: {
            id: 2,
            name: 'Gas',
            color: '#FF8042',
          },
        },
      ];

      mockDb.query.budgetAllocation.findMany.mockResolvedValue(mockAllocations);

      const result = await budgetsRouter.getOverview.handler({
        context: mockContext,
        input: { year: currentYear, month: currentMonth },
      });

      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('totalBudget');
      expect(result).toHaveProperty('totalSpent');
      expect(result.categories).toHaveLength(2);
    });
  });

  describe('createCategory', () => {
    it('should create a new budget category', async () => {
      const newCategory = {
        name: 'Entertainment',
        color: '#8884D8',
      };

      const mockCreatedCategory = {
        id: 3,
        userId: 'test-user-id',
        ...newCategory,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockCreatedCategory]),
      };
      mockDb.insert.mockReturnValue(mockChain);

      const result = await budgetsRouter.createCategory.handler({
        context: mockContext,
        input: newCategory,
      });

      expect(result).toEqual(mockCreatedCategory);
    });
  });

  describe('allocateBudget', () => {
    it('should allocate budget to a category', async () => {
      const allocation = {
        categoryId: 1,
        amount: '300.00',
        period: 'monthly' as const,
        year: 2024,
        month: 1,
      };

      const mockAllocation = {
        id: 1,
        userId: 'test-user-id',
        ...allocation,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockAllocation]),
      };
      mockDb.insert.mockReturnValue(mockChain);

      const result = await budgetsRouter.allocateBudget.handler({
        context: mockContext,
        input: allocation,
      });

      expect(result).toEqual(mockAllocation);
    });
  });
});