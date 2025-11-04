import { pgTable, text, numeric, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { account } from "./auth";
import { relations } from "drizzle-orm";

export const budgetCategory = pgTable("budget_category", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	color: text("color").notNull().default("#6366f1"),
	icon: text("icon").notNull().default("circle"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const budgetAllocation = pgTable("budget_allocation", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	categoryId: text("category_id")
		.notNull()
		.references(() => budgetCategory.id, { onDelete: "cascade" }),
	month: integer("month").notNull(),
	year: integer("year").notNull(),
	allocatedAmount: numeric("allocated_amount", { precision: 12, scale: 2 })
		.notNull()
		.default("0"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const budgetAllocationRelations = relations(budgetAllocation, ({ one }) => ({
	category: one(budgetCategory, {
		fields: [budgetAllocation.categoryId],
		references: [budgetCategory.id],
	}),
}));

export const budgetCategoryRelations = relations(budgetCategory, ({ many }) => ({
	allocations: many(budgetAllocation),
}));
