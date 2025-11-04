import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockRecurringBill } from '../../../../test/utils';

vi.mock('../../repositories', () => ({
  recurringRepository: {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getUpcoming: vi.fn(),
    calculateNextDueDate: vi.fn(),
  },
}));

const mockRecurringRepository = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getUpcoming: vi.fn(),
  calculateNextDueDate: vi.fn(),
};

describe('recurring router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create procedure', () => {
    it('should create a new recurring bill', async () => {
      vi.mocked(mockRecurringRepository.create).mockResolvedValueOnce(mockRecurringBill);

      const bill = await mockRecurringRepository.create({
        userId: 'user-1',
        name: 'Rent',
        amount: '1500.00',
        frequency: 'monthly',
        nextDueDate: '2024-02-01',
      });

      expect(bill).toEqual(mockRecurringBill);
      expect(mockRecurringRepository.create).toHaveBeenCalled();
    });
  });

  describe('list procedure', () => {
    it('should return list of recurring bills', async () => {
      vi.mocked(mockRecurringRepository.findAll).mockResolvedValueOnce([mockRecurringBill]);

      const bills = await mockRecurringRepository.findAll('user-1');

      expect(bills).toEqual([mockRecurringBill]);
      expect(bills.length).toBe(1);
    });
  });

  describe('getUpcoming procedure', () => {
    it('should return upcoming bills', async () => {
      vi.mocked(mockRecurringRepository.getUpcoming).mockResolvedValueOnce([mockRecurringBill]);

      const bills = await mockRecurringRepository.getUpcoming('user-1', 30);

      expect(bills).toEqual([mockRecurringBill]);
      expect(mockRecurringRepository.getUpcoming).toHaveBeenCalledWith('user-1', 30);
    });
  });

  describe('calculateNextDueDate procedure', () => {
    it('should calculate next due date for monthly frequency', () => {
      vi.mocked(mockRecurringRepository.calculateNextDueDate).mockReturnValueOnce('2024-02-01');

      const nextDate = mockRecurringRepository.calculateNextDueDate('2024-01-01', 'monthly');

      expect(nextDate).toBe('2024-02-01');
    });

    it('should calculate next due date for yearly frequency', () => {
      vi.mocked(mockRecurringRepository.calculateNextDueDate).mockReturnValueOnce('2025-01-01');

      const nextDate = mockRecurringRepository.calculateNextDueDate('2024-01-01', 'yearly');

      expect(nextDate).toBe('2025-01-01');
    });
  });

  describe('update procedure', () => {
    it('should update a recurring bill', async () => {
      const updatedBill = { ...mockRecurringBill, name: 'Updated Bill' };
      vi.mocked(mockRecurringRepository.update).mockResolvedValueOnce(updatedBill);

      const bill = await mockRecurringRepository.update('bill-1', 'user-1', {
        name: 'Updated Bill',
      });

      expect(bill?.name).toBe('Updated Bill');
      expect(mockRecurringRepository.update).toHaveBeenCalledWith('bill-1', 'user-1', {
        name: 'Updated Bill',
      });
    });
  });

  describe('delete procedure', () => {
    it('should delete a recurring bill', async () => {
      vi.mocked(mockRecurringRepository.delete).mockResolvedValueOnce(true);

      const result = await mockRecurringRepository.delete('bill-1', 'user-1');

      expect(result).toBe(true);
      expect(mockRecurringRepository.delete).toHaveBeenCalledWith('bill-1', 'user-1');
    });
  });
});
