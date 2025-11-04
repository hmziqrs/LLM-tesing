import { describe, it, expect, vi, beforeEach } from 'vitest';
import { budgetRepository } from './budgets';
import { budgetCategories, budgetAllocations } from '../schema/budget';

vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as any;

vi.mocked(mockDb.select).mockReturnThis();
vi.mocked(mockDb.insert).mockReturnThis();
vi.mocked(mockDb.update).mockReturnThis();
vi.mocked(mockDb.delete).mockReturnThis();

describe('budgetRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCategory = {
    id: 'cat-1',
    userId: 'user-1',
    name: 'Groceries',
    color: '#3b82f6',
    description: 'Food and drinks',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAllocation = {
    id: 'alloc-1',
    categoryId: 'cat-1',
    month: '2024-01',
    allocated: '500.00',
    spent: '200.00',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createCategory', () => {
    it('should create a new budget category', async () => {
      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCategory]),
        }),
      });

      const result = await budgetRepository.createCategory({
        userId: 'user-1',
        name: 'Groceries',
        color: '#3b82f6',
        description: 'Food and drinks',
      });

      expect(result).toEqual(mockCategory);
      expect(mockDb.insert).toHaveBeenCalledWith(budgetCategories, expect.any(Object));
    });
  });

  describe('getCategories', () => {
    it('should return all categories for a user', async () => {
      const mockData = [mockCategory];
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockData),
          }),
        }),
      });

      const result = await budgetRepository.getCategories('user-1');

      expect(result).toEqual(mockData);
    });
  });

  describe('createAllocation', () => {
    it('should create a new budget allocation', async () => {
      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockAllocation]),
        }),
      });

      const result = await budgetRepository.createAllocation({
        categoryId: 'cat-1',
        month: '2024-01',
        allocated: '500.00',
      });

      expect(result).toEqual(mockAllocation);
    });
  });

  describe('getAllocations', () => {
    it('should return allocations for a user', async () => {
      const mockData = [mockAllocation];
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockData),
            }),
          }),
        }),
      });

      const result = await budgetRepository.getAllocations('user-1');

      expect(result).toEqual(mockData);
    });

    it('should filter by month when provided', async () => {
      const mockData = [mockAllocation];
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockData),
            }),
          }),
        }),
      });

      const result = await budgetRepository.getAllocations('user-1', '2024-01');

      expect(result).toEqual(mockData);
    });
  });
});
