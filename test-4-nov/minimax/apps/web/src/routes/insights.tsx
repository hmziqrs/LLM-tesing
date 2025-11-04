import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../utils/orpc";

export const Route = createFileRoute("/insights")({
	component: InsightsPage,
});

function InsightsPage() {
	const [startDate] = useState(
		new Date(new Date().setMonth(new Date().getMonth() - 6)),
	);
	const [endDate] = useState(new Date());

	const { data: cashflow, isLoading: cashflowLoading } = useQuery({
		queryKey: ["reports", "cashflow", startDate, endDate],
		queryFn: () => orpc.reports.cashflow.query({ startDate, endDate }),
	});

	const { data: categoryBreakdown, isLoading: categoryLoading } = useQuery({
		queryKey: ["reports", "categoryBreakdown", startDate, endDate],
		queryFn: () => orpc.reports.categoryBreakdown.query({ startDate, endDate }),
	});

	if (cashflowLoading || categoryLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center">Loading insights...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-8 text-3xl font-bold">Insights & Reports</h1>

			<div className="mb-8 rounded-lg border border-variant bg-black/50 p-6">
				<h2 className="mb-4 text-xl font-semibold">Cashflow Trend</h2>
				<p className="text-sm text-gray-400">
					Income vs expenses over the last 6 months
				</p>

				{cashflow && cashflow.length > 0 ? (
					<div className="mt-6 space-y-4">
						{cashflow.map((month) => (
							<div key={month.month} className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="font-medium">{month.month}</span>
									<div className="flex items-center gap-4">
										<span className="text-sm text-green-400">
											Income: ${month.income.toFixed(2)}
										</span>
										<span className="text-sm text-red-400">
											Expense: ${month.expense.toFixed(2)}
										</span>
										<span
											className={`text-sm font-semibold ${
												month.net >= 0 ? "text-green-400" : "text-red-400"
											}`}
										>
											Net: ${month.net.toFixed(2)}
										</span>
									</div>
								</div>
								<div className="flex h-8 overflow-hidden rounded-full bg-gray-800">
									{month.income > 0 && (
										<div
											className="bg-green-600"
											style={{
												width: `${(month.income / (month.income + month.expense)) * 100}%`,
											}}
										/>
									)}
									{month.expense > 0 && (
										<div
											className="bg-red-600"
											style={{
												width: `${(month.expense / (month.income + month.expense)) * 100}%`,
											}}
										/>
									)}
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="mt-4 text-gray-400">
						No cashflow data available for the selected period.
					</p>
				)}
			</div>

			<div className="rounded-lg border border-variant bg-black/50 p-6">
				<h2 className="mb-4 text-xl font-semibold">Spending by Category</h2>
				<p className="text-sm text-gray-400">
					Where your money goes - last 6 months
				</p>

				{categoryBreakdown && categoryBreakdown.length > 0 ? (
					<div className="mt-6 space-y-4">
						{categoryBreakdown.map((category) => (
							<div key={category.categoryId} className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div
											className="h-4 w-4 rounded"
											style={{ backgroundColor: category.color }}
										/>
										<span className="font-medium">{category.categoryName}</span>
									</div>
									<span className="text-sm font-semibold">
										${category.total.toFixed(2)}
									</span>
								</div>
								<div className="h-2 rounded-full bg-gray-800">
									<div
										className="h-2 rounded-full"
										style={{
											width: `${(category.total / categoryBreakdown[0].total) * 100}%`,
											backgroundColor: category.color,
										}}
									/>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="mt-4 text-gray-400">
						No spending data available for the selected period.
					</p>
				)}
			</div>
		</div>
	);
}
