import { z } from "zod";
import { protectedProcedure } from "../index";
import { db } from "@minimax/db";
import { userSettings, partnerInvitation } from "@minimax/db/src/schema/shared";
import { nanoid } from "nanoid";

export const authRouter = {
	getProfile: protectedProcedure.handler(async ({ context }) => {
		const settings = await db
			.select()
			.from(userSettings)
			.where(userSettings.userId.eq(context.session!.user.id))
			.limit(1);

		return settings[0] || null;
	}),

	updateProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().optional(),
				currency: z.string().default("USD"),
				dateFormat: z.string().default("MM/DD/YYYY"),
				timezone: z.string().default("UTC"),
			}),
		)
		.handler(async ({ input, context }) => {
			const existing = await db
				.select()
				.from(userSettings)
				.where(userSettings.userId.eq(context.session!.user.id))
				.limit(1);

			if (existing.length === 0) {
				await db.insert(userSettings).values({
					id: nanoid(),
					userId: context.session!.user.id,
					currency: input.currency,
					dateFormat: input.dateFormat,
					timezone: input.timezone,
					theme: "dark",
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			} else {
				await db
					.update(userSettings)
					.set({
						currency: input.currency,
						dateFormat: input.dateFormat,
						timezone: input.timezone,
						updatedAt: new Date(),
					})
					.where(userSettings.userId.eq(context.session!.user.id));
			}

			return { success: true };
		}),

	invitePartner: protectedProcedure
		.input(
			z.object({
				email: z.string().email(),
			}),
		)
		.handler(async ({ input, context }) => {
			const token = nanoid();
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + 7);

			await db.insert(partnerInvitation).values({
				id: nanoid(),
				inviterId: context.session!.user.id,
				inviteeEmail: input.email,
				token,
				expiresAt,
				status: "pending",
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			return { token };
		}),

	acceptPartner: protectedProcedure
		.input(
			z.object({
				token: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const invitation = await db
				.select()
				.from(partnerInvitation)
				.where(
					partnerInvitation.token
						.eq(input.token)
						.and(partnerInvitation.status.eq("pending")),
				)
				.limit(1);

			if (invitation.length === 0) {
				throw new Error("Invalid or expired invitation");
			}

			if (new Date(invitation[0].expiresAt) < new Date()) {
				throw new Error("Invitation has expired");
			}

			await db
				.update(partnerInvitation)
				.set({
					acceptedAt: new Date(),
					status: "accepted",
					updatedAt: new Date(),
				})
				.where(partnerInvitation.id.eq(invitation[0].id));

			return { success: true };
		}),
};
