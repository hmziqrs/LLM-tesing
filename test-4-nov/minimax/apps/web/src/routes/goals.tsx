import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../utils/orpc";

export const Route = createFileRoute("/goals")({
	component: GoalsPage,
});

function GoalsPage() {
	const { data: goals, isLoading } = useQuery({
		queryKey: ["goals", "list"],
		queryFn: () => orpc.goals.list.query(),
	});

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center">Loading savings goals...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Savings Goals</h1>
				<button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
					Add Goal
				</button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{goals?.map((goal) => {
					const target = parseFloat(goal.targetAmount);
					const current = parseFloat(goal.currentAmount);
					const progress = target > 0 ? (current / target) * 100 : 0;

					return (
						<div
							key={goal.id}
							className="rounded-lg border border-variant bg-black/50 p-6"
						>
							<div className="mb-4 flex items-center gap-3">
								<div
									className="h-12 w-12 rounded-full"
									style={{ backgroundColor: goal.color }}
								/>
								<div>
									<h3 className="text-lg font-semibold">{goal.name}</h3>
									<p className="text-sm text-gray-400">
										{goal.description || "No description"}
									</p>
								</div>
							</div>

							<div className="mb-4 space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-400">Progress</span>
									<span className="text-sm font-semibold">
										{progress.toFixed(1)}%
									</span>
								</div>
								<div className="h-2 rounded-full bg-gray-800">
									<div
										className="h-2 rounded-full"
										style={{
											width: `${Math.min(progress, 100)}%`,
											backgroundColor: goal.color,
										}}
									/>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="text-gray-400">${current.toFixed(2)}</span>
									<span className="text-gray-400">${target.toFixed(2)}</span>
								</div>
							</div>

							{goal.targetDate && (
								<div className="mb-4 flex items-center justify-between text-sm">
									<span className="text-gray-400">Target Date</span>
									<span className="font-medium">
										{new Date(goal.targetDate).toLocaleDateString()}
									</span>
								</div>
							)}

							<div className="mb-4 flex items-center justify-between text-sm">
								<span className="text-gray-400">Priority</span>
								<span
									className={`capitalize ${
										goal.priority === "high"
											? "text-red-400"
											: goal.priority === "medium"
											? "text-yellow-400"
											: "text-green-400"
									}`}
								>
									{goal.priority}
								</span>
							</div>

							<button className="w-full rounded-lg border border-variant bg-transparent px-4 py-2 hover:bg-white/5">
								Add Contribution
							</button>
						</div>
					);
				}) || []}
			</div>

			{(!goals || goals.length === 0) && (
				<div className="rounded-lg border border-variant bg-black/50 p-12 text-center">
					<p className="text-gray-400">
						No savings goals yet. Create your first goal to start tracking your progress.
					</p>
				</div>
			)}
		</div>
	);
}
