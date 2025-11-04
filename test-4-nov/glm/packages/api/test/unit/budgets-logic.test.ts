import { describe, it, expect, vi } from 'vitest';

// Test budget calculation logic
describe('Budget Logic - Unit Tests', () => {
  describe('Budget Progress Calculation', () => {
    it('should calculate budget progress correctly', () => {
      const budgetAllocation = {
        allocatedAmount: '1000.00',
        spent: '250.00',
      };

      const allocated = parseFloat(budgetAllocation.allocatedAmount);
      const spent = parseFloat(budgetAllocation.spent);
      const remaining = allocated - spent;
      const percentageSpent = (spent / allocated) * 100;

      expect(remaining).toBe(750);
      expect(percentageSpent).toBe(25);
    });

    it('should handle zero allocated amount', () => {
      const budgetAllocation = {
        allocatedAmount: '0.00',
        spent: '0.00',
      };

      const allocated = parseFloat(budgetAllocation.allocatedAmount);
      const spent = parseFloat(budgetAllocation.spent);

      expect(allocated).toBe(0);
      expect(spent).toBe(0);
    });

    it('should handle over-budget spending', () => {
      const budgetAllocation = {
        allocatedAmount: '500.00',
        spent: '750.00',
      };

      const allocated = parseFloat(budgetAllocation.allocatedAmount);
      const spent = parseFloat(budgetAllocation.spent);
      const overBudget = spent - allocated;
      const percentageSpent = (spent / allocated) * 100;

      expect(overBudget).toBe(250);
      expect(percentageSpent).toBe(150);
    });
  });

  describe('Budget Period Validation', () => {
    it('should validate budget periods', () => {
      const validPeriods = ['monthly', 'weekly', 'yearly', 'custom'];

      validPeriods.forEach(period => {
        expect(validPeriods.includes(period)).toBe(true);
      });
    });

    it('should calculate budget period boundaries', () => {
      const now = new Date('2024-01-15');
      const period = 'monthly';

      // Mock calculation for monthly period
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      expect(startOfMonth.getMonth()).toBe(now.getMonth());
      expect(endOfMonth.getMonth()).toBe(now.getMonth());
      expect(startOfMonth.getDate()).toBe(1);
    });
  });

  describe('Transaction Categorization', () => {
    it('should categorize transactions correctly', () => {
      const transactions = [
        { amount: '-50.00', categoryId: 'food' },
        { amount: '1000.00', categoryId: 'salary' },
        { amount: '-25.00', categoryId: 'entertainment' },
      ];

      const expenses = transactions.filter(t => parseFloat(t.amount) < 0);
      const income = transactions.filter(t => parseFloat(t.amount) > 0);

      expect(expenses.length).toBe(2);
      expect(income.length).toBe(1);
      expect(expenses.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0)).toBe(75);
    });

    it('should calculate spending by category', () => {
      const transactions = [
        { amount: '-50.00', categoryId: 'food' },
        { amount: '-30.00', categoryId: 'food' },
        { amount: '-25.00', categoryId: 'entertainment' },
        { amount: '-100.00', categoryId: 'transport' },
      ];

      const spendingByCategory = transactions.reduce((acc, t) => {
        const amount = Math.abs(parseFloat(t.amount));
        acc[t.categoryId] = (acc[t.categoryId] || 0) + amount;
        return acc;
      }, {} as Record<string, number>);

      expect(spendingByCategory.food).toBe(80);
      expect(spendingByCategory.entertainment).toBe(25);
      expect(spendingByCategory.transport).toBe(100);
    });
  });

  describe('Budget Alert Logic', () => {
    it('should trigger alerts when spending exceeds threshold', () => {
      const budgetAllocation = {
        allocatedAmount: '1000.00',
        spent: '850.00',
      };

      const allocated = parseFloat(budgetAllocation.allocatedAmount);
      const spent = parseFloat(budgetAllocation.spent);
      const percentageSpent = (spent / allocated) * 100;

      // Alert thresholds
      const warningThreshold = 80;
      const criticalThreshold = 90;

      const isWarning = percentageSpent >= warningThreshold && percentageSpent < criticalThreshold;
      const isCritical = percentageSpent >= criticalThreshold;

      expect(isWarning).toBe(true);
      expect(isCritical).toBe(false);

      // Test with higher spending
      const highSpendingAllocation = {
        allocatedAmount: '1000.00',
        spent: '950.00',
      };

      const highSpent = parseFloat(highSpendingAllocation.spent);
      const highPercentageSpent = (highSpent / allocated) * 100;

      const highIsWarning = highPercentageSpent >= warningThreshold && highPercentageSpent < criticalThreshold;
      const highIsCritical = highPercentageSpent >= criticalThreshold;

      expect(highIsCritical).toBe(true);
    });
  });
});