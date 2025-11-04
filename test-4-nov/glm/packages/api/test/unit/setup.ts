import { vi } from 'vitest';

// Mock the database schema exports
vi.mock('@glm/db/schema', () => ({
  // Auth schemas
  user: {
    id: 'id',
    email: 'email',
    name: 'name',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  account: {
    id: 'id',
    userId: 'user_id',
    type: 'type',
    provider: 'provider',
    providerAccountId: 'provider_account_id',
    refresh_token: 'refresh_token',
    access_token: 'access_token',
    expires_at: 'expires_at',
    token_type: 'token_type',
    scope: 'scope',
    id_token: 'id_token',
    session_state: 'session_state',
  },
  session: {
    id: 'id',
    sessionToken: 'session_token',
    userId: 'user_id',
    expires: 'expires',
  },

  // Business logic schemas
  financialAccount: {
    id: 'id',
    userId: 'user_id',
    name: 'name',
    type: 'type',
    balance: 'balance',
    currency: 'currency',
    description: 'description',
    isActive: 'is_active',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  accountType: vi.fn(),

  budgetCategory: {
    id: 'id',
    userId: 'user_id',
    name: 'name',
    description: 'description',
    color: 'color',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },

  budgetAllocation: {
    id: 'id',
    userId: 'user_id',
    categoryId: 'category_id',
    allocatedAmount: 'allocated_amount',
    period: 'period',
    startDate: 'start_date',
    endDate: 'end_date',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },

  transaction: {
    id: 'id',
    userId: 'user_id',
    accountId: 'account_id',
    categoryId: 'category_id',
    amount: 'amount',
    type: 'type',
    description: 'description',
    date: 'date',
    balance: 'balance',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },

  recurringBill: {
    id: 'id',
    userId: 'user_id',
    name: 'name',
    description: 'description',
    amount: 'amount',
    frequency: 'frequency',
    dueDate: 'due_date',
    isActive: 'is_active',
    lastProcessed: 'last_processed',
    nextDueDate: 'next_due_date',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },

  goal: {
    id: 'id',
    userId: 'user_id',
    name: 'name',
    description: 'description',
    targetAmount: 'target_amount',
    currentAmount: 'current_amount',
    deadline: 'deadline',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  desc: vi.fn(),
  asc: vi.fn(),
  like: vi.fn(),
  ilike: vi.fn(),
  gte: vi.fn(),
  gt: vi.fn(),
  lte: vi.fn(),
  lt: vi.fn(),
  sum: vi.fn(),
  count: vi.fn(),
  sql: vi.fn(),
}));

// Mock database
vi.mock('@glm/db', () => ({
  db: {
    query: {
      financialAccount: {
        findMany: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
      },
      budgetCategory: {
        findMany: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
      },
      transaction: {
        findMany: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
      },
      recurringBill: {
        findMany: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
      },
      goal: {
        findMany: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
  },
}));

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';