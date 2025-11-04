import { describe, it, expect } from 'vitest';

// Test goals calculation logic
describe('Goals Logic - Unit Tests', () => {
  describe('Goal Progress Calculation', () => {
    it('should calculate progress percentage correctly', () => {
      const goal = {
        targetAmount: '1000.00',
        currentAmount: '250.00',
      };

      const target = parseFloat(goal.targetAmount);
      const current = parseFloat(goal.currentAmount);
      const progressPercentage = Math.round((current / target) * 100);

      expect(progressPercentage).toBe(25);
    });

    it('should handle zero target amount', () => {
      const goal = {
        targetAmount: '0.00',
        currentAmount: '0.00',
      };

      const target = parseFloat(goal.targetAmount);
      const current = parseFloat(goal.currentAmount);
      const progressPercentage = target > 0 ? Math.round((current / target) * 100) : 0;

      expect(progressPercentage).toBe(0);
    });

    it('should handle completed goals', () => {
      const goal = {
        targetAmount: '500.00',
        currentAmount: '600.00',
      };

      const target = parseFloat(goal.targetAmount);
      const current = parseFloat(goal.currentAmount);
      const progressPercentage = Math.min(100, Math.round((current / target) * 100));

      expect(progressPercentage).toBe(100);
    });

    it('should handle empty current amount', () => {
      const goal = {
        targetAmount: '1000.00',
        currentAmount: '0.00',
      };

      const target = parseFloat(goal.targetAmount);
      const current = parseFloat(goal.currentAmount);
      const progressPercentage = Math.round((current / target) * 100);

      expect(progressPercentage).toBe(0);
    });
  });

  describe('Goal Status Management', () => {
    it('should mark goal as active when not completed', () => {
      const goal = {
        targetAmount: '1000.00',
        currentAmount: '250.00',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };

      const target = parseFloat(goal.targetAmount);
      const current = parseFloat(goal.currentAmount);
      const isCompleted = current >= target;
      const isOverdue = new Date(goal.deadline) < new Date() && !isCompleted;

      expect(isCompleted).toBe(false);
      expect(isOverdue).toBe(false);
    });

    it('should mark goal as completed when target reached', () => {
      const goal = {
        targetAmount: '500.00',
        currentAmount: '600.00',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const target = parseFloat(goal.targetAmount);
      const current = parseFloat(goal.currentAmount);
      const isCompleted = current >= target;

      expect(isCompleted).toBe(true);
    });

    it('should mark goal as overdue when deadline passed and not completed', () => {
      const goal = {
        targetAmount: '1000.00',
        currentAmount: '250.00',
        deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      };

      const target = parseFloat(goal.targetAmount);
      const current = parseFloat(goal.currentAmount);
      const isCompleted = current >= target;
      const isOverdue = new Date(goal.deadline) < new Date() && !isCompleted;

      expect(isCompleted).toBe(false);
      expect(isOverdue).toBe(true);
    });
  });

  describe('Contribution Processing', () => {
    it('should process contribution correctly', () => {
      const goal = {
        targetAmount: '1000.00',
        currentAmount: '250.00',
      };

      const contributionAmount = '100.00';
      const newCurrentAmount = Math.min(
        parseFloat(goal.currentAmount) + parseFloat(contributionAmount),
        parseFloat(goal.targetAmount)
      );

      expect(newCurrentAmount).toBe(350);
    });

    it('should not exceed target amount with contributions', () => {
      const goal = {
        targetAmount: '500.00',
        currentAmount: '450.00',
      };

      const contributionAmount = '100.00'; // Would exceed target
      const newCurrentAmount = Math.min(
        parseFloat(goal.currentAmount) + parseFloat(contributionAmount),
        parseFloat(goal.targetAmount)
      );

      expect(newCurrentAmount).toBe(500); // Capped at target
    });

    it('should validate contribution amount', () => {
      const validContributions = ['10.00', '100.50', '0.01'];
      const invalidContributions = ['-10.00', '0.00', 'abc', '10.000'];

      const amountRegex = /^\d+(\.\d{1,2})?$/;

      validContributions.forEach(amount => {
        expect(amountRegex.test(amount)).toBe(true);
        expect(parseFloat(amount) > 0).toBe(true);
      });

      invalidContributions.forEach(amount => {
        expect(amountRegex.test(amount) && parseFloat(amount) > 0).toBe(false);
      });
    });
  });

  describe('Goal Deadlines', () => {
    it('should calculate days until deadline', () => {
      const today = new Date('2024-01-15');
      const deadline = new Date('2024-02-15');
      const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysUntilDeadline).toBe(31);
    });

    it('should handle past deadlines', () => {
      const today = new Date('2024-01-15');
      const pastDeadline = new Date('2024-01-10');
      const daysUntilDeadline = Math.ceil((pastDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysUntilDeadline).toBe(-5);
    });

    it('should calculate monthly savings needed to reach goal', () => {
      const goal = {
        targetAmount: '1200.00',
        currentAmount: '200.00',
        deadline: new Date(Date.now() + 10 * 30 * 24 * 60 * 60 * 1000), // ~10 months
      };

      const target = parseFloat(goal.targetAmount);
      const current = parseFloat(goal.currentAmount);
      const remainingAmount = target - current;
      const monthsUntilDeadline = 10;
      const monthlySavingsNeeded = remainingAmount / monthsUntilDeadline;

      expect(monthlySavingsNeeded).toBe(100);
    });
  });

  describe('Goals Summary', () => {
    it('should calculate total goals value', () => {
      const goals = [
        { targetAmount: '1000.00', currentAmount: '250.00', status: 'active' },
        { targetAmount: '500.00', currentAmount: '500.00', status: 'completed' },
        { targetAmount: '2000.00', currentAmount: '0.00', status: 'active' },
        { targetAmount: '300.00', currentAmount: '100.00', status: 'active' },
      ];

      const totalTargetValue = goals
        .filter(goal => goal.status === 'active')
        .reduce((sum, goal) => sum + parseFloat(goal.targetAmount), 0);

      const totalCurrentValue = goals
        .filter(goal => goal.status === 'active')
        .reduce((sum, goal) => sum + parseFloat(goal.currentAmount), 0);

      expect(totalTargetValue).toBe(3300);
      expect(totalCurrentValue).toBe(350);
    });

    it('should count goals by status', () => {
      const goals = [
        { status: 'active' },
        { status: 'completed' },
        { status: 'active' },
        { status: 'active' },
        { status: 'paused' },
      ];

      const statusCounts = goals.reduce((acc, goal) => {
        acc[goal.status] = (acc[goal.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(statusCounts.active).toBe(3);
      expect(statusCounts.completed).toBe(1);
      expect(statusCounts.paused).toBe(1);
    });
  });
});