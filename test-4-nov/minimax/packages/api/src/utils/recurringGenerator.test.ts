import { describe, it, expect, vi } from 'vitest';
import {
  generateTransactionsFromRecurring,
  shouldGenerateTransaction,
  calculateNextBillingCycle,
  getUpcomingBills,
} from './recurringGenerator';
import { mockRecurringBill } from '../../../../test/utils';

describe('recurringGenerator', () => {
  describe('generateTransactionsFromRecurring', () => {
    it('should generate transactions for monthly bill', () => {
      const transactions = generateTransactionsFromRecurring(
        {
          ...mockRecurringBill,
          frequency: 'monthly',
          nextDueDate: '2024-01-01',
        },
        'acc-1',
        3
      );

      expect(transactions.length).toBe(3);
      expect(transactions[0].date).toBe('2024-01-01');
      expect(transactions[1].date).toBe('2024-02-01');
      expect(transactions[2].date).toBe('2024-03-01');
      expect(transactions[0].amount).toBe('100.00');
      expect(transactions[0].type).toBe('expense');
    });

    it('should use bill name as description when description is not provided', () => {
      const transactions = generateTransactionsFromRecurring(
        {
          ...mockRecurringBill,
          description: undefined,
          name: 'Rent Payment',
        },
        'acc-1',
        1
      );

      expect(transactions[0].description).toBe('Rent Payment');
    });

    it('should generate correct number of transactions based on months parameter', () => {
      const transactions = generateTransactionsFromRecurring(
        mockRecurringBill,
        'acc-1',
        12
      );

      expect(transactions.length).toBe(12);
    });

    it('should default to 6 months if months parameter not provided', () => {
      const transactions = generateTransactionsFromRecurring(
        mockRecurringBill,
        'acc-1'
      );

      expect(transactions.length).toBe(6);
    });
  });

  describe('shouldGenerateTransaction', () => {
    it('should return true when next due date is today', () => {
      const bill = {
        ...mockRecurringBill,
        nextDueDate: '2024-01-15',
      };

      const result = shouldGenerateTransaction(bill, new Date('2024-01-15'));

      expect(result).toBe(true);
    });

    it('should return true when next due date is in the past', () => {
      const bill = {
        ...mockRecurringBill,
        nextDueDate: '2024-01-10',
      };

      const result = shouldGenerateTransaction(bill, new Date('2024-01-15'));

      expect(result).toBe(true);
    });

    it('should return false when next due date is in the future', () => {
      const bill = {
        ...mockRecurringBill,
        nextDueDate: '2024-01-20',
      };

      const result = shouldGenerateTransaction(bill, new Date('2024-01-15'));

      expect(result).toBe(false);
    });
  });

  describe('calculateNextBillingCycle', () => {
    it('should calculate next billing cycle for weekly frequency', () => {
      const bill = {
        ...mockRecurringBill,
        frequency: 'weekly',
        nextDueDate: '2024-01-01',
      };

      const next = calculateNextBillingCycle(bill);

      expect(next).toBe('2024-01-08');
    });

    it('should calculate next billing cycle for monthly frequency', () => {
      const bill = {
        ...mockRecurringBill,
        frequency: 'monthly',
        nextDueDate: '2024-01-01',
      };

      const next = calculateNextBillingCycle(bill);

      expect(next).toBe('2024-02-01');
    });

    it('should calculate next billing cycle for quarterly frequency', () => {
      const bill = {
        ...mockRecurringBill,
        frequency: 'quarterly',
        nextDueDate: '2024-01-01',
      };

      const next = calculateNextBillingCycle(bill);

      expect(next).toBe('2024-04-01');
    });

    it('should calculate next billing cycle for yearly frequency', () => {
      const bill = {
        ...mockRecurringBill,
        frequency: 'yearly',
        nextDueDate: '2024-01-01',
      };

      const next = calculateNextBillingCycle(bill);

      expect(next).toBe('2025-01-01');
    });
  });

  describe('getUpcomingBills', () => {
    it('should return bills due within the specified days', () => {
      const bills = [
        { ...mockRecurringBill, nextDueDate: '2024-01-10' },
        { ...mockRecurringBill, nextDueDate: '2024-01-20' },
        { ...mockRecurringBill, nextDueDate: '2024-02-15' },
      ];

      const upcoming = getUpcomingBills(bills as any, 30);

      expect(upcoming.length).toBe(3);
    });

    it('should exclude bills due after the specified days', () => {
      const bills = [
        { ...mockRecurringBill, nextDueDate: '2024-01-10' },
        { ...mockRecurringBill, nextDueDate: '2024-01-20' },
        { ...mockRecurringBill, nextDueDate: '2024-04-01' },
      ];

      const upcoming = getUpcomingBills(bills as any, 30);

      expect(upcoming.length).toBe(2);
    });

    it('should exclude bills already due in the past', () => {
      const bills = [
        { ...mockRecurringBill, nextDueDate: '2023-12-01' },
        { ...mockRecurringBill, nextDueDate: '2024-01-15' },
      ];

      const upcoming = getUpcomingBills(bills as any, 30);

      expect(upcoming.length).toBe(1);
      expect(upcoming[0].nextDueDate).toBe('2024-01-15');
    });
  });
});
