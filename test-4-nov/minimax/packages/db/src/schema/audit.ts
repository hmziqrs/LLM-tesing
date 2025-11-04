import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const auditLog = pgTable("audit_log", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	resourceType: text("resource_type").notNull(),
	resourceId: text("resource_id").notNull(),
	details: text("details"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull(),
});
