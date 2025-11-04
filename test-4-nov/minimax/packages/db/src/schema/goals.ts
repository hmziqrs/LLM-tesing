import { pgTable, text, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { relations } from "drizzle-orm";

export const savingsGoal = pgTable("savings_goal", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	targetAmount: numeric("target_amount", { precision: 12, scale: 2 })
		.notNull(),
	currentAmount: numeric("current_amount", { precision: 12, scale: 2 })
		.notNull()
		.default("0"),
	targetDate: timestamp("target_date"),
	priority: text("priority").notNull().$type<"low" | "medium" | "high">()
		.default("medium"),
	color: text("color").notNull().default("#10b981"),
	icon: text("icon").notNull().default("target"),
	active: boolean("active").notNull().default(true),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});
