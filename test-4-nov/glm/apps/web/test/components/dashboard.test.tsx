import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from '@tanstack/react-router';
import { Route } from '@/routes/dashboard';

// Mock the ORPC hooks
vi.mock('@/utils/orpc', () => ({
  orpc: {
    accounts: {
      getSummary: {
        queryKey: ['accounts', 'getSummary'],
        queryOptions: () => ({
          queryKey: ['accounts', 'getSummary'],
          queryFn: () => Promise.resolve({
            totalBalance: '5000.00',
            accountCount: 3,
          }),
        }),
      },
    },
    budgets: {
      getOverview: {
        queryKey: ['budgets', 'getOverview'],
        queryOptions: () => ({
          queryKey: ['budgets', 'getOverview'],
          queryFn: () => Promise.resolve({
            categories: [],
            totalBudget: '3000.00',
            totalSpent: '1200.00',
          }),
        }),
      },
    },
    transactions: {
      getSummary: {
        queryKey: ['transactions', 'getSummary'],
        queryOptions: () => ({
          queryKey: ['transactions', 'getSummary'],
          queryFn: () => Promise.resolve({
            income: '4000.00',
            expenses: '2500.00',
            net: '1500.00',
          }),
        }),
      },
    },
    recurring: {
      getUpcoming: {
        queryKey: ['recurring', 'getUpcoming'],
        queryOptions: () => ({
          queryKey: ['recurring', 'getUpcoming'],
          queryFn: () => Promise.resolve([
            {
              id: 1,
              name: 'Netflix Subscription',
              amount: '15.99',
              nextDue: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            },
          ]),
        }),
      },
    },
    goals: {
      getSummary: {
        queryKey: ['goals', 'getSummary'],
        queryOptions: () => ({
          queryKey: ['goals', 'getSummary'],
          queryFn: () => Promise.resolve({
            totalGoals: 2,
            completedGoals: 1,
            overallProgressPercentage: 65.5,
            totalTargetAmount: '10000.00',
            totalSavedAmount: '6550.00',
          }),
        }),
      },
    },
  },
}));

// Mock getUser function
vi.mock('@/functions/get-user', () => ({
  getUser: () => Promise.resolve({
    user: {
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
    },
  }),
}));

describe('Dashboard Component', () => {
  let queryClient: QueryClient;
  let router: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    router = createMemoryRouter([
      {
        path: '/dashboard',
        component: Route,
        loader: () => ({ session: { user: { name: 'Test User' } } }),
      },
    ]);
  });

  const renderDashboard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );
  };

  it('renders dashboard header', () => {
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, Test User')).toBeInTheDocument();
  });

  it('displays financial summary cards', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('$5000.00')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Balance')).toBeInTheDocument();
    expect(screen.getByText('Across all accounts')).toBeInTheDocument();
  });

  it('displays budget information', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('$3000.00')).toBeInTheDocument();
    });

    expect(screen.getByText('Monthly Budget')).toBeInTheDocument();
    expect(screen.getByText('$1200.00 spent')).toBeInTheDocument();
  });

  it('displays transaction summary', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('$1500.00')).toBeInTheDocument();
    });

    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('Income vs Expenses')).toBeInTheDocument();
  });

  it('displays quick action buttons', () => {
    renderDashboard();

    expect(screen.getByText('Manage Accounts')).toBeInTheDocument();
    expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    expect(screen.getByText('Import CSV')).toBeInTheDocument();
    expect(screen.getByText('View Budget')).toBeInTheDocument();
    expect(screen.getByText('Recurring Bills')).toBeInTheDocument();
    expect(screen.getByText('Savings Goals')).toBeInTheDocument();
  });
});