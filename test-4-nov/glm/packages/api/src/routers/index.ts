import { protectedProcedure, publicProcedure } from "../index";
import { os } from "@orpc/server";
import type { RouterClient } from "@orpc/server";
import { accountsRouter } from "./accounts";
import { budgetsRouter } from "./budgets";
import { transactionsRouter } from "./transactions";
import { csvRouter } from "./csv";
import { recurringRouter } from "./recurring";
import { goalsRouter } from "./goals";
import { reportsRouter } from "./reports";
import { healthRouter } from "../routes/health";

export const appRouter = os.router({
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  health: healthRouter,
  accounts: accountsRouter,
  budgets: budgetsRouter,
  transactions: transactionsRouter,
  csv: csvRouter,
  recurring: recurringRouter,
  goals: goalsRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
