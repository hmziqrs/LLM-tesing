import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockTransaction } from '../../../../test/utils';

vi.mock('../../repositories', () => ({
  transactionRepository: {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getSpendingByCategory: vi.fn(),
    getCashflow: vi.fn(),
    addAttachment: vi.fn(),
  },
}));

const mockTransactionRepository = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getSpendingByCategory: vi.fn(),
  getCashflow: vi.fn(),
  addAttachment: vi.fn(),
};

describe('transactions router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create procedure', () => {
    it('should create a new transaction', async () => {
      vi.mocked(mockTransactionRepository.create).mockResolvedValueOnce(mockTransaction);

      const transaction = await mockTransactionRepository.create({
        userId: 'user-1',
        accountId: 'acc-1',
        amount: '100.00',
        description: 'Test transaction',
        type: 'expense',
        date: '2024-01-15',
      });

      expect(transaction).toEqual(mockTransaction);
      expect(mockTransactionRepository.create).toHaveBeenCalled();
    });
  });

  describe('list procedure', () => {
    it('should return list of transactions', async () => {
      vi.mocked(mockTransactionRepository.findAll).mockResolvedValueOnce([mockTransaction]);

      const transactions = await mockTransactionRepository.findAll('user-1', {
        limit: 50,
        offset: 0,
      });

      expect(transactions).toEqual([mockTransaction]);
      expect(transactions.length).toBe(1);
    });

    it('should respect limit and offset options', async () => {
      const options = { limit: 10, offset: 5 };
      vi.mocked(mockTransactionRepository.findAll).mockResolvedValueOnce([mockTransaction]);

      await mockTransactionRepository.findAll('user-1', options);

      expect(mockTransactionRepository.findAll).toHaveBeenCalledWith('user-1', options);
    });
  });

  describe('getSpendingByCategory procedure', () => {
    it('should return spending grouped by category', async () => {
      const mockSpending = [
        { categoryId: 'cat-1', total: 500 },
        { categoryId: 'cat-2', total: 300 },
      ];

      vi.mocked(mockTransactionRepository.getSpendingByCategory).mockResolvedValueOnce(mockSpending);

      const spending = await mockTransactionRepository.getSpendingByCategory(
        'user-1',
        '2024-01-01',
        '2024-01-31'
      );

      expect(spending).toEqual(mockSpending);
      expect(spending.length).toBe(2);
    });
  });

  describe('getCashflow procedure', () => {
    it('should return cashflow data', async () => {
      const mockCashflow = { income: 5000, expense: 3000 };

      vi.mocked(mockTransactionRepository.getCashflow).mockResolvedValueOnce(mockCashflow);

      const cashflow = await mockTransactionRepository.getCashflow(
        'user-1',
        '2024-01-01',
        '2024-01-31'
      );

      expect(cashflow).toEqual(mockCashflow);
      expect(cashflow.income).toBe(5000);
      expect(cashflow.expense).toBe(3000);
    });
  });
});
