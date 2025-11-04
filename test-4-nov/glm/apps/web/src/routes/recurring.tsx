import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/recurring")({
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
	const queryClient = useQueryClient();

	const { data: recurringBills, isLoading } = useQuery(orpc.recurring.getAll.queryOptions());
	const { data: upcomingBills } = useQuery(orpc.recurring.getUpcoming.queryOptions());

	const processBillsMutation = useMutation({
		mutationFn: orpc.recurring.processDueBills.mutate,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.recurring.getAll.queryKey() });
			queryClient.invalidateQueries({ queryKey: orpc.recurring.getUpcoming.queryKey() });
			queryClient.invalidateQueries({ queryKey: orpc.accounts.getSummary.queryKey() });
		},
	});

	const toggleBillMutation = useMutation({
		mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
			return orpc.recurring.update.mutate({ id, isActive });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.recurring.getAll.queryKey() });
			queryClient.invalidateQueries({ queryKey: orpc.recurring.getUpcoming.queryKey() });
		},
	});

	const deleteBillMutation = useMutation({
		mutationFn: orpc.recurring.delete.mutate,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.recurring.getAll.queryKey() });
			queryClient.invalidateQueries({ queryKey: orpc.recurring.getUpcoming.queryKey() });
		},
	});

	if (isLoading) {
		return <div className="p-6">Loading recurring bills...</div>;
	}

	const getFrequencyLabel = (frequency: string) => {
		const labels: Record<string, string> = {
			daily: "Daily",
			weekly: "Weekly",
			biweekly: "Bi-weekly",
			monthly: "Monthly",
			quarterly: "Quarterly",
			yearly: "Yearly",
		};
		return labels[frequency] || frequency;
	};

	const getDaysUntilDue = (nextDue: string) => {
		const today = new Date();
		const dueDate = new Date(nextDue);
		const diffTime = dueDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};

	const getUrgencyColor = (daysUntilDue: number) => {
		if (daysUntilDue < 0) return "text-red-600 bg-red-50";
		if (daysUntilDue <= 3) return "text-orange-600 bg-orange-50";
		if (daysUntilDue <= 7) return "text-yellow-600 bg-yellow-50";
		return "text-green-600 bg-green-50";
	};

	const handleProcessBills = () => {
		processBillsMutation.mutate();
	};

	const handleToggleActive = (id: number, currentStatus: boolean) => {
		toggleBillMutation.mutate({ id, isActive: !currentStatus });
	};

	const handleDeleteBill = (id: number) => {
		if (confirm("Are you sure you want to delete this recurring bill?")) {
			deleteBillMutation.mutate(id);
		}
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Recurring Bills</h1>
				<div className="flex space-x-2">
					<Button
						variant="outline"
						onClick={handleProcessBills}
						disabled={processBillsMutation.isPending}
					>
						{processBillsMutation.isPending ? "Processing..." : "Process Due Bills"}
					</Button>
					<Button>
						Add Recurring Bill
					</Button>
				</div>
			</div>

			{/* Upcoming Bills Alert */}
			{upcomingBills && upcomingBills.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-orange-600">Upcoming Bills</CardTitle>
						<CardDescription>
							Bills due in the next 30 days
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{upcomingBills.map((bill) => {
								const daysUntil = getDaysUntilDue(bill.nextDue);
								const urgencyColor = getUrgencyColor(daysUntil);

								return (
									<div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
										<div className="flex items-center space-x-3">
											<div className={`px-2 py-1 rounded text-sm font-medium ${urgencyColor}`}>
												{daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days`}
											</div>
											<div>
												<p className="font-medium">{bill.name}</p>
												<p className="text-sm text-muted-foreground">
													{bill.account?.name} • {getFrequencyLabel(bill.frequency)}
												</p>
											</div>
										</div>
										<div className="text-right">
											<p className="font-semibold text-red-600">
												${parseFloat(bill.amount || "0").toFixed(2)}
											</p>
											<p className="text-xs text-muted-foreground">
												{new Date(bill.nextDue).toLocaleDateString()}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* All Recurring Bills */}
			<Card>
				<CardHeader>
					<CardTitle>All Recurring Bills</CardTitle>
					<CardDescription>
						Manage your recurring payments and subscriptions
					</CardDescription>
				</CardHeader>
				<CardContent>
					{recurringBills && recurringBills.length > 0 ? (
						<div className="space-y-4">
							{recurringBills.map((bill) => {
								const daysUntil = getDaysUntilDue(bill.nextDue);
								const isActive = bill.isActive;

								return (
									<div key={bill.id} className={`p-4 border rounded-lg ${!isActive ? 'opacity-60' : ''}`}>
										<div className="flex items-start justify-between">
											<div className="flex items-start space-x-4">
												<div className="flex-1">
													<div className="flex items-center space-x-2">
														<h4 className="font-medium">{bill.name}</h4>
														<Badge variant={isActive ? "default" : "secondary"}>
															{isActive ? "Active" : "Paused"}
														</Badge>
														{daysUntil < 0 && isActive && (
															<Badge variant="destructive">Overdue</Badge>
														)}
													</div>
													<p className="text-sm text-muted-foreground mb-1">
														{bill.description}
													</p>
													<div className="flex items-center space-x-4 text-sm text-muted-foreground">
														<span>{bill.account?.name}</span>
														<span>•</span>
														<span>{getFrequencyLabel(bill.frequency)}</span>
														<span>•</span>
														<span>Next: {new Date(bill.nextDue).toLocaleDateString()}</span>
														{bill.lastProcessed && (
															<>
																<span>•</span>
																<span>Last processed: {new Date(bill.lastProcessed).toLocaleDateString()}</span>
															</>
														)}
													</div>
													{bill.endDate && (
														<p className="text-sm text-muted-foreground mt-1">
															Ends: {new Date(bill.endDate).toLocaleDateString()}
														</p>
													)}
												</div>
											</div>
											<div className="flex items-center space-x-4">
												<div className="text-right">
													<p className="font-semibold text-red-600">
														${parseFloat(bill.amount || "0").toFixed(2)}
													</p>
													{bill.category && (
														<p className="text-sm text-muted-foreground">{bill.category.name}</p>
													)}
												</div>
												<div className="flex space-x-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleToggleActive(bill.id, bill.isActive)}
														disabled={toggleBillMutation.isPending}
													>
														{isActive ? "Pause" : "Activate"}
													</Button>
													<Button variant="outline" size="sm">
														Edit
													</Button>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleDeleteBill(bill.id)}
														disabled={deleteBillMutation.isPending}
													>
														Delete
													</Button>
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className="text-center py-8">
							<p className="text-muted-foreground mb-4">No recurring bills set up yet</p>
							<Button>
								Add Your First Recurring Bill
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Processing Results */}
			{processBillsMutation.data && (
				<Card>
					<CardHeader>
						<CardTitle>Processing Results</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4 mb-4">
							<div className="text-center">
								<p className="text-2xl font-bold text-green-600">{processBillsMutation.data.processed}</p>
								<p className="text-sm text-muted-foreground">Bills processed</p>
							</div>
							<div className="text-center">
								<p className="text-2xl font-bold text-orange-600">{processBillsMutation.data.skipped}</p>
								<p className="text-sm text-muted-foreground">Bills skipped</p>
							</div>
						</div>
						{processBillsMutation.data.skippedBills.length > 0 && (
							<div>
								<h5 className="font-medium mb-2">Skipped bills:</h5>
								<div className="space-y-1">
									{processBillsMutation.data.skippedBills.map((item: any, index: number) => (
										<p key={index} className="text-sm text-orange-600">
											{item.bill.name}: {item.reason}
										</p>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}