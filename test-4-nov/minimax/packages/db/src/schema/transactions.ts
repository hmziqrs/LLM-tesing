import { pgTable, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { budgetCategory } from "./budget";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const transaction = pgTable("transaction", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accountId: text("account_id")
		.notNull()
		.references(() => budgetCategory.id, { onDelete: "cascade" }),
	categoryId: text("category_id")
		.notNull()
		.references(() => budgetCategory.id, { onDelete: "cascade" }),
	amount: numeric("amount", { precision: 12, scale: 2 })
		.notNull(),
	description: text("description").notNull(),
	date: timestamp("date").notNull(),
	type: text("type").notNull().$type<"income" | "expense">(),
	status: text("status").notNull().$type<"pending" | "completed" | "cancelled">()
		.default("completed"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const transactionAttachment = pgTable("transaction_attachment", {
	id: text("id").primaryKey(),
	transactionId: text("transaction_id")
		.notNull()
		.references(() => transaction.id, { onDelete: "cascade" }),
	filename: text("filename").notNull(),
	originalName: text("original_name").notNull(),
	mimeType: text("mime_type").notNull(),
	size: integer("size").notNull(),
	path: text("path").notNull(),
	createdAt: timestamp("created_at").notNull(),
});

export const transactionRelations = relations(transaction, ({ one, many }) => ({
	account: one(budgetCategory, {
		fields: [transaction.accountId],
		references: [budgetCategory.id],
	}),
	category: one(budgetCategory, {
		fields: [transaction.categoryId],
		references: [budgetCategory.id],
	}),
	attachments: many(transactionAttachment),
}));
