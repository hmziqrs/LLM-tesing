import { pgTable, text, numeric, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { budgetCategory } from "./budget";
import { relations } from "drizzle-orm";

export const recurringBill = pgTable("recurring_bill", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	categoryId: text("category_id")
		.notNull()
		.references(() => budgetCategory.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	amount: numeric("amount", { precision: 12, scale: 2 })
		.notNull(),
	frequency: text("frequency").notNull().$type<"weekly" | "monthly" | "yearly">(),
	dayOfWeek: integer("day_of_week"),
	dayOfMonth: integer("day_of_month"),
	monthOfYear: integer("month_of_year"),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date"),
	autoPay: boolean("auto_pay").notNull().default(false),
	nextDueDate: timestamp("next_due_date").notNull(),
	active: boolean("active").notNull().default(true),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});
