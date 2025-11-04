import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export const Route = createFileRoute("/transactions")({
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
	const [page, setPage] = useState(1);

	const { data: transactionsData, isLoading } = useQuery(
		orpc.transactions.getAll.queryOptions({
			page,
			limit: 20,
		})
	);

	const deleteTransactionMutation = useMutation({
		mutationFn: orpc.transactions.delete.mutate,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.transactions.getAll.queryKey() });
		},
	});

	if (isLoading) {
		return <div className="p-6">Loading transactions...</div>;
	}

	const handleDeleteTransaction = (id: number) => {
		if (confirm("Are you sure you want to delete this transaction?")) {
			deleteTransactionMutation.mutate(id);
		}
	};

	const getTransactionTypeLabel = (type: string) => {
		const types: Record<string, string> = {
			income: "Income",
			expense: "Expense",
			transfer: "Transfer",
		};
		return types[type] || type;
	};

	const getTransactionTypeColor = (type: string) => {
		const colors: Record<string, string> = {
			income: "bg-green-100 text-green-800",
			expense: "bg-red-100 text-red-800",
			transfer: "bg-blue-100 text-blue-800",
		};
		return colors[type] || "bg-gray-100 text-gray-800";
	};

	const formatAmount = (amount: string, type: string) => {
		const amountNum = parseFloat(amount || "0");
		const sign = type === "income" ? "+" : "-";
		return `${sign}$${Math.abs(amountNum).toFixed(2)}`;
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Transactions</h1>
				<div className="flex space-x-2">
					<Link to="/import">
						<Button variant="outline">
							Import CSV
						</Button>
					</Link>
					<Button>
						Add Transaction
					</Button>
				</div>
			</div>

			{transactionsData?.transactions && transactionsData.transactions.length > 0 ? (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Recent Transactions</CardTitle>
							<CardDescription>
								Showing {transactionsData.transactions.length} of {transactionsData.pagination.total} transactions
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{transactionsData.transactions.map((transaction) => (
									<div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center space-x-4">
											<div className="flex items-center space-x-2">
												<Badge className={getTransactionTypeColor(transaction.type)}>
													{getTransactionTypeLabel(transaction.type)}
												</Badge>
												{transaction.category && (
													<Badge variant="outline">
														{transaction.category.name}
													</Badge>
												)}
											</div>
											<div>
												<p className="font-medium">{transaction.description}</p>
												<p className="text-sm text-muted-foreground">
													{transaction.account?.name} • {new Date(transaction.date).toLocaleDateString()}
												</p>
												{transaction.note && (
													<p className="text-sm text-muted-foreground">{transaction.note}</p>
												)}
											</div>
										</div>
										<div className="flex items-center space-x-4">
											<div className="text-right">
												<p className={`font-semibold ${
													transaction.type === "income" ? "text-green-600" :
													transaction.type === "expense" ? "text-red-600" : "text-blue-600"
												}`}>
													{formatAmount(transaction.amount, transaction.type)}
												</p>
											</div>
											<div className="flex space-x-2">
												<Button variant="outline" size="sm">
													Edit
												</Button>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleDeleteTransaction(transaction.id)}
													disabled={deleteTransactionMutation.isPending}
												>
													Delete
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Pagination */}
					{transactionsData.pagination.totalPages > 1 && (
						<div className="flex justify-center space-x-2">
							<Button
								variant="outline"
								onClick={() => setPage(page - 1)}
								disabled={page === 1}
							>
								Previous
							</Button>
							<span className="flex items-center px-4">
								Page {page} of {transactionsData.pagination.totalPages}
							</span>
							<Button
								variant="outline"
								onClick={() => setPage(page + 1)}
								disabled={page === transactionsData.pagination.totalPages}
							>
								Next
							</Button>
						</div>
					)}
				</>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>No transactions yet</CardTitle>
						<CardDescription>
							Start by adding your first transaction to track your spending
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button>
							Add Your First Transaction
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}