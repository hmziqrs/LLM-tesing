import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/sign-in', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
        session: {
          token: 'test-session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      })
    );
  }),

  rest.post('/api/auth/sign-out', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }));
  }),

  // ORPC endpoints mock
  rest.post('/api/orpc', (req, res, ctx) => {
    const { method, params } = req.body as any;

    // Mock responses based on the ORPC method
    switch (method) {
      case 'accounts.getSummary':
        return res(
          ctx.json({
            result: {
              data: {
                totalBalance: '5000.00',
                accountCount: 3,
              },
            },
          })
        );

      case 'budgets.getOverview':
        return res(
          ctx.json({
            result: {
              data: {
                categories: [],
                totalBudget: '3000.00',
                totalSpent: '1200.00',
              },
            },
          })
        );

      case 'transactions.getSummary':
        return res(
          ctx.json({
            result: {
              data: {
                income: '4000.00',
                expenses: '2500.00',
                net: '1500.00',
              },
            },
          })
        );

      case 'recurring.getUpcoming':
        return res(
          ctx.json({
            result: {
              data: [
                {
                  id: 1,
                  name: 'Netflix Subscription',
                  amount: '15.99',
                  nextDue: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                },
              ],
            },
          })
        );

      case 'goals.getSummary':
        return res(
          ctx.json({
            result: {
              data: {
                totalGoals: 2,
                completedGoals: 1,
                overallProgressPercentage: 65.5,
                totalTargetAmount: '10000.00',
                totalSavedAmount: '6550.00',
              },
            },
          })
        );

      default:
        return res(
          ctx.status(200),
          ctx.json({
            result: {
              data: null,
            },
          })
        );
    }
  }),
];

export const server = setupServer(...handlers);