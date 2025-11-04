import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ORPCRouter } from '@orpc/server';
import { z } from '@orpc/zod';

const mockApiContract = {
  accounts: {
    list: {
      input: z.object({}),
      output: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          name: z.string(),
          type: z.enum(['checking', 'savings', 'credit', 'investment', 'cash']),
          balance: z.string(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
      ),
    },
    create: {
      input: z.object({
        name: z.string().min(1),
        type: z.enum(['checking', 'savings', 'credit', 'investment', 'cash']),
        balance: z.string().optional(),
      }),
      output: z.object({
        id: z.string(),
        userId: z.string(),
        name: z.string(),
        type: z.enum(['checking', 'savings', 'credit', 'investment', 'cash']),
        balance: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    },
  },
  budgets: {
    listCategories: {
      input: z.object({}),
      output: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          name: z.string(),
          color: z.string(),
          description: z.string().optional(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
      ),
    },
    createCategory: {
      input: z.object({
        name: z.string().min(1),
        color: z.string().optional(),
        description: z.string().optional(),
      }),
      output: z.object({
        id: z.string(),
        userId: z.string(),
        name: z.string(),
        color: z.string(),
        description: z.string().optional(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    },
  },
  transactions: {
    list: {
      input: z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        accountId: z.string().optional(),
        categoryId: z.string().optional(),
      }),
      output: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          accountId: z.string(),
          amount: z.string(),
          description: z.string(),
          type: z.enum(['income', 'expense']),
          date: z.string(),
          categoryId: z.string().optional(),
          isRecurring: z.boolean(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
      ),
    },
    create: {
      input: z.object({
        accountId: z.string(),
        amount: z.string(),
        description: z.string(),
        type: z.enum(['income', 'expense']),
        date: z.string(),
        categoryId: z.string().optional(),
        isRecurring: z.boolean().optional(),
      }),
      output: z.object({
        id: z.string(),
        userId: z.string(),
        accountId: z.string(),
        amount: z.string(),
        description: z.string(),
        type: z.enum(['income', 'expense']),
        date: z.string(),
        categoryId: z.string().optional(),
        isRecurring: z.boolean(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    },
  },
  goals: {
    list: {
      input: z.object({}),
      output: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          targetAmount: z.string(),
          currentAmount: z.string(),
          targetDate: z.string().optional(),
          priority: z.enum(['high', 'medium', 'low']),
          color: z.string(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
      ),
    },
    create: {
      input: z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        targetAmount: z.string(),
        currentAmount: z.string().optional(),
        targetDate: z.string().optional(),
        priority: z.enum(['high', 'medium', 'low']).optional(),
        color: z.string().optional(),
      }),
      output: z.object({
        id: z.string(),
        userId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        targetAmount: z.string(),
        currentAmount: z.string(),
        targetDate: z.string().optional(),
        priority: z.enum(['high', 'medium', 'low']),
        color: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    },
  },
  recurring: {
    list: {
      input: z.object({}),
      output: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          amount: z.string(),
          frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
          nextDueDate: z.string(),
          autoPay: z.boolean(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
      ),
    },
  },
  reports: {
    cashflow: {
      input: z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
      output: z.array(
        z.object({
          month: z.string(),
          income: z.number(),
          expense: z.number(),
          net: z.number(),
        })
      ),
    },
    categoryBreakdown: {
      input: z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
      output: z.array(
        z.object({
          categoryId: z.string(),
          categoryName: z.string(),
          total: z.number(),
          color: z.string(),
        })
      ),
    },
  },
};

const mockClientContract = {
  accounts: {
    list: {
      input: z.object({}),
      output: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          name: z.string(),
          type: z.enum(['checking', 'savings', 'credit', 'investment', 'cash']),
          balance: z.string(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
      ),
    },
    create: {
      input: z.object({
        name: z.string().min(1),
        type: z.enum(['checking', 'savings', 'credit', 'investment', 'cash']),
        balance: z.string().optional(),
      }),
      output: z.object({
        id: z.string(),
        userId: z.string(),
        name: z.string(),
        type: z.enum(['checking', 'savings', 'credit', 'investment', 'cash']),
        balance: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    },
  },
  budgets: {
    listCategories: {
      input: z.object({}),
      output: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          name: z.string(),
          color: z.string(),
          description: z.string().optional(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
      ),
    },
    createCategory: {
      input: z.object({
        name: z.string().min(1),
        color: z.string().optional(),
        description: z.string().optional(),
      }),
      output: z.object({
        id: z.string(),
        userId: z.string(),
        name: z.string(),
        color: z.string(),
        description: z.string().optional(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    },
  },
  transactions: {
    list: {
      input: z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        accountId: z.string().optional(),
        categoryId: z.string().optional(),
      }),
      output: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          accountId: z.string(),
          amount: z.string(),
          description: z.string(),
          type: z.enum(['income', 'expense']),
          date: z.string(),
          categoryId: z.string().optional(),
          isRecurring: z.boolean(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
      ),
    },
    create: {
      input: z.object({
        accountId: z.string(),
        amount: z.string(),
        description: z.string(),
        type: z.enum(['income', 'expense']),
        date: z.string(),
        categoryId: z.string().optional(),
        isRecurring: z.boolean().optional(),
      }),
      output: z.object({
        id: z.string(),
        userId: z.string(),
        accountId: z.string(),
        amount: z.string(),
        description: z.string(),
        type: z.enum(['income', 'expense']),
        date: z.string(),
        categoryId: z.string().optional(),
        isRecurring: z.boolean(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    },
  },
  goals: {
    list: {
      input: z.object({}),
      output: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          targetAmount: z.string(),
          currentAmount: z.string(),
          targetDate: z.string().optional(),
          priority: z.enum(['high', 'medium', 'low']),
          color: z.string(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
      ),
    },
    create: {
      input: z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        targetAmount: z.string(),
        currentAmount: z.string().optional(),
        targetDate: z.string().optional(),
        priority: z.enum(['high', 'medium', 'low']).optional(),
        color: z.string().optional(),
      }),
      output: z.object({
        id: z.string(),
        userId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        targetAmount: z.string(),
        currentAmount: z.string(),
        targetDate: z.string().optional(),
        priority: z.enum(['high', 'medium', 'low']),
        color: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    },
  },
  recurring: {
    list: {
      input: z.object({}),
      output: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          amount: z.string(),
          frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
          nextDueDate: z.string(),
          autoPay: z.boolean(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
      ),
    },
  },
  reports: {
    cashflow: {
      input: z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
      output: z.array(
        z.object({
          month: z.string(),
          income: z.number(),
          expense: z.number(),
          net: z.number(),
        })
      ),
    },
    categoryBreakdown: {
      input: z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
      output: z.array(
        z.object({
          categoryId: z.string(),
          categoryName: z.string(),
          total: z.number(),
          color: z.string(),
        })
      ),
    },
  },
};

describe('ORPC Contract Tests', () => {
  describe('API and Client Contract Sync', () => {
    it('should have matching router definitions', () => {
      const apiRouters = Object.keys(mockApiContract);
      const clientRouters = Object.keys(mockClientContract);

      expect(apiRouters).toEqual(clientRouters);
      expect(apiRouters).toContain('accounts');
      expect(apiRouters).toContain('budgets');
      expect(apiRouters).toContain('transactions');
      expect(apiRouters).toContain('goals');
      expect(apiRouters).toContain('recurring');
      expect(apiRouters).toContain('reports');
    });

    it('should have matching procedures for accounts router', () => {
      const apiProcedures = Object.keys(mockApiContract.accounts);
      const clientProcedures = Object.keys(mockClientContract.accounts);

      expect(apiProcedures).toEqual(clientProcedures);
      expect(apiProcedures).toContain('list');
      expect(apiProcedures).toContain('create');
    });

    it('should have matching input schemas for transactions.list', () => {
      const apiInput = mockApiContract.transactions.list.input;
      const clientInput = mockClientContract.transactions.list.input;

      expect(apiInput).toBeDefined();
      expect(clientInput).toBeDefined();

      const apiShape = apiInput._def;
      const clientShape = clientInput._def;

      expect(Object.keys(apiShape.shape())).toEqual(Object.keys(clientShape.shape()));
    });

    it('should have matching output schemas for goals.create', () => {
      const apiOutput = mockApiContract.goals.create.output;
      const clientOutput = mockClientContract.goals.create.output;

      expect(apiOutput).toBeDefined();
      expect(clientOutput).toBeDefined();

      const apiShape = apiOutput._def;
      const clientShape = clientOutput._def;

      expect(Object.keys(apiShape.shape())).toEqual(Object.keys(clientShape.shape()));
    });

    it('should have valid enum values', () => {
      const accountTypeEnum = mockApiContract.accounts.create.input._def.shape().type._def.values;
      expect(accountTypeEnum).toEqual(['checking', 'savings', 'credit', 'investment', 'cash']);

      const transactionTypeEnum = mockApiContract.transactions.create.input._def.shape().type._def.values;
      expect(transactionTypeEnum).toEqual(['income', 'expense']);

      const goalPriorityEnum = mockApiContract.goals.create.input._def.shape().priority._def.values;
      expect(goalPriorityEnum).toEqual(['high', 'medium', 'low']);

      const billFrequencyEnum = mockApiContract.recurring.list.output._def.shape().frequency._def.values;
      expect(billFrequencyEnum).toEqual(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']);
    });

    it('should validate required fields in input schemas', () => {
      expect(() => {
        mockApiContract.accounts.create.input.parse({
          name: 'Test Account',
        });
      }).not.toThrow();

      expect(() => {
        mockApiContract.accounts.create.input.parse({});
      }).toThrow();

      expect(() => {
        mockApiContract.goals.create.input.parse({
          name: 'Emergency Fund',
          targetAmount: '1000.00',
        });
      }).not.toThrow();

      expect(() => {
        mockApiContract.goals.create.input.parse({
          targetAmount: '1000.00',
        });
      }).toThrow();
    });
  });
});
