import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../utils/orpc";

export const Route = createFileRoute("/budgets")({
	component: BudgetsPage,
});

function BudgetsPage() {
	const currentDate = new Date();
	const month = currentDate.getMonth() + 1;
	const year = currentDate.getFullYear();

	const { data: categories, isLoading: categoriesLoading } = useQuery({
		queryKey: ["budgets", "categories"],
		queryFn: () => orpc.budgets.listCategories.query(),
	});

	const { data: overview, isLoading: overviewLoading } = useQuery({
		queryKey: ["budgets", "overview", month, year],
		queryFn: () => orpc.budgets.getOverview.query({ month, year }),
	});

	if (categoriesLoading || overviewLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center">Loading budgets...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Budget Overview</h1>
				<button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
					Add Category
				</button>
			</div>

			<div className="mb-8 rounded-lg border border-variant bg-black/50 p-6">
				<h2 className="mb-4 text-xl font-semibold">
					{currentDate.toLocaleString("default", { month: "long" })} {year}
				</h2>
				<div className="space-y-4">
					{overview?.map((item) => {
						const allocated = parseFloat(item.allocatedAmount);
						const spent = parseFloat(item.spentAmount);
						const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;

						return (
							<div key={item.id} className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div
											className="h-4 w-4 rounded"
											style={{ backgroundColor: item.color }}
										/>
										<span className="font-medium">{item.name}</span>
									</div>
									<span className="text-sm text-gray-400">
										${spent} / ${allocated}
									</span>
								</div>
								<div className="h-2 rounded-full bg-gray-800">
									<div
										className="h-2 rounded-full bg-blue-600"
										style={{ width: `${Math.min(percentage, 100)}%` }}
									/>
								</div>
								<div className="text-right text-sm text-gray-400">
									{percentage.toFixed(1)}%
								</div>
							</div>
						);
					}) || []}
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{categories?.map((category) => (
					<div
						key={category.id}
						className="rounded-lg border border-variant bg-black/50 p-6"
					>
						<div className="mb-4 flex items-center gap-3">
							<div
								className="h-10 w-10 rounded-full"
								style={{ backgroundColor: category.color }}
							/>
							<div>
								<h3 className="text-lg font-semibold">{category.name}</h3>
								<p className="text-sm text-gray-400">
									{category.description || "No description"}
								</p>
							</div>
						</div>
						<button className="w-full rounded-lg border border-variant bg-transparent px-4 py-2 hover:bg-white/5">
							Set Budget
						</button>
					</div>
				)) || []}
			</div>

			{(!categories || categories.length === 0) && (
				<div className="rounded-lg border border-variant bg-black/50 p-12 text-center">
					<p className="text-gray-400">
						No budget categories yet. Create your first category to get started.
					</p>
				</div>
			)}
		</div>
	);
}
