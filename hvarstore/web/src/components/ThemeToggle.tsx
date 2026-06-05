import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
	const [dark, setDark] = useState(false);

	useEffect(() => {
		setDark(document.documentElement.classList.contains("dark"));
	}, []);

	function toggle() {
		const next = !dark;
		setDark(next);
		document.documentElement.classList.toggle("dark", next);
		localStorage.setItem("hvar-theme", next ? "dark" : "light");
	}

	return (
		<button
			onClick={toggle}
			className="flex items-center justify-center w-9 h-9 rounded-full text-stone-500 hover:text-stone-800 hover:bg-red-50 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors"
			aria-label="تغيير المظهر"
		>
			{dark ? <Sun size={17} /> : <Moon size={17} />}
		</button>
	);
}
