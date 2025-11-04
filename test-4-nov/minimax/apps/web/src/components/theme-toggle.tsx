import { useState, useEffect } from "react";

type Theme = "dark" | "light" | "system";

export function ThemeToggle() {
	const [theme, setTheme] = useState<Theme>("dark");

	useEffect(() => {
		const saved = localStorage.getItem("theme") as Theme | null;
		if (saved) {
			setTheme(saved);
			applyTheme(saved);
		} else {
			applyTheme("dark");
		}
	}, []);

	function applyTheme(theme: Theme) {
		const root = document.documentElement;
		root.classList.remove("light", "dark");

		if (theme === "system") {
			const systemTheme = window.matchMedia("(prefers-color-scheme: light)").matches
				? "light"
				: "dark";
			root.classList.add(systemTheme);
		} else {
			root.classList.add(theme);
		}
	}

	function toggleTheme() {
		const newTheme = theme === "dark" ? "light" : "dark";
		setTheme(newTheme);
		localStorage.setItem("theme", newTheme);
		applyTheme(newTheme);
	}

	return (
		<button
			onClick={toggleTheme}
			className="p-2 rounded-lg border-variant hover:bg-white/5 transition-colors"
			aria-label="Toggle theme"
		>
			{theme === "dark" ? (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<circle cx="12" cy="12" r="5" />
					<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
				</svg>
			) : (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
				</svg>
			)}
		</button>
	);
}
