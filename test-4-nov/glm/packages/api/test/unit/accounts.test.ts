import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountsRouter } from '../../src/routers/accounts';
import { z } from 'zod';

// Mock the database and context
const mockDb = {
  query: {
    financialAccount: {
      findMany: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
  },
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockContext = {
  session: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
  },
  db: mockDb,
};

describe('Accounts Router - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all financial accounts for the authenticated user', async () => {
      const mockAccounts = [
        {
          id: 1,
          userId: 'test-user-id',
          name: 'Checking Account',
          type: 'checking',
          balance: '1000.00',
          currency: 'USD',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 'test-user-id',
          name: 'Savings Account',
          type: 'savings',
          balance: '5000.00',
          currency: 'USD',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.query.financialAccount.findMany.mockResolvedValue(mockAccounts);

      const result = await accountsRouter.getAll.handler({
        context: mockContext,
        input: undefined,
      });

      expect(mockDb.query.financialAccount.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: expect.any(Function),
      });
      expect(result).toEqual(mockAccounts);
    });
  });

  describe('create', () => {
    it('should create a new financial account', async () => {
      const newAccount = {
        name: 'Credit Card',
        type: 'credit_card' as const,
        balance: '0.00',
        currency: 'USD',
        description: 'Test credit card account',
      };

      const mockCreatedAccount = {
        id: 3,
        userId: 'test-user-id',
        ...newAccount,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: expect.any(Function),
        returning: expect.any(Function),
      });

      // Mock the chain
      const mockChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockCreatedAccount]),
      };
      mockDb.insert.mockReturnValue(mockChain);

      const result = await accountsRouter.create.handler({
        context: mockContext,
        input: newAccount,
      });

      expect(result).toEqual(mockCreatedAccount);
    });

    it('should validate account type', async () => {
      const invalidAccount = {
        name: 'Invalid Account',
        type: 'invalid_type' as any,
        balance: '0.00',
        currency: 'USD',
      };

      // This should be validated by Zod schema before reaching the handler
      // The test shows that the schema validation works
      expect(() => {
        accountsRouter.create.handler({
          context: mockContext,
          input: invalidAccount,
        });
      }).toThrow();
    });
  });

  describe('getById', () => {
    it('should return account by ID for the authenticated user', async () => {
      const mockAccount = {
        id: 1,
        userId: 'test-user-id',
        name: 'Checking Account',
        type: 'checking',
        balance: '1000.00',
        currency: 'USD',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.query.financialAccount.findById.mockResolvedValue(mockAccount);

      const result = await accountsRouter.getById.handler({
        context: mockContext,
        input: { id: 1 },
      });

      expect(mockDb.query.financialAccount.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('update', () => {
    it('should update an existing account', async () => {
      const updateData = {
        id: 1,
        name: 'Updated Checking Account',
        balance: '1500.00',
      };

      const mockUpdatedAccount = {
        id: 1,
        userId: 'test-user-id',
        name: 'Updated Checking Account',
        type: 'checking',
        balance: '1500.00',
        currency: 'USD',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedAccount]),
      };
      mockDb.update.mockReturnValue(mockChain);

      const result = await accountsRouter.update.handler({
        context: mockContext,
        input: updateData,
      });

      expect(result).toEqual(mockUpdatedAccount);
    });
  });

  describe('delete', () => {
    it('should delete an account', async () => {
      const mockDeletedAccount = {
        id: 1,
        userId: 'test-user-id',
        name: 'Account to Delete',
        type: 'checking',
        balance: '0.00',
        currency: 'USD',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockDeletedAccount]),
      };
      mockDb.update.mockReturnValue(mockChain);

      const result = await accountsRouter.delete.handler({
        context: mockContext,
        input: { id: 1 },
      });

      expect(result).toEqual(mockDeletedAccount);
    });
  });

  describe('getSummary', () => {
    it('should return account summary with total balance and count', async () => {
      const mockAccounts = [
        { balance: '1000.00', isActive: true },
        { balance: '2000.00', isActive: true },
        { balance: '500.00', isActive: false },
      ];

      mockDb.query.financialAccount.findMany.mockResolvedValue(mockAccounts);

      const result = await accountsRouter.getSummary.handler({
        context: mockContext,
        input: undefined,
      });

      expect(result).toEqual({
        totalBalance: '3000.00', // Only active accounts
        accountCount: 2,
      });
    });

    it('should handle zero accounts', async () => {
      mockDb.query.financialAccount.findMany.mockResolvedValue([]);

      const result = await accountsRouter.getSummary.handler({
        context: mockContext,
        input: undefined,
      });

      expect(result).toEqual({
        totalBalance: '0.00',
        accountCount: 0,
      });
    });
  });
});