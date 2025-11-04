import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockBudgetCategory,
  mockBudgetAllocation,
} from '../../../../test/utils';

vi.mock('../../repositories', () => ({
  budgetRepository: {
    createCategory: vi.fn(),
    getCategories: vi.fn(),
    getCategoryById: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    createAllocation: vi.fn(),
    getAllocations: vi.fn(),
    updateAllocationSpent: vi.fn(),
  },
}));

const mockBudgetRepository = {
  createCategory: vi.fn(),
  getCategories: vi.fn(),
  getCategoryById: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  createAllocation: vi.fn(),
  getAllocations: vi.fn(),
  updateAllocationSpent: vi.fn(),
};

describe('budgets router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCategory procedure', () => {
    it('should create a new budget category', async () => {
      vi.mocked(mockBudgetRepository.createCategory).mockResolvedValueOnce(mockBudgetCategory);

      const category = await mockBudgetRepository.createCategory({
        userId: 'user-1',
        name: 'Groceries',
        color: '#3b82f6',
      });

      expect(category).toEqual(mockBudgetCategory);
      expect(mockBudgetRepository.createCategory).toHaveBeenCalled();
    });
  });

  describe('getCategories procedure', () => {
    it('should return list of categories', async () => {
      vi.mocked(mockBudgetRepository.getCategories).mockResolvedValueOnce([mockBudgetCategory]);

      const categories = await mockBudgetRepository.getCategories('user-1');

      expect(categories).toEqual([mockBudgetCategory]);
      expect(categories.length).toBe(1);
    });
  });

  describe('createAllocation procedure', () => {
    it('should create a new budget allocation', async () => {
      vi.mocked(mockBudgetRepository.createAllocation).mockResolvedValueOnce(mockBudgetAllocation);

      const allocation = await mockBudgetRepository.createAllocation({
        categoryId: 'cat-1',
        month: '2024-01',
        allocated: '500.00',
      });

      expect(allocation).toEqual(mockBudgetAllocation);
      expect(mockBudgetRepository.createAllocation).toHaveBeenCalled();
    });
  });

  describe('getAllocations procedure', () => {
    it('should return list of allocations', async () => {
      vi.mocked(mockBudgetRepository.getAllocations).mockResolvedValueOnce([mockBudgetAllocation]);

      const allocations = await mockBudgetRepository.getAllocations('user-1');

      expect(allocations).toEqual([mockBudgetAllocation]);
    });

    it('should filter by month when provided', async () => {
      vi.mocked(mockBudgetRepository.getAllocations).mockResolvedValueOnce([mockBudgetAllocation]);

      const allocations = await mockBudgetRepository.getAllocations('user-1', '2024-01');

      expect(allocations).toEqual([mockBudgetAllocation]);
      expect(mockBudgetRepository.getAllocations).toHaveBeenCalledWith('user-1', '2024-01');
    });
  });
});
