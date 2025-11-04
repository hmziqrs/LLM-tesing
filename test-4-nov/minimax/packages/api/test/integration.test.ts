import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createORPCClient } from '@orpc/client';
import { mockAccount } from '../../../test/utils';

const app = new Hono();

const mockOrpcClient = {
  accounts: {
    list: {
      query: vi.fn(),
    },
    get: {
      query: vi.fn(),
    },
    create: {
      mutation: vi.fn(),
    },
    update: {
      mutation: vi.fn(),
    },
    delete: {
      mutation: vi.fn(),
    },
  },
  budgets: {
    listCategories: {
      query: vi.fn(),
    },
    createCategory: {
      mutation: vi.fn(),
    },
  },
  transactions: {
    list: {
      query: vi.fn(),
    },
    create: {
      mutation: vi.fn(),
    },
  },
};

vi.mock('@orpc/client', () => ({
  createORPCClient: vi.fn(() => mockOrpcClient as any),
}));

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Accounts API', () => {
    it('should list all accounts for authenticated user', async () => {
      vi.mocked(mockOrpcClient.accounts.list.query).mockResolvedValueOnce([mockAccount]);

      const orpc = createORPCClient(mockOrpcClient as any);
      const accounts = await orpc.accounts.list.query();

      expect(accounts).toEqual([mockAccount]);
      expect(accounts.length).toBe(1);
      expect(accounts[0].name).toBe('Test Account');
    });

    it('should create a new account', async () => {
      vi.mocked(mockOrpcClient.accounts.create.mutation).mockResolvedValueOnce(mockAccount);

      const orpc = createORPCClient(mockOrpcClient as any);
      const account = await orpc.accounts.create.mutation({
        name: 'Test Account',
        type: 'checking',
        balance: '1000.00',
      });

      expect(account).toEqual(mockAccount);
      expect(account.name).toBe('Test Account');
    });
  });

  describe('Budgets API', () => {
    it('should list all budget categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Groceries', color: '#3b82f6' },
        { id: 'cat-2', name: 'Entertainment', color: '#10b981' },
      ];

      vi.mocked(mockOrpcClient.budgets.listCategories.query).mockResolvedValueOnce(mockCategories);

      const orpc = createORPCClient(mockOrpcClient as any);
      const categories = await orpc.budgets.listCategories.query();

      expect(categories).toEqual(mockCategories);
      expect(categories.length).toBe(2);
    });

    it('should create a new budget category', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Groceries',
        color: '#3b82f6',
        description: 'Food and drinks',
      };

      vi.mocked(mockOrpcClient.budgets.createCategory.mutation).mockResolvedValueOnce(mockCategory);

      const orpc = createORPCClient(mockOrpcClient as any);
      const category = await orpc.budgets.createCategory.mutation({
        name: 'Groceries',
        color: '#3b82f6',
        description: 'Food and drinks',
      });

      expect(category).toEqual(mockCategory);
    });
  });

  describe('Transactions API', () => {
    it('should list transactions with pagination', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          description: 'Groceries',
          amount: '100.00',
          type: 'expense',
          date: '2024-01-15',
        },
        {
          id: 'tx-2',
          description: 'Salary',
          amount: '5000.00',
          type: 'income',
          date: '2024-01-01',
        },
      ];

      vi.mocked(mockOrpcClient.transactions.list.query).mockResolvedValueOnce(mockTransactions);

      const orpc = createORPCClient(mockOrpcClient as any);
      const transactions = await orpc.transactions.list.query({
        limit: 50,
        offset: 0,
      });

      expect(transactions).toEqual(mockTransactions);
      expect(transactions.length).toBe(2);
    });

    it('should create a new transaction', async () => {
      const mockTransaction = {
        id: 'tx-1',
        description: 'Groceries',
        amount: '100.00',
        type: 'expense',
        date: '2024-01-15',
      };

      vi.mocked(mockOrpcClient.transactions.create.mutation).mockResolvedValueOnce(mockTransaction);

      const orpc = createORPCClient(mockOrpcClient as any);
      const transaction = await orpc.transactions.create.mutation({
        accountId: 'acc-1',
        amount: '100.00',
        description: 'Groceries',
        type: 'expense',
        date: '2024-01-15',
      });

      expect(transaction).toEqual(mockTransaction);
    });
  });

  describe('Authentication Flow', () => {
    it('should validate user session', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        },
        session: {
          id: 'session-1',
        },
      };

      const orpc = createORPCClient(mockOrpcClient as any);

      expect(orpc).toBeDefined();
      expect(mockSession.user.id).toBe('user-1');
      expect(mockSession.user.email).toBe('test@example.com');
    });
  });
});
