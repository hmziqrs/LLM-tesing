import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

export const Route = createFileRoute("/goals")({
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

	const { data: goals, isLoading } = useQuery(orpc.goals.getAll.queryOptions());
	const { data: goalsSummary } = useQuery(orpc.goals.getSummary.queryOptions());

	const contributeMutation = useMutation({
		mutationFn: orpc.goals.contribute.mutate,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.goals.getAll.queryKey() });
			queryClient.invalidateQueries({ queryKey: orpc.goals.getSummary.queryKey() });
			queryClient.invalidateQueries({ queryKey: orpc.accounts.getSummary.queryKey() });
		},
	});

	const updateGoalMutation = useMutation({
		mutationFn: orpc.goals.update.mutate,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.goals.getAll.queryKey() });
			queryClient.invalidateQueries({ queryKey: orpc.goals.getSummary.queryKey() });
		},
	});

	const deleteGoalMutation = useMutation({
		mutationFn: orpc.goals.delete.mutate,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.goals.getAll.queryKey() });
			queryClient.invalidateQueries({ queryKey: orpc.goals.getSummary.queryKey() });
		},
	});

	if (isLoading) {
		return <div className="p-6">Loading goals...</div>;
	}

	const getStatusLabel = (status: string) => {
		const labels: Record<string, string> = {
			active: "Active",
			completed: "Completed",
			paused: "Paused",
			cancelled: "Cancelled",
		};
		return labels[status] || status;
	};

	const getStatusColor = (status: string) => {
		const colors: Record<string, string> = {
			active: "bg-green-100 text-green-800",
			completed: "bg-blue-100 text-blue-800",
			paused: "bg-yellow-100 text-yellow-800",
			cancelled: "bg-gray-100 text-gray-800",
		};
		return colors[status] || "bg-gray-100 text-gray-800";
	};

	const getProgressColor = (progress: number, status: string) => {
		if (status === "completed") return "bg-blue-500";
		if (progress >= 75) return "bg-green-500";
		if (progress >= 50) return "bg-yellow-500";
		if (progress >= 25) return "bg-orange-500";
		return "bg-red-500";
	};

	const formatDaysRemaining = (days: number | null) => {
		if (days === null) return "No deadline";
		if (days < 0) return `${Math.abs(days)} days overdue`;
		if (days === 0) return "Due today";
		if (days === 1) return "Due tomorrow";
		return `${days} days remaining`;
	};

	const getDaysRemainingColor = (days: number | null, status: string) => {
		if (status === "completed") return "text-blue-600";
		if (days === null) return "text-gray-600";
		if (days < 0) return "text-red-600";
		if (days <= 3) return "text-orange-600";
		if (days <= 7) return "text-yellow-600";
		return "text-green-600";
	};

	const handleContribute = (goalId: number, amount: string) => {
		contributeMutation.mutate({
			id: goalId,
			amount,
			accountId: 1, // This should be selectable in a real implementation
		});
	};

	const handleStatusToggle = (goalId: number, currentStatus: string, progress: number) => {
		let newStatus: string;
		if (currentStatus === "active") {
			newStatus = progress >= 100 ? "completed" : "paused";
		} else {
			newStatus = "active";
		}

		updateGoalMutation.mutate({
			id: goalId,
			status: newStatus as any,
		});
	};

	const handleDeleteGoal = (goalId: number) => {
		if (confirm("Are you sure you want to delete this goal?")) {
			deleteGoalMutation.mutate(goalId);
		}
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Savings Goals</h1>
				<Button>
					Create New Goal
				</Button>
			</div>

			{/* Goals Summary */}
			{goalsSummary && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">Total Goals</CardTitle>
							<CardDescription>All your savings goals</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{goalsSummary.totalGoals}</div>
							<div className="flex space-x-4 text-sm text-muted-foreground">
								<span>{goalsSummary.activeGoals} active</span>
								<span>{goalsSummary.completedGoals} completed</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">Total Target</CardTitle>
							<CardDescription>Combined goal amounts</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								${parseFloat(goalsSummary.totalTargetAmount || "0").toFixed(2)}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">Total Saved</CardTitle>
							<CardDescription>Progress toward all goals</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								${parseFloat(goalsSummary.totalSavedAmount || "0").toFixed(2)}
							</div>
							<div className="text-sm text-muted-foreground">
								{goalsSummary.overallProgressPercentage.toFixed(1)}% complete
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">Upcoming Goals</CardTitle>
							<CardDescription>Due in next 30 days</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{goalsSummary.upcomingGoalsCount}</div>
							<div className="text-sm text-muted-foreground">
								{goalsSummary.upcomingGoals.length > 0 && (
									<span>Next: {goalsSummary.upcomingGoals[0].name}</span>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Goals List */}
			<Card>
				<CardHeader>
					<CardTitle>Your Goals</CardTitle>
					<CardDescription>
						Track your progress toward savings targets
					</CardDescription>
				</CardHeader>
				<CardContent>
					{goals && goals.length > 0 ? (
						<div className="space-y-6">
							{goals.map((goal) => (
								<div key={goal.id} className="p-4 border rounded-lg">
									<div className="flex items-start justify-between mb-4">
										<div className="flex-1">
											<div className="flex items-center space-x-2 mb-2">
												<h4 className="font-medium text-lg">{goal.name}</h4>
												<Badge className={getStatusColor(goal.status)}>
													{getStatusLabel(goal.status)}
												</Badge>
												{goal.isOverdue && goal.status === "active" && (
													<Badge variant="destructive">Overdue</Badge>
												)}
											</div>
											{goal.description && (
												<p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
											)}
											<div className="flex items-center space-x-4 text-sm text-muted-foreground">
												{goal.category && <span>{goal.category.name}</span>}
												{goal.targetDate && (
													<span>
														Due: {new Date(goal.targetDate).toLocaleDateString()}
													</span>
												)}
											</div>
										</div>
										<div className="text-right">
											<p className="text-lg font-semibold">
												${parseFloat(goal.currentAmount || "0").toFixed(2)} /
												${parseFloat(goal.targetAmount || "0").toFixed(2)}
											</p>
											<p className={`text-sm ${getDaysRemainingColor(goal.daysRemaining, goal.status)}`}>
												{formatDaysRemaining(goal.daysRemaining)}
											</p>
										</div>
									</div>

									{/* Progress Bar */}
									<div className="mb-4">
										<div className="flex justify-between text-sm mb-2">
											<span>Progress</span>
											<span>{goal.progressPercentage?.toFixed(1)}%</span>
										</div>
										<Progress
											value={goal.progressPercentage || 0}
											className="h-2"
										/>
									</div>

									{/* Action Buttons */}
									<div className="flex space-x-2">
										{goal.status === "active" && goal.progressPercentage! < 100 && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													const amount = prompt("Enter contribution amount:");
													if (amount && !isNaN(parseFloat(amount))) {
														handleContribute(goal.id, amount);
													}
												}}
												disabled={contributeMutation.isPending}
											>
												Contribute
											</Button>
										)}
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleStatusToggle(goal.id, goal.status, goal.progressPercentage || 0)}
											disabled={updateGoalMutation.isPending}
										>
											{goal.status === "active" ? "Pause" : "Activate"}
										</Button>
										<Button variant="outline" size="sm">
											Edit
										</Button>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => handleDeleteGoal(goal.id)}
											disabled={deleteGoalMutation.isPending}
										>
											Delete
										</Button>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8">
							<p className="text-muted-foreground mb-4">No savings goals set up yet</p>
							<Button>
								Create Your First Savings Goal
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Contribution Results */}
			{contributeMutation.data && (
				<Card>
					<CardHeader>
						<CardTitle>Contribution Successful</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<p>Contributed <strong>${contributeMutation.data.contributionAmount}</strong> to goal</p>
							<p>New total: <strong>${contributeMutation.data.newCurrentAmount}</strong></p>
							{contributeMutation.data.goalCompleted && (
								<p className="text-green-600 font-medium">🎉 Goal completed!</p>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}