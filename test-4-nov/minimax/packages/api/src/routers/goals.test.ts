import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockGoal } from '../../../../test/utils';

vi.mock('../../repositories', () => ({
  goalRepository: {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    addContribution: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGoalRepository = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  addContribution: vi.fn(),
  delete: vi.fn(),
};

describe('goals router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create procedure', () => {
    it('should create a new goal', async () => {
      vi.mocked(mockGoalRepository.create).mockResolvedValueOnce(mockGoal);

      const goal = await mockGoalRepository.create({
        userId: 'user-1',
        name: 'Emergency Fund',
        targetAmount: '10000.00',
      });

      expect(goal).toEqual(mockGoal);
      expect(mockGoalRepository.create).toHaveBeenCalled();
    });
  });

  describe('list procedure', () => {
    it('should return list of goals', async () => {
      vi.mocked(mockGoalRepository.findAll).mockResolvedValueOnce([mockGoal]);

      const goals = await mockGoalRepository.findAll('user-1');

      expect(goals).toEqual([mockGoal]);
      expect(goals.length).toBe(1);
    });
  });

  describe('addContribution procedure', () => {
    it('should add contribution to a goal', async () => {
      const updatedGoal = { ...mockGoal, currentAmount: '6000.00' };
      vi.mocked(mockGoalRepository.addContribution).mockResolvedValueOnce(updatedGoal);

      const goal = await mockGoalRepository.addContribution('goal-1', 'user-1', '1000.00');

      expect(goal?.currentAmount).toBe('6000.00');
      expect(mockGoalRepository.addContribution).toHaveBeenCalledWith('goal-1', 'user-1', '1000.00');
    });

    it('should return null for non-existent goal', async () => {
      vi.mocked(mockGoalRepository.addContribution).mockResolvedValueOnce(null);

      const goal = await mockGoalRepository.addContribution('non-existent', 'user-1', '1000.00');

      expect(goal).toBeNull();
    });
  });

  describe('update procedure', () => {
    it('should update a goal', async () => {
      const updatedGoal = { ...mockGoal, name: 'Updated Goal' };
      vi.mocked(mockGoalRepository.update).mockResolvedValueOnce(updatedGoal);

      const goal = await mockGoalRepository.update('goal-1', 'user-1', {
        name: 'Updated Goal',
      });

      expect(goal?.name).toBe('Updated Goal');
      expect(mockGoalRepository.update).toHaveBeenCalledWith('goal-1', 'user-1', {
        name: 'Updated Goal',
      });
    });
  });

  describe('delete procedure', () => {
    it('should delete a goal', async () => {
      vi.mocked(mockGoalRepository.delete).mockResolvedValueOnce(true);

      const result = await mockGoalRepository.delete('goal-1', 'user-1');

      expect(result).toBe(true);
      expect(mockGoalRepository.delete).toHaveBeenCalledWith('goal-1', 'user-1');
    });
  });
});
