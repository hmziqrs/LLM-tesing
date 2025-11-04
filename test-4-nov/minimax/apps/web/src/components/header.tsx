import { Link } from "@tanstack/react-router";
import UserMenu from "./user-menu";
import { ThemeToggle } from "./theme-toggle";

export default function Header() {
	const links = [
		{ to: "/", label: "Home" },
		{ to: "/dashboard", label: "Dashboard" },
		{ to: "/budgets", label: "Budgets" },
		{ to: "/transactions", label: "Transactions" },
		{ to: "/recurring", label: "Recurring" },
		{ to: "/goals", label: "Goals" },
		{ to: "/insights", label: "Insights" },
	] as const;

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<Link key={to} to={to}>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<ThemeToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	);
}
