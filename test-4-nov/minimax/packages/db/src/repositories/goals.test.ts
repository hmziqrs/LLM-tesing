import { describe, it, expect, vi, beforeEach } from 'vitest';
import { goalRepository } from './goals';
import { savingsGoals } from '../schema/goals';

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

describe('goalRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockGoal = {
    id: 'goal-1',
    userId: 'user-1',
    name: 'Emergency Fund',
    description: '6 months of expenses',
    targetAmount: '10000.00',
    currentAmount: '5000.00',
    targetDate: '2025-12-31',
    priority: 'high' as const,
    color: '#10b981',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a new savings goal', async () => {
      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockGoal]),
        }),
      });

      const result = await goalRepository.create({
        userId: 'user-1',
        name: 'Emergency Fund',
        description: '6 months of expenses',
        targetAmount: '10000.00',
        currentAmount: '5000.00',
        targetDate: '2025-12-31',
        priority: 'high',
        color: '#10b981',
      });

      expect(result).toEqual(mockGoal);
      expect(mockDb.insert).toHaveBeenCalledWith(savingsGoals, expect.any(Object));
    });
  });

  describe('findAll', () => {
    it('should return all goals for a user', async () => {
      const mockData = [mockGoal];
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockData),
          }),
        }),
      });

      const result = await goalRepository.findAll('user-1');

      expect(result).toEqual(mockData);
    });
  });

  describe('addContribution', () => {
    it('should add contribution to a goal', async () => {
      const updatedGoal = { ...mockGoal, currentAmount: '6000.00' };
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockGoal]),
          }),
        }),
      });

      vi.mocked(mockDb.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedGoal]),
          }),
        }),
      });

      const result = await goalRepository.addContribution('goal-1', 'user-1', '1000.00');

      expect(result?.currentAmount).toBe('6000.00');
    });

    it('should return null if goal not found', async () => {
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await goalRepository.addContribution('non-existent', 'user-1', '1000.00');

      expect(result).toBeNull();
    });
  });

  describe('getTotalSaved', () => {
    it('should return total saved across all goals', async () => {
      const mockGoals = [
        { currentAmount: '5000.00' },
        { currentAmount: '3000.00' },
        { currentAmount: '2000.00' },
      ];

      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockGoals),
        }),
      });

      const result = await goalRepository.getTotalSaved('user-1');

      expect(result).toBe(10000);
    });
  });
});
