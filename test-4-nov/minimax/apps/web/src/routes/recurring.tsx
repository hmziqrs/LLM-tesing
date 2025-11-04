import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../utils/orpc";

export const Route = createFileRoute("/recurring")({
	component: RecurringPage,
});

function RecurringPage() {
	const { data: bills, isLoading } = useQuery({
		queryKey: ["recurring", "list"],
		queryFn: () => orpc.recurring.list.query(),
	});

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center">Loading recurring bills...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Recurring Bills</h1>
				<button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
					Add Recurring Bill
				</button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{bills?.map((bill) => (
					<div
						key={bill.id}
						className="rounded-lg border border-variant bg-black/50 p-6"
					>
						<div className="mb-4">
							<h3 className="text-lg font-semibold">{bill.name}</h3>
							<p className="text-sm text-gray-400">
								{bill.description || "No description"}
							</p>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-400">Amount</span>
								<span className="text-lg font-semibold">
									${parseFloat(bill.amount).toFixed(2)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-400">Frequency</span>
								<span className="text-sm font-medium capitalize">
									{bill.frequency}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-400">Next Due</span>
								<span className="text-sm font-medium">
									{new Date(bill.nextDueDate).toLocaleDateString()}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-400">Auto Pay</span>
								<span
									className={`text-sm ${bill.autoPay ? "text-green-400" : "text-gray-400"}`}
								>
									{bill.autoPay ? "Enabled" : "Disabled"}
								</span>
							</div>
						</div>
						<div className="mt-4 flex gap-2">
							<button className="flex-1 rounded-lg border border-variant bg-transparent px-4 py-2 hover:bg-white/5">
								Edit
							</button>
							<button className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">
								Delete
							</button>
						</div>
					</div>
				)) || []}
			</div>

			{(!bills || bills.length === 0) && (
				<div className="rounded-lg border border-variant bg-black/50 p-12 text-center">
					<p className="text-gray-400">
						No recurring bills yet. Add your first bill to track upcoming payments.
					</p>
				</div>
			)}
		</div>
	);
}
