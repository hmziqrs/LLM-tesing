import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const userSettings = pgTable("user_settings", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: "cascade" }),
	currency: text("currency").notNull().default("USD"),
	dateFormat: text("date_format").notNull().default("MM/DD/YYYY"),
	timezone: text("timezone").notNull().default("UTC"),
	theme: text("theme").notNull().$type<"dark" | "light" | "system">()
		.default("dark"),
	partnerId: text("partner_id")
		.references(() => user.id, { onDelete: "set null" }),
	partnerStatus: text("partner_status")
		.$type<"none" | "invited" | "accepted" | "pending">()
		.default("none"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const partnerInvitation = pgTable("partner_invitation", {
	id: text("id").primaryKey(),
	inviterId: text("inviter_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	inviteeEmail: text("invitee_email").notNull(),
	token: text("token").notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	acceptedAt: timestamp("accepted_at"),
	status: text("status").notNull().$type<"pending" | "accepted" | "expired" | "cancelled">()
		.default("pending"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});
