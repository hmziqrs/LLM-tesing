import { protectedProcedure, publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { authRouter } from "./auth";
import { accountsRouter } from "./accounts";
import { budgetsRouter } from "./budgets";
import { transactionsRouter } from "./transactions";
import { recurringRouter } from "./recurring";
import { goalsRouter } from "./goals";
import { reportsRouter } from "./reports";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	auth: authRouter,
	accounts: accountsRouter,
	budgets: budgetsRouter,
	transactions: transactionsRouter,
	recurring: recurringRouter,
	goals: goalsRouter,
	reports: reportsRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
