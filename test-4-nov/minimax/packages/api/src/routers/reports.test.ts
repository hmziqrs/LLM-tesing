import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories', () => ({
  transactionRepository: {
    getCashflow: vi.fn(),
    getSpendingByCategory: vi.fn(),
  },
}));

const mockTransactionRepository = {
  getCashflow: vi.fn(),
  getSpendingByCategory: vi.fn(),
};

describe('reports router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cashflow procedure', () => {
    it('should return cashflow data', async () => {
      const mockCashflow = [
        { month: '2024-01', income: 5000, expense: 3000, net: 2000 },
        { month: '2024-02', income: 4500, expense: 2800, net: 1700 },
      ];

      vi.mocked(mockTransactionRepository.getCashflow).mockImplementation((userId, start, end) => {
        if (start === '2024-01-01' && end === '2024-01-31') {
          return Promise.resolve({ income: 5000, expense: 3000 });
        } else if (start === '2024-02-01' && end === '2024-02-29') {
          return Promise.resolve({ income: 4500, expense: 2800 });
        }
        return Promise.resolve({ income: 0, expense: 0 });
      });

      const jan = await mockTransactionRepository.getCashflow('user-1', '2024-01-01', '2024-01-31');
      const feb = await mockTransactionRepository.getCashflow('user-1', '2024-02-01', '2024-02-29');

      expect(jan.income).toBe(5000);
      expect(jan.expense).toBe(3000);
      expect(feb.income).toBe(4500);
      expect(feb.expense).toBe(2800);
    });
  });

  describe('categoryBreakdown procedure', () => {
    it('should return spending breakdown by category', async () => {
      const mockSpending = [
        { categoryId: 'cat-1', total: 500 },
        { categoryId: 'cat-2', total: 300 },
        { categoryId: 'cat-3', total: 200 },
      ];

      vi.mocked(mockTransactionRepository.getSpendingByCategory).mockResolvedValueOnce(mockSpending);

      const spending = await mockTransactionRepository.getSpendingByCategory(
        'user-1',
        '2024-01-01',
        '2024-01-31'
      );

      expect(spending).toEqual(mockSpending);
      expect(spending.length).toBe(3);
      expect(spending[0].total).toBe(500);
    });

    it('should return empty array when no spending data', async () => {
      vi.mocked(mockTransactionRepository.getSpendingByCategory).mockResolvedValueOnce([]);

      const spending = await mockTransactionRepository.getSpendingByCategory(
        'user-1',
        '2024-01-01',
        '2024-01-31'
      );

      expect(spending).toEqual([]);
      expect(spending.length).toBe(0);
    });
  });

  describe('exportCSV procedure', () => {
    it('should export transactions as CSV', async () => {
      const transactions = [
        {
          id: 'tx-1',
          date: '2024-01-15',
          description: 'Test Transaction',
          amount: '100.00',
          type: 'expense',
          categoryName: 'Groceries',
        },
      ];

      const csv = transactions.map(t => `${t.date},${t.description},${t.amount},${t.type},${t.categoryName}`).join('\n');

      expect(csv).toContain('2024-01-15');
      expect(csv).toContain('Test Transaction');
      expect(csv).toContain('100.00');
    });
  });
});
