import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recurringRepository } from './recurring';
import { recurringBills } from '../schema/recurring';

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

describe('recurringRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBill = {
    id: 'bill-1',
    userId: 'user-1',
    name: 'Rent',
    description: 'Monthly rent payment',
    amount: '1500.00',
    frequency: 'monthly' as const,
    nextDueDate: '2024-02-01',
    autoPay: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a new recurring bill', async () => {
      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBill]),
        }),
      });

      const result = await recurringRepository.create({
        userId: 'user-1',
        name: 'Rent',
        description: 'Monthly rent payment',
        amount: '1500.00',
        frequency: 'monthly',
        nextDueDate: '2024-02-01',
        autoPay: true,
      });

      expect(result).toEqual(mockBill);
      expect(mockDb.insert).toHaveBeenCalledWith(recurringBills, expect.any(Object));
    });
  });

  describe('findAll', () => {
    it('should return all bills for a user', async () => {
      const mockData = [mockBill];
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockData),
          }),
        }),
      });

      const result = await recurringRepository.findAll('user-1');

      expect(result).toEqual(mockData);
    });
  });

  describe('calculateNextDueDate', () => {
    it('should calculate next due date for weekly frequency', () => {
      const startDate = '2024-01-01';
      const next = recurringRepository.calculateNextDueDate(startDate, 'weekly');
      expect(next).toBe('2024-01-08');
    });

    it('should calculate next due date for biweekly frequency', () => {
      const startDate = '2024-01-01';
      const next = recurringRepository.calculateNextDueDate(startDate, 'biweekly');
      expect(next).toBe('2024-01-15');
    });

    it('should calculate next due date for monthly frequency', () => {
      const startDate = '2024-01-01';
      const next = recurringRepository.calculateNextDueDate(startDate, 'monthly');
      expect(next).toBe('2024-02-01');
    });

    it('should calculate next due date for quarterly frequency', () => {
      const startDate = '2024-01-01';
      const next = recurringRepository.calculateNextDueDate(startDate, 'quarterly');
      expect(next).toBe('2024-04-01');
    });

    it('should calculate next due date for yearly frequency', () => {
      const startDate = '2024-01-01';
      const next = recurringRepository.calculateNextDueDate(startDate, 'yearly');
      expect(next).toBe('2025-01-01');
    });
  });
});
