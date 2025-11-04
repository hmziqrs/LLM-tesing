import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transactionRepository } from './transactions';
import { transactions, transactionAttachments } from '../schema/transactions';

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

describe('transactionRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTransaction = {
    id: 'tx-1',
    userId: 'user-1',
    accountId: 'acc-1',
    amount: '100.00',
    description: 'Test transaction',
    type: 'expense' as const,
    date: '2024-01-15',
    categoryId: 'cat-1',
    isRecurring: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a new transaction', async () => {
      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockTransaction]),
        }),
      });

      const result = await transactionRepository.create({
        userId: 'user-1',
        accountId: 'acc-1',
        amount: '100.00',
        description: 'Test transaction',
        type: 'expense',
        date: '2024-01-15',
        categoryId: 'cat-1',
      });

      expect(result).toEqual(mockTransaction);
      expect(mockDb.insert).toHaveBeenCalledWith(transactions, expect.any(Object));
    });
  });

  describe('findAll', () => {
    it('should return all transactions for a user', async () => {
      const mockData = [mockTransaction];
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockData),
          }),
        }),
      });

      const result = await transactionRepository.findAll('user-1');

      expect(result).toEqual(mockData);
    });

    it('should respect limit and offset', async () => {
      const mockData = [mockTransaction];
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockData),
              }),
            }),
          }),
        }),
      });

      const result = await transactionRepository.findAll('user-1', {
        limit: 10,
        offset: 5,
      });

      expect(result).toEqual(mockData);
    });
  });

  describe('getSpendingByCategory', () => {
    it('should return spending grouped by category', async () => {
      const mockData = [
        { categoryId: 'cat-1', total: 500 },
        { categoryId: 'cat-2', total: 300 },
      ];

      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue(mockData),
          }),
        }),
      });

      const result = await transactionRepository.getSpendingByCategory(
        'user-1',
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toEqual(mockData);
    });
  });

  describe('getCashflow', () => {
    it('should return income and expense totals', async () => {
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: '5000' }]),
        }),
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: '3000' }]),
        }),
      });

      const result = await transactionRepository.getCashflow(
        'user-1',
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toEqual({ income: 5000, expense: 3000 });
    });
  });
});
