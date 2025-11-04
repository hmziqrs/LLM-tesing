import { vi } from 'vitest';
import { HttpResponse, http } from 'msw';

export const mockOrpcHandlers = [
  http.post('*/orpc', () => {
    return HttpResponse.json({ jsonrpc: '2.0', id: 1, result: {} });
  }),
];

export const mockAuthHandlers = [
  http.get('*/auth/getSession', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
      session: {
        id: 'test-session-id',
      },
    });
  }),
];

export const createMockSession = () => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  session: {
    id: 'test-session-id',
  },
});

export const createMockTransaction = (overrides = {}) => ({
  id: 'test-transaction-id',
  userId: 'test-user-id',
  accountId: 'test-account-id',
  amount: '100.00',
  description: 'Test Transaction',
  type: 'expense' as const,
  date: new Date().toISOString(),
  categoryId: 'test-category-id',
  ...overrides,
});

export const createMockAccount = (overrides = {}) => ({
  id: 'test-account-id',
  userId: 'test-user-id',
  name: 'Test Account',
  type: 'checking' as const,
  balance: '1000.00',
  ...overrides,
});

export const createMockBudgetCategory = (overrides = {}) => ({
  id: 'test-category-id',
  userId: 'test-user-id',
  name: 'Test Category',
  color: '#3b82f6',
  ...overrides,
});

export const createMockBudgetAllocation = (overrides = {}) => ({
  id: 'test-allocation-id',
  categoryId: 'test-category-id',
  month: '2024-01',
  allocated: '500.00',
  spent: '200.00',
  ...overrides,
});

export const createMockGoal = (overrides = {}) => ({
  id: 'test-goal-id',
  userId: 'test-user-id',
  name: 'Test Goal',
  description: 'Test Goal Description',
  targetAmount: '1000.00',
  currentAmount: '500.00',
  targetDate: '2025-12-31',
  priority: 'medium' as const,
  color: '#10b981',
  ...overrides,
});

export const createMockRecurringBill = (overrides = {}) => ({
  id: 'test-bill-id',
  userId: 'test-user-id',
  name: 'Test Bill',
  description: 'Test Bill Description',
  amount: '100.00',
  frequency: 'monthly' as const,
  nextDueDate: '2024-02-01',
  autoPay: false,
  ...overrides,
});

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockTransaction = {
  id: 'test-transaction-id',
  userId: 'test-user-id',
  accountId: 'test-account-id',
  amount: '100.00',
  description: 'Test Transaction',
  type: 'expense' as const,
  date: '2024-01-15',
  categoryId: 'test-category-id',
  isRecurring: false,
};

export const mockAccount = {
  id: 'test-account-id',
  userId: 'test-user-id',
  name: 'Test Account',
  type: 'checking' as const,
  balance: '1000.00',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockBudgetCategory = {
  id: 'test-category-id',
  userId: 'test-user-id',
  name: 'Test Category',
  color: '#3b82f6',
  description: 'Test Description',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockBudgetAllocation = {
  id: 'test-allocation-id',
  categoryId: 'test-category-id',
  month: '2024-01',
  allocated: '500.00',
  spent: '200.00',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockGoal = {
  id: 'test-goal-id',
  userId: 'test-user-id',
  name: 'Test Goal',
  description: 'Test Goal Description',
  targetAmount: '1000.00',
  currentAmount: '500.00',
  targetDate: '2025-12-31',
  priority: 'medium' as const,
  color: '#10b981',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockRecurringBill = {
  id: 'test-bill-id',
  userId: 'test-user-id',
  name: 'Test Bill',
  description: 'Test Bill Description',
  amount: '100.00',
  frequency: 'monthly' as const,
  nextDueDate: '2024-02-01',
  autoPay: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};
