import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../utils/orpc";

export const Route = createFileRoute("/transactions")({
	component: TransactionsPage,
});

function TransactionsPage() {
	const [limit] = useState(50);

	const { data: transactions, isLoading } = useQuery({
		queryKey: ["transactions", "list", limit],
		queryFn: () => orpc.transactions.list.query({ limit, offset: 0 }),
	});

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center">Loading transactions...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Transactions</h1>
				<button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
					Add Transaction
				</button>
			</div>

			<div className="rounded-lg border border-variant bg-black/50">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="border-b border-variant">
							<tr>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
									Date
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
									Description
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
									Type
								</th>
								<th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">
									Amount
								</th>
							</tr>
						</thead>
						<tbody>
							{transactions?.map((tx) => (
								<tr
									key={tx.id}
									className="border-b border-variant hover:bg-white/5"
								>
									<td className="px-6 py-4 text-sm">
										{new Date(tx.date).toLocaleDateString()}
									</td>
									<td className="px-6 py-4 text-sm">{tx.description}</td>
									<td className="px-6 py-4 text-sm">
										<span
											className={`rounded-full px-2 py-1 text-xs ${
												tx.type === "income"
													? "bg-green-500/20 text-green-400"
													: "bg-red-500/20 text-red-400"
											}`}
										>
											{tx.type}
										</span>
									</td>
									<td className="px-6 py-4 text-right text-sm font-semibold">
										<span
											className={
												tx.type === "income" ? "text-green-400" : "text-red-400"
											}
										>
											{tx.type === "income" ? "+" : "-"}
											${Math.abs(parseFloat(tx.amount)).toFixed(2)}
										</span>
									</td>
								</tr>
							)) || []}
						</tbody>
					</table>
				</div>
			</div>

			{(!transactions || transactions.length === 0) && (
				<div className="rounded-lg border border-variant bg-black/50 p-12 text-center">
					<p className="text-gray-400">
						No transactions yet. Add your first transaction to get started.
					</p>
				</div>
			)}
		</div>
	);
}
