import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./index";
import { nanoid } from "nanoid";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/pocket_budget",
});

const db = drizzle(pool, { schema });

const categories = [
	{ name: "Housing", description: "Rent, mortgage, utilities", color: "#3b82f6", icon: "home" },
	{ name: "Food", description: "Groceries, dining out", color: "#ef4444", icon: "utensils" },
	{ name: "Transportation", description: "Gas, public transit, car maintenance", color: "#f59e0b", icon: "car" },
	{ name: "Utilities", description: "Electricity, water, internet, phone", color: "#8b5cf6", icon: "zap" },
	{ name: "Healthcare", description: "Medical expenses, insurance", color: "#10b981", icon: "heart" },
	{ name: "Entertainment", description: "Movies, hobbies, subscriptions", color: "#ec4899", icon: "film" },
	{ name: "Shopping", description: "Clothing, personal items", color: "#f97316", icon: "shopping-bag" },
	{ name: "Savings", description: "Emergency fund, investments", color: "#06b6d4", icon: "piggy-bank" },
	{ name: "Other", description: "Miscellaneous expenses", color: "#6b7280", icon: "circle" },
];

async function seed() {
	console.log("🌱 Seeding database...");

	const userId = nanoid();
	const now = new Date();

	console.log("Creating user...");
	await db.insert(schema.user).values({
		id: userId,
		name: "Demo User",
		email: "demo@example.com",
		emailVerified: true,
		createdAt: now,
		updatedAt: now,
	});

	console.log("Creating user settings...");
	await db.insert(schema.userSettings).values({
		id: nanoid(),
		userId,
		currency: "USD",
		dateFormat: "MM/DD/YYYY",
		timezone: "America/New_York",
		theme: "dark",
		createdAt: now,
		updatedAt: now,
	});

	console.log("Creating budget categories...");
	const categoryIds = await Promise.all(
		categories.map(async (cat) => {
			const id = nanoid();
			await db.insert(schema.budgetCategory).values({
				id,
				userId,
				name: cat.name,
				description: cat.description,
				color: cat.color,
				icon: cat.icon,
				createdAt: now,
				updatedAt: now,
			});
			return { name: cat.name, id };
		}),
	);

	const getCategoryId = (name: string) =>
		categoryIds.find((c) => c.name === name)?.id || "";

	console.log("Creating budget allocations...");
	const currentDate = new Date();
	const currentMonth = currentDate.getMonth() + 1;
	const currentYear = currentDate.getFullYear();

	const allocations = [
		{ category: "Housing", amount: 2000 },
		{ category: "Food", amount: 600 },
		{ category: "Transportation", amount: 400 },
		{ category: "Utilities", amount: 300 },
		{ category: "Healthcare", amount: 200 },
		{ category: "Entertainment", amount: 200 },
		{ category: "Shopping", amount: 300 },
		{ category: "Savings", amount: 500 },
		{ category: "Other", amount: 100 },
	];

	for (const alloc of allocations) {
		await db.insert(schema.budgetAllocation).values({
			id: nanoid(),
			userId,
			categoryId: getCategoryId(alloc.category),
			month: currentMonth,
			year: currentYear,
			allocatedAmount: alloc.amount.toString(),
			createdAt: now,
			updatedAt: now,
		});
	}

	console.log("Creating transactions...");
	const housingId = getCategoryId("Housing");
	const foodId = getCategoryId("Food");
	const transportationId = getCategoryId("Transportation");
	const entertainmentId = getCategoryId("Entertainment");
	const savingsId = getCategoryId("Savings");

	const transactions = [
		{
			description: "Rent Payment",
			amount: "-2000.00",
			type: "expense" as const,
			date: new Date(currentYear, currentMonth - 1, 1),
			categoryId: housingId,
		},
		{
			description: "Weekly Groceries",
			amount: "-150.00",
			type: "expense" as const,
			date: new Date(currentYear, currentMonth - 1, 5),
			categoryId: foodId,
		},
		{
			description: "Gas Station",
			amount: "-60.00",
			type: "expense" as const,
			date: new Date(currentYear, currentMonth - 1, 10),
			categoryId: transportationId,
		},
		{
			description: "Movie Night",
			amount: "-25.00",
			type: "expense" as const,
			date: new Date(currentYear, currentMonth - 1, 15),
			categoryId: entertainmentId,
		},
		{
			description: "Salary Deposit",
			amount: "4500.00",
			type: "income" as const,
			date: new Date(currentYear, currentMonth - 1, 1),
			categoryId: savingsId,
		},
		{
			description: "Electric Bill",
			amount: "-120.00",
			type: "expense" as const,
			date: new Date(currentYear, currentMonth - 1, 20),
			categoryId: transportationId,
		},
	];

	for (const tx of transactions) {
		await db.insert(schema.transaction).values({
			id: nanoid(),
			userId,
			accountId: housingId,
			categoryId: tx.categoryId,
			amount: tx.amount,
			description: tx.description,
			date: tx.date,
			type: tx.type,
			status: "completed" as const,
			createdAt: now,
			updatedAt: now,
		});
	}

	console.log("Creating savings goals...");
	const goals = [
		{
			name: "Emergency Fund",
			description: "6 months of expenses",
			targetAmount: "15000.00",
			currentAmount: "5000.00",
			targetDate: new Date(currentYear + 1, 11, 31),
			priority: "high" as const,
		},
		{
			name: "Vacation",
			description: "Trip to Europe",
			targetAmount: "3000.00",
			currentAmount: "800.00",
			targetDate: new Date(currentYear, 6, 1),
			priority: "medium" as const,
		},
	];

	for (const goal of goals) {
		await db.insert(schema.savingsGoal).values({
			id: nanoid(),
			userId,
			name: goal.name,
			description: goal.description,
			targetAmount: goal.targetAmount,
			currentAmount: goal.currentAmount,
			targetDate: goal.targetDate,
			priority: goal.priority,
			color: "#10b981",
			icon: "target",
			active: true,
			createdAt: now,
			updatedAt: now,
		});
	}

	console.log("✅ Database seeded successfully!");
	await pool.end();
}

seed().catch((error) => {
	console.error("Error seeding database:", error);
	process.exit(1);
});
