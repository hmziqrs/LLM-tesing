import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../utils/orpc";

export const Route = createFileRoute("/accounts")({
	component: AccountsPage,
});

function AccountsPage() {
	const { data: accounts, isLoading } = useQuery({
		queryKey: ["accounts", "list"],
		queryFn: () => orpc.accounts.list.query(),
	});

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center">Loading accounts...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Accounts</h1>
				<button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
					Add Account
				</button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{accounts?.map((account) => (
					<div
						key={account.id}
						className="rounded-lg border border-variant bg-black/50 p-6"
					>
						<div className="mb-4 flex items-center gap-3">
							<div
								className="h-10 w-10 rounded-full"
								style={{ backgroundColor: account.color }}
							/>
							<div>
								<h3 className="text-lg font-semibold">{account.name}</h3>
								<p className="text-sm text-gray-400">
									{account.description || "No description"}
								</p>
							</div>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-400">Balance</span>
							<span className="text-xl font-bold">${account.balance || 0}</span>
						</div>
					</div>
				)) || []}
			</div>

			{(!accounts || accounts.length === 0) && (
				<div className="rounded-lg border border-variant bg-black/50 p-12 text-center">
					<p className="text-gray-400">
						No accounts yet. Create your first account to get started.
					</p>
				</div>
			)}
		</div>
	);
}
