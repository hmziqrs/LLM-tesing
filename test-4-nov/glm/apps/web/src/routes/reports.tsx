import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const Route = createFileRoute("/reports")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await getUser();
		return { session };
	},
	loader: async ({ context }) => {
		if (!context.session) {
			throw redirect({
				to: "/login",
			});
		}
	},
});

function RouteComponent() {
	const { session: _session } = Route.useRouteContext();

	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth() + 1;

	// Export mutation
	const exportMutation = useMutation({
		mutationFn: orpc.reports.export.mutate,
		onSuccess: (data) => {
			// Create blob and download
			const binaryString = atob(data.content);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const blob = new Blob([bytes], { type: data.mimeType });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = data.filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		},
	});

	const handleExport = (type: 'transactions' | 'accounts' | 'budgets' | 'goals') => {
		const startDate = type === 'budgets' ? new Date(currentYear, currentMonth - 1, 1) : undefined;
		const endDate = type === 'budgets' ? new Date(currentYear, currentMonth, 0) : undefined;

		exportMutation.mutate({
			type,
			startDate,
			endDate,
			format: 'csv',
		});
	};

	// Fetch data for reports
	const { data: budgetOverview } = useQuery(
		orpc.budgets.getOverview.queryOptions({ year: currentYear, month: currentMonth })
	);
	const { data: transactionSummary } = useQuery(
		orpc.transactions.getSummary.queryOptions({
			startDate: new Date(currentYear, 0, 1), // Start of year
			endDate: currentDate, // Today
		})
	);
	const { data: accountsSummary } = useQuery(orpc.accounts.getSummary.queryOptions());
	const { data: goalsSummary } = useQuery(orpc.goals.getSummary.queryOptions());

	// Process data for charts
	const spendingByCategory = budgetOverview?.categories?.map(cat => ({
		name: cat.category.name,
		amount: parseFloat(cat.spent || "0"),
		color: cat.category.color,
	})) || [];

	const budgetVsSpending = budgetOverview?.categories?.map(cat => ({
		name: cat.category.name,
		budget: parseFloat(cat.allocated || "0"),
		spent: parseFloat(cat.spent || "0"),
		remaining: parseFloat(cat.remaining || "0"),
	})) || [];

	const accountBalances = accountsSummary?.accounts?.map(account => ({
		name: account.name,
		balance: parseFloat(account.balance || "0"),
		type: account.type,
	})) || [];

	// Generate monthly trend data (mock data for now)
	const monthlyTrend = [
		{ month: "Jan", income: 3500, expenses: 2800 },
		{ month: "Feb", income: 3500, expenses: 3200 },
		{ month: "Mar", income: 3700, expenses: 2900 },
		{ month: "Apr", income: 3500, expenses: 3100 },
		{ month: "May", income: 3600, expenses: 2700 },
		{ month: "Jun", income: 3800, expenses: 3300 },
	];

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(value);
	};

	const CustomTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			return (
				<div className="bg-background border rounded p-2 shadow-sm">
					<p className="font-medium">{label}</p>
					{payload.map((entry: any, index: number) => (
						<p key={index} style={{ color: entry.color }}>
							{entry.name}: {formatCurrency(entry.value)}
						</p>
					))}
				</div>
			);
		}
		return null;
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Reports & Analytics</h1>
				<div className="flex space-x-2">
					<div className="relative">
						<Button variant="outline" disabled={exportMutation.isPending}>
							{exportMutation.isPending ? "Exporting..." : "Export"}
						</Button>
						{/* Dropdown would go here for multiple export options */}
					</div>
					<Button variant="outline">
						Date Range
					</Button>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Net Worth</CardTitle>
						<CardDescription>Total assets minus debts</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(parseFloat(accountsSummary?.totalBalance || "0"))}
						</div>
						<p className="text-xs text-muted-foreground">
							Across {accountsSummary?.accountCount || 0} accounts
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
						<CardDescription>Current month expenses</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{formatCurrency(parseFloat(transactionSummary?.expenses || "0"))}
						</div>
						<p className="text-xs text-muted-foreground">
							{formatCurrency(parseFloat(transactionSummary?.income || "0"))} income
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
						<CardDescription>Of allocated budget spent</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{budgetOverview ? (
								parseFloat(budgetOverview.totalBudget || "0") > 0
									? `${((parseFloat(budgetOverview.totalSpent || "0") / parseFloat(budgetOverview.totalBudget || "1")) * 100).toFixed(1)}%`
									: "0%"
							) : "0%"}
						</div>
						<p className="text-xs text-muted-foreground">
							{formatCurrency(parseFloat(budgetOverview?.totalSpent || "0"))} of {formatCurrency(parseFloat(budgetOverview?.totalBudget || "0"))}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Goals Progress</CardTitle>
						<CardDescription>Savings targets achieved</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{goalsSummary?.overallProgressPercentage.toFixed(1)}%
						</div>
						<p className="text-xs text-muted-foreground">
							{goalsSummary?.completedGoals || 0} of {goalsSummary?.totalGoals || 0} goals completed
						</p>
						{(goalsSummary?.totalGoals && goalsSummary.totalGoals > 0) && (
							<div className="mt-3">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleExport('goals')}
									disabled={exportMutation.isPending}
								>
									Export Goals Data
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Spending by Category */}
				<Card>
					<CardHeader>
						<CardTitle>Spending by Category</CardTitle>
						<CardDescription>Current month breakdown</CardDescription>
					</CardHeader>
					<CardContent>
						{spendingByCategory.length > 0 ? (
							<>
								<ResponsiveContainer width="100%" height={300}>
									<PieChart>
										<Pie
											data={spendingByCategory}
											cx="50%"
											cy="50%"
											labelLine={false}
											label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
											outerRadius={80}
											fill="#8884d8"
											dataKey="amount"
										>
											{spendingByCategory.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
											))}
										</Pie>
										<Tooltip formatter={(value) => formatCurrency(value as number)} />
									</PieChart>
								</ResponsiveContainer>
								<div className="flex justify-center mt-4">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleExport('transactions')}
										disabled={exportMutation.isPending}
									>
										Export Transaction Data
									</Button>
								</div>
							</>
						) : (
							<div className="h-[300px] flex items-center justify-center text-muted-foreground">
								No spending data available
							</div>
						)}
					</CardContent>
				</Card>

				{/* Budget vs Spending */}
				<Card>
					<CardHeader>
						<CardTitle>Budget vs Spending</CardTitle>
						<CardDescription>Category comparison</CardDescription>
					</CardHeader>
					<CardContent>
						{budgetVsSpending.length > 0 ? (
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={budgetVsSpending}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
									<YAxis tickFormatter={(value) => `$${value}`} />
									<Tooltip content={<CustomTooltip />} />
									<Bar dataKey="budget" fill="#8884d8" name="Budget" />
									<Bar dataKey="spent" fill="#82ca9d" name="Spent" />
								</BarChart>
							</ResponsiveContainer>
						) : (
							<div className="h-[300px] flex items-center justify-center text-muted-foreground">
								No budget data available
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Monthly Trend */}
			<Card>
				<CardHeader>
					<CardTitle>Income vs Expenses Trend</CardTitle>
					<CardDescription>6-month financial overview</CardDescription>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={400}>
						<LineChart data={monthlyTrend}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="month" />
							<YAxis tickFormatter={(value) => `$${value}`} />
							<Tooltip content={<CustomTooltip />} />
							<Line
								type="monotone"
								dataKey="income"
								stroke="#8884d8"
								strokeWidth={2}
								name="Income"
							/>
							<Line
								type="monotone"
								dataKey="expenses"
								stroke="#82ca9d"
								strokeWidth={2}
								name="Expenses"
							/>
						</LineChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* Account Balances */}
			<Card>
				<CardHeader>
					<CardTitle>Account Balances</CardTitle>
					<CardDescription>Distribution across accounts</CardDescription>
				</CardHeader>
				<CardContent>
					{accountBalances.length > 0 ? (
							<>
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={accountBalances} layout="horizontal">
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis type="number" tickFormatter={(value) => `$${value}`} />
										<YAxis dataKey="name" type="category" width={100} />
										<Tooltip content={<CustomTooltip />} />
										<Bar dataKey="balance" fill="#8884d8" name="Balance" />
									</BarChart>
								</ResponsiveContainer>
								<div className="flex justify-center mt-4">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleExport('accounts')}
										disabled={exportMutation.isPending}
									>
										Export Account Data
									</Button>
								</div>
							</>
						) : (
							<div className="h-[300px] flex items-center justify-center text-muted-foreground">
								No account data available
							</div>
						)}
				</CardContent>
			</Card>
		</div>
	);
}