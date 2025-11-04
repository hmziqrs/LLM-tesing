import {
	pgTable,
	text,
	decimal,
	timestamp,
	boolean,
	serial,
	pgEnum
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const accountType = pgEnum("account_type", [
	"checking",
	"savings",
	"credit_card",
	"investment",
	"cash",
	"other"
]);

export const financialAccount = pgTable("financial_account", {
	id: serial("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	type: accountType("type").notNull(),
	balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
	currency: text("currency").notNull().default("USD"),
	description: text("description"),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const budgetCategory = pgTable("budget_category", {
	id: serial("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	color: text("color").notNull().default("#6366f1"),
	icon: text("icon").default("folder"),
	isDefault: boolean("is_default").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const budgetAllocation = pgTable("budget_allocation", {
	id: serial("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	categoryId: serial("category_id")
		.notNull()
		.references(() => budgetCategory.id, { onDelete: "cascade" }),
	amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
	period: text("period").notNull().default("monthly"), // monthly, weekly, yearly
	year: serial("year").notNull(),
	month: serial("month").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transaction = pgTable("transaction", {
	id: serial("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accountId: serial("account_id")
		.notNull()
		.references(() => financialAccount.id, { onDelete: "cascade" }),
	categoryId: serial("category_id")
		.references(() => budgetCategory.id, { onDelete: "set null" }),
	amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
	description: text("description").notNull(),
	note: text("note"),
	date: timestamp("date").notNull().defaultNow(),
	type: text("type").notNull().default("expense"), // income, expense, transfer
	isRecurring: boolean("is_recurring").notNull().default(false),
	recurringBillId: serial("recurring_bill_id")
		.references(() => recurringBill.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transactionAttachment = pgTable("transaction_attachment", {
	id: serial("id").primaryKey(),
	transactionId: serial("transaction_id")
		.notNull()
		.references(() => transaction.id, { onDelete: "cascade" }),
	fileName: text("file_name").notNull(),
	filePath: text("file_path").notNull(),
	fileSize: serial("file_size").notNull(),
	mimeType: text("mime_type").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recurringBillFrequency = pgEnum("recurring_bill_frequency", [
	"daily",
	"weekly",
	"biweekly",
	"monthly",
	"quarterly",
	"yearly"
]);

export const recurringBill = pgTable("recurring_bill", {
	id: serial("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accountId: serial("account_id")
		.notNull()
		.references(() => financialAccount.id, { onDelete: "cascade" }),
	categoryId: serial("category_id")
		.references(() => budgetCategory.id, { onDelete: "set null" }),
	name: text("name").notNull(),
	description: text("description"),
	amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
	frequency: recurringBillFrequency("frequency").notNull(),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date"),
	lastProcessed: timestamp("last_processed"),
	nextDue: timestamp("next_due").notNull(),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const goalStatus = pgEnum("goal_status", [
	"active",
	"completed",
	"paused",
	"cancelled"
]);

export const goal = pgTable("goal", {
	id: serial("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
	currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).notNull().default("0"),
	targetDate: timestamp("target_date"),
	status: goalStatus("status").notNull().default("active"),
	categoryId: serial("category_id")
		.references(() => budgetCategory.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const auditLogAction = pgEnum("audit_log_action", [
	"create",
	"update",
	"delete",
	"login",
	"logout"
]);

export const auditLog = pgTable("audit_log", {
	id: serial("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	action: auditLogAction("action").notNull(),
	resourceType: text("resource_type").notNull(),
	resourceId: text("resource_id"),
	oldValues: text("old_values"), // JSON string
	newValues: text("new_values"), // JSON string
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});