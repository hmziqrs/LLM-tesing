import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(process.env.DATABASE_URL || "");

export * from "./schema/auth";
export * from "./schema/budget";
export * from "./schema/transactions";
export * from "./schema/recurring";
export * from "./schema/goals";
export * from "./schema/audit";
export * from "./schema/shared";
