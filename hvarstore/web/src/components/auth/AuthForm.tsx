import { useState } from "react";
import { login, register } from "../../lib/auth";

export default function AuthForm() {
	const [mode, setMode] = useState<"login" | "register">("login");
	const [phone, setPhone] = useState("");
	const [name, setName] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			if (mode === "login") {
				await login(phone, password);
			} else {
				await register(phone, name, password);
			}
			const redirect =
				new URLSearchParams(window.location.search).get("redirect") ?? "/";
			window.location.href = redirect;
		} catch (err) {
			setError(err instanceof Error ? err.message : "حدث خطأ");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="rounded-2xl bg-surface border border-hvar p-6 space-y-5">
			{/* Mode tabs */}
			<div className="flex rounded-xl bg-stone-100 dark:bg-stone-900 p-1">
				<button
					onClick={() => {
						setMode("login");
						setError(null);
					}}
					className={`flex-1 py-2 rounded-lg text-sm font-cairo font-bold transition-all ${
						mode === "login"
							? "bg-surface text-brand shadow-sm"
							: "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
					}`}
				>
					دخول
				</button>
				<button
					onClick={() => {
						setMode("register");
						setError(null);
					}}
					className={`flex-1 py-2 rounded-lg text-sm font-cairo font-bold transition-all ${
						mode === "register"
							? "bg-surface text-brand shadow-sm"
							: "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
					}`}
				>
					حساب جديد
				</button>
			</div>

			{error && (
				<div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm font-cairo">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Phone */}
				<div>
					<label className="block font-cairo text-sm font-semibold text-ink mb-1.5">
						رقم الموبايل
					</label>
					<input
						type="tel"
						dir="ltr"
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						placeholder="01xxxxxxxxx"
						required
						className="hvar-input w-full px-4 py-3 rounded-xl font-inter text-sm text-left transition-colors"
					/>
				</div>

				{/* Name — register only */}
				{mode === "register" && (
					<div>
						<label className="block font-cairo text-sm font-semibold text-ink mb-1.5">
							الاسم
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="الاسم الكامل"
							required
							className="hvar-input w-full px-4 py-3 rounded-xl font-cairo text-sm transition-colors"
						/>
					</div>
				)}

				{/* Password */}
				<div>
					<label className="block font-cairo text-sm font-semibold text-ink mb-1.5">
						كلمة المرور
					</label>
					<input
						type="password"
						dir="ltr"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="••••••"
						required
						minLength={6}
						className="hvar-input w-full px-4 py-3 rounded-xl font-inter text-sm text-left transition-colors"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					className="w-full py-3.5 rounded-xl bg-brand hover:bg-[var(--c-brand-hover)] disabled:bg-stone-300 disabled:dark:bg-stone-700 text-white font-cairo font-bold text-base transition-all hover:shadow-[0_6px_20px_rgba(var(--c-brand-rgb),0.3)]"
					style={{ transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
				>
					{loading
						? "جاري..."
						: mode === "login"
							? "تسجيل الدخول"
							: "إنشاء حساب"}
				</button>
			</form>

			{mode === "login" && (
				<p className="text-center text-xs font-cairo text-muted">
					نسيت كلمة المرور؟{" "}
					<a
						href="https://wa.me/201204444196?text=نسيت كلمة المرور — رقمي:"
						target="_blank"
						rel="noopener noreferrer"
						className="text-brand hover:underline"
					>
						تواصل معنا
					</a>
				</p>
			)}
		</div>
	);
}
