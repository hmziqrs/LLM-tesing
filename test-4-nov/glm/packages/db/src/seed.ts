import { db } from "./index";
import {
	user,
	financialAccount,
	budgetCategory,
	budgetAllocation,
	transaction,
	goal,
	recurringBill,
	accountType,
	goalStatus,
	recurringBillFrequency
} from "./schema";

async function seed() {
	console.log("🌱 Starting database seeding...");

	// Create a test user
	const [testUser] = await db
		.insert(user)
		.values({
			id: "test-user-123",
			name: "Test User",
			email: "test@example.com",
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.onConflictDoNothing()
		.returning();

	console.log("✅ Created test user:", testUser?.email);

	const userId = testUser?.id || "test-user-123";

	// Create financial accounts
	const [checkingAccount] = await db
		.insert(financialAccount)
		.values([
			{
				userId,
				name: "Primary Checking",
				type: accountType.enumValues[0], // checking
				balance: "5432.10",
				currency: "USD",
				description: "Main checking account",
			},
			{
				userId,
				name: "Savings Account",
				type: accountType.enumValues[1], // savings
				balance: "12500.00",
				currency: "USD",
				description: "Emergency savings",
			},
			{
				userId,
				name: "Credit Card",
				type: accountType.enumValues[2], // credit_card
				balance: "-1250.75",
				currency: "USD",
				description: "Rewards credit card",
			},
		])
		.returning();

	console.log("✅ Created financial accounts");

	// Create budget categories
	const [housingCategory, foodCategory, transportCategory, entertainmentCategory] = await db
		.insert(budgetCategory)
		.values([
			{
				userId,
				name: "Housing",
				description: "Rent, utilities, and home maintenance",
				color: "#ef4444",
				icon: "home",
				isDefault: true,
			},
			{
				userId,
				name: "Food & Dining",
				description: "Groceries, restaurants, and takeout",
				color: "#f59e0b",
				icon: "utensils",
				isDefault: true,
			},
			{
				userId,
				name: "Transportation",
				description: "Gas, public transit, and car maintenance",
				color: "#3b82f6",
				icon: "car",
				isDefault: true,
			},
			{
				userId,
				name: "Entertainment",
				description: "Movies, games, and hobbies",
				color: "#8b5cf6",
				icon: "gamepad-2",
				isDefault: true,
			},
			{
				userId,
				name: "Shopping",
				description: "Clothing, electronics, and personal items",
				color: "#ec4899",
				icon: "shopping-bag",
				isDefault: true,
			},
			{
				userId,
				name: "Healthcare",
				description: "Medical expenses and insurance",
				color: "#10b981",
				icon: "heart",
				isDefault: true,
			},
		])
		.returning();

	console.log("✅ Created budget categories");

	// Create monthly budget allocations for current month
	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth() + 1;

	await db.insert(budgetAllocation).values([
		{
			userId,
			categoryId: housingCategory.id,
			amount: "1500.00",
			period: "monthly",
			year: currentYear,
			month: currentMonth,
		},
		{
			userId,
			categoryId: foodCategory.id,
			amount: "600.00",
			period: "monthly",
			year: currentYear,
			month: currentMonth,
		},
		{
			userId,
			categoryId: transportCategory.id,
			amount: "400.00",
			period: "monthly",
			year: currentYear,
			month: currentMonth,
		},
		{
			userId,
			categoryId: entertainmentCategory.id,
			amount: "200.00",
			period: "monthly",
			year: currentYear,
			month: currentMonth,
		},
	]);

	console.log("✅ Created budget allocations");

	// Create sample transactions
	await db.insert(transaction).values([
		// Income
		{
			userId,
			accountId: checkingAccount.id,
			amount: "3500.00",
			description: "Monthly Salary",
			type: "income",
			date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
		},
		// Housing expenses
		{
			userId,
			accountId: checkingAccount.id,
			categoryId: housingCategory.id,
			amount: "-1200.00",
			description: "Monthly Rent",
			type: "expense",
			date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
		},
		{
			userId,
			accountId: checkingAccount.id,
			categoryId: housingCategory.id,
			amount: "-85.50",
			description: "Electricity Bill",
			type: "expense",
			date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
		},
		// Food expenses
		{
			userId,
			accountId: checkingAccount.id,
			categoryId: foodCategory.id,
			amount: "-125.75",
			description: "Grocery Shopping",
			type: "expense",
			date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
		},
		{
			userId,
			accountId: checkingAccount.id,
			categoryId: foodCategory.id,
			amount: "-45.20",
			description: "Restaurant Dinner",
			type: "expense",
			date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
		},
		// Transportation
		{
			userId,
			accountId: checkingAccount.id,
			categoryId: transportCategory.id,
			amount: "-50.00",
			description: "Gas Station",
			type: "expense",
			date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
		},
		// Entertainment
		{
			userId,
			accountId: checkingAccount.id,
			categoryId: entertainmentCategory.id,
			amount: "-15.99",
			description: "Netflix Subscription",
			type: "expense",
			date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
		},
	]);

	console.log("✅ Created sample transactions");

	// Create recurring bills
	await db.insert(recurringBill).values([
		{
			userId,
			accountId: checkingAccount.id,
			categoryId: housingCategory.id,
			name: "Monthly Rent",
			amount: "1200.00",
			frequency: recurringBillFrequency.enumValues[4], // monthly
			startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
			nextDue: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
		},
		{
			userId,
			accountId: checkingAccount.id,
			categoryId: entertainmentCategory.id,
			name: "Netflix Subscription",
			amount: "15.99",
			frequency: recurringBillFrequency.enumValues[4], // monthly
			startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
			nextDue: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
		},
	]);

	console.log("✅ Created recurring bills");

	// Create savings goals
	await db.insert(goal).values([
		{
			userId,
			name: "Emergency Fund",
			description: "Build 6 months of expenses",
			targetAmount: "15000.00",
			currentAmount: "12500.00",
			status: goalStatus.enumValues[0], // active
			targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
		},
		{
			userId,
			name: "Vacation Fund",
			description: "Summer vacation to Europe",
			targetAmount: "5000.00",
			currentAmount: "800.00",
			status: goalStatus.enumValues[0], // active
			targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 4 months from now
		},
	]);

	console.log("✅ Created savings goals");
	console.log("🎉 Database seeding completed successfully!");
}

// Run the seed function
seed()
	.catch((error) => {
		console.error("❌ Error seeding database:", error);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});