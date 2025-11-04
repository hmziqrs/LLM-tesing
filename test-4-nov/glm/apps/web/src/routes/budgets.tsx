import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/budgets")({
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
	const { session } = Route.useRouteContext();
	const queryClient = useQueryClient();

	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth() + 1;

	const { data: budgetOverview, isLoading } = useQuery(
		orpc.budgets.getOverview.queryOptions({
			year: currentYear,
			month: currentMonth,
		})
	);

	const { data: categories } = useQuery(orpc.budgets.getCategories.queryOptions());

	if (isLoading) {
		return <div className="p-6">Loading budget data...</div>;
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Budget</h1>
				<Button>
					Manage Categories
				</Button>
			</div>

			{/* Budget Overview */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Total Budget</CardTitle>
						<CardDescription>{new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							${parseFloat(budgetOverview?.totalBudget || "0").toFixed(2)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Total Spent</CardTitle>
						<CardDescription>So far this month</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							${parseFloat(budgetOverview?.totalSpent || "0").toFixed(2)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Remaining</CardTitle>
						<CardDescription>Budget left to spend</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							${parseFloat(budgetOverview?.totalRemaining || "0").toFixed(2)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Budget Categories */}
			{budgetOverview?.categories && budgetOverview.categories.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>Budget Categories</CardTitle>
						<CardDescription>
							Your spending breakdown for {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-6">
							{budgetOverview.categories.map((category, index) => {
								const percentage = Math.min(category.percentage, 100);
								const isOverBudget = category.spent > category.allocated;

								return (
									<div key={index} className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-3">
												<div
													className="w-4 h-4 rounded-full"
													style={{ backgroundColor: category.category.color }}
												/>
												<div>
													<p className="font-medium">{category.category.name}</p>
													<p className="text-sm text-muted-foreground">
														${category.spent.toFixed(2)} of ${category.allocated.toFixed(2)}
													</p>
												</div>
											</div>
											<div className="text-right">
												<Badge variant={isOverBudget ? "destructive" : "secondary"}>
													{percentage.toFixed(0)}% used
												</Badge>
												<p className="text-sm text-muted-foreground">
													${category.remaining.toFixed(2)} left
												</p>
											</div>
										</div>
										<Progress
											value={percentage}
											className={`h-2 ${isOverBudget ? "bg-red-100" : ""}`}
										/>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>No budget set up yet</CardTitle>
						<CardDescription>
							Create budget categories and allocations to track your spending
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{categories && categories.length > 0 ? (
								<Button>
									Set Up Budget Allocations
								</Button>
							) : (
								<Button>
									Create Budget Categories First
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Categories Management */}
			{categories && categories.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Budget Categories</CardTitle>
						<CardDescription>
							Manage your spending categories
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{categories.map((category) => (
								<div key={category.id} className="flex items-center space-x-3 p-3 border rounded-lg">
									<div
										className="w-4 h-4 rounded-full"
										style={{ backgroundColor: category.color }}
									/>
									<div className="flex-1">
										<p className="font-medium">{category.name}</p>
										<p className="text-sm text-muted-foreground">{category.description}</p>
									</div>
									<Button variant="outline" size="sm">
										Edit
									</Button>
								</div>
							))}
						</div>
						<div className="mt-4">
							<Button variant="outline">
								Add New Category
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}