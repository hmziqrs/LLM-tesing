import { describe, it, expect } from 'vitest';
import {
  calculateBudgetProgress,
  calculateBudgetSummary,
  calculateMonthlySummary,
  getBudgetWarnings,
  calculateNetIncome,
  suggestBudgetAdjustments,
} from './budgeting';
import { mockBudgetCategory, mockBudgetAllocation } from '../../../../test/utils';

describe('budgeting utilities', () => {
  describe('calculateBudgetProgress', () => {
    it('should calculate correct progress percentage', () => {
      expect(calculateBudgetProgress(500, 250)).toBe(50);
      expect(calculateBudgetProgress(500, 500)).toBe(100);
      expect(calculateBudgetProgress(500, 750)).toBe(100);
    });

    it('should handle zero allocation', () => {
      expect(calculateBudgetProgress(0, 100)).toBe(0);
    });

    it('should handle string inputs', () => {
      expect(calculateBudgetProgress('500', '250')).toBe(50);
    });
  });

  describe('calculateBudgetSummary', () => {
    it('should calculate budget summaries for allocations', () => {
      const allocations = [
        {
          ...mockBudgetAllocation,
          categoryId: 'cat-1',
          allocated: '500.00',
          spent: '300.00',
        },
        {
          ...mockBudgetAllocation,
          categoryId: 'cat-2',
          allocated: '1000.00',
          spent: '800.00',
        },
      ];

      const categories = [
        { ...mockBudgetCategory, id: 'cat-1', name: 'Groceries' },
        { ...mockBudgetCategory, id: 'cat-2', name: 'Entertainment' },
      ];

      const summaries = calculateBudgetSummary(allocations as any, categories as any);

      expect(summaries.length).toBe(2);
      expect(summaries[0].categoryName).toBe('Groceries');
      expect(summaries[0].allocated).toBe(500);
      expect(summaries[0].spent).toBe(300);
      expect(summaries[0].remaining).toBe(200);
      expect(summaries[0].progress).toBe(60);

      expect(summaries[1].categoryName).toBe('Entertainment');
      expect(summaries[1].allocated).toBe(1000);
      expect(summaries[1].spent).toBe(800);
      expect(summaries[1].remaining).toBe(200);
      expect(summaries[1].progress).toBe(80);
    });

    it('should handle unknown category gracefully', () => {
      const allocations = [
        {
          ...mockBudgetAllocation,
          categoryId: 'cat-unknown',
          allocated: '500.00',
          spent: '250.00',
        },
      ];

      const categories: any[] = [];

      const summaries = calculateBudgetSummary(allocations as any, categories);

      expect(summaries[0].categoryName).toBe('Unknown Category');
    });
  });

  describe('calculateMonthlySummary', () => {
    it('should calculate monthly summary for specific month', () => {
      const allocations = [
        {
          ...mockBudgetAllocation,
          month: '2024-01',
          categoryId: 'cat-1',
          allocated: '500.00',
          spent: '300.00',
        },
        {
          ...mockBudgetAllocation,
          month: '2024-02',
          categoryId: 'cat-1',
          allocated: '600.00',
          spent: '200.00',
        },
      ];

      const categories = [
        { ...mockBudgetCategory, id: 'cat-1', name: 'Groceries' },
      ];

      const summary = calculateMonthlySummary(
        allocations as any,
        categories as any,
        '2024-01'
      );

      expect(summary.month).toBe('2024-01');
      expect(summary.totalAllocated).toBe(500);
      expect(summary.totalSpent).toBe(300);
      expect(summary.totalRemaining).toBe(200);
      expect(summary.categories.length).toBe(1);
    });
  });

  describe('getBudgetWarnings', () => {
    it('should return warnings for budgets approaching limit', () => {
      const summaries = [
        {
          categoryId: 'cat-1',
          categoryName: 'Groceries',
          allocated: 500,
          spent: 450,
          remaining: 50,
          progress: 90,
        },
        {
          categoryId: 'cat-2',
          categoryName: 'Entertainment',
          allocated: 1000,
          spent: 1100,
          remaining: -100,
          progress: 110,
        },
      ];

      const warnings = getBudgetWarnings(summaries);

      expect(warnings.length).toBe(2);
      expect(warnings[0]).toContain('almost exceeded');
      expect(warnings[1]).toContain('Budget exceeded');
    });

    it('should not return warnings for budgets under 90%', () => {
      const summaries = [
        {
          categoryId: 'cat-1',
          categoryName: 'Groceries',
          allocated: 500,
          spent: 250,
          remaining: 250,
          progress: 50,
        },
      ];

      const warnings = getBudgetWarnings(summaries);

      expect(warnings.length).toBe(0);
    });
  });

  describe('calculateNetIncome', () => {
    it('should calculate net income correctly', () => {
      const result = calculateNetIncome(5000, 3000);

      expect(result.net).toBe(2000);
      expect(result.percentage).toBe(40);
    });

    it('should calculate negative net correctly', () => {
      const result = calculateNetIncome(3000, 5000);

      expect(result.net).toBe(-2000);
      expect(result.percentage).toBe(40);
    });

    it('should handle zero income', () => {
      const result = calculateNetIncome(0, 1000);

      expect(result.net).toBe(-1000);
      expect(result.percentage).toBe(0);
    });
  });

  describe('suggestBudgetAdjustments', () => {
    it('should suggest adjustments for overspent categories', () => {
      const summaries = [
        {
          categoryId: 'cat-1',
          categoryName: 'Groceries',
          allocated: 500,
          spent: 600,
          remaining: -100,
          progress: 120,
        },
        {
          categoryId: 'cat-2',
          categoryName: 'Entertainment',
          allocated: 1000,
          spent: 800,
          remaining: 200,
          progress: 80,
        },
      ];

      const suggestions = suggestBudgetAdjustments(summaries, 500);

      expect(suggestions.length).toBe(1);
      expect(suggestions[0].categoryId).toBe('cat-1');
      expect(suggestions[0].suggestedAmount).toBe(110);
    });
  });
});
