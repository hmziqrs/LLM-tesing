import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export const Route = createFileRoute("/accounts")({
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
	const [isCreating, setIsCreating] = useState(false);

	const { data: accounts, isLoading } = useQuery(orpc.accounts.getAll.queryOptions());

	const createAccountMutation = useMutation({
		mutationFn: orpc.accounts.create.mutate,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.accounts.getAll.queryKey() });
			setIsCreating(false);
		},
	});

	const deleteAccountMutation = useMutation({
		mutationFn: orpc.accounts.delete.mutate,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.accounts.getAll.queryKey() });
		},
	});

	if (isLoading) {
		return <div className="p-6">Loading accounts...</div>;
	}

	const handleCreateAccount = () => {
		// Mock account creation for demo
		createAccountMutation.mutate({
			name: "New Account",
			type: "checking",
			balance: "1000.00",
			currency: "USD",
		});
	};

	const handleDeleteAccount = (id: number) => {
		if (confirm("Are you sure you want to delete this account?")) {
			deleteAccountMutation.mutate(id);
		}
	};

	const getAccountTypeLabel = (type: string) => {
		const types: Record<string, string> = {
			checking: "Checking",
			savings: "Savings",
			credit_card: "Credit Card",
			investment: "Investment",
			cash: "Cash",
			other: "Other",
		};
		return types[type] || type;
	};

	const getAccountTypeColor = (type: string) => {
		const colors: Record<string, string> = {
			checking: "bg-blue-100 text-blue-800",
			savings: "bg-green-100 text-green-800",
			credit_card: "bg-red-100 text-red-800",
			investment: "bg-purple-100 text-purple-800",
			cash: "bg-yellow-100 text-yellow-800",
			other: "bg-gray-100 text-gray-800",
		};
		return colors[type] || "bg-gray-100 text-gray-800";
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Accounts</h1>
				<Button onClick={handleCreateAccount} disabled={createAccountMutation.isPending}>
					{createAccountMutation.isPending ? "Creating..." : "Add Account"}
				</Button>
			</div>

			{accounts && accounts.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{accounts.map((account) => (
						<Card key={account.id} className={account.isActive ? "" : "opacity-60"}>
							<CardHeader>
								<div className="flex justify-between items-start">
									<div>
										<CardTitle className="text-lg">{account.name}</CardTitle>
										<CardDescription>{account.description}</CardDescription>
									</div>
									<Badge className={getAccountTypeColor(account.type)}>
										{getAccountTypeLabel(account.type)}
									</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="text-2xl font-bold">
										{account.currency} {parseFloat(account.balance || "0").toFixed(2)}
									</div>
									<div className="flex justify-between items-center text-sm text-muted-foreground">
										<span>Created {new Date(account.createdAt).toLocaleDateString()}</span>
										{!account.isActive && <Badge variant="secondary">Inactive</Badge>}
									</div>
									<div className="flex space-x-2 pt-2">
										<Button variant="outline" size="sm" className="flex-1">
											Edit
										</Button>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => handleDeleteAccount(account.id)}
											disabled={deleteAccountMutation.isPending}
										>
											Delete
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>No accounts yet</CardTitle>
						<CardDescription>
							Start by adding your first account to track your finances
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={handleCreateAccount} disabled={createAccountMutation.isPending}>
							{createAccountMutation.isPending ? "Creating..." : "Create Your First Account"}
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}