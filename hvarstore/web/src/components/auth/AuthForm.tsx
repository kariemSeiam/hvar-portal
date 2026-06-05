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
		<div className="rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e7e0d6] dark:border-[#2c2825] p-6 space-y-5">
			{/* Mode tabs */}
			<div className="flex rounded-xl bg-stone-100 dark:bg-stone-900 p-1">
				<button
					onClick={() => {
						setMode("login");
						setError(null);
					}}
					className={`flex-1 py-2 rounded-lg text-sm font-cairo font-bold transition-all ${
						mode === "login"
							? "bg-white dark:bg-[#1c1917] text-[#d43533] shadow-sm"
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
							? "bg-white dark:bg-[#1c1917] text-[#d43533] shadow-sm"
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
					<label className="block font-cairo text-sm font-semibold text-[#1c1917] dark:text-[#f5f5f4] mb-1.5">
						رقم الموبايل
					</label>
					<input
						type="tel"
						dir="ltr"
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						placeholder="01xxxxxxxxx"
						required
						className="w-full px-4 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] bg-[#fbf7f1] dark:bg-[#12110f] text-[#1c1917] dark:text-[#f5f5f4] font-inter text-sm text-left focus:outline-none focus:border-[#d43533] focus:ring-1 focus:ring-[#d43533]/30 transition-colors"
					/>
				</div>

				{/* Name — register only */}
				{mode === "register" && (
					<div>
						<label className="block font-cairo text-sm font-semibold text-[#1c1917] dark:text-[#f5f5f4] mb-1.5">
							الاسم
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="الاسم الكامل"
							required
							className="w-full px-4 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] bg-[#fbf7f1] dark:bg-[#12110f] text-[#1c1917] dark:text-[#f5f5f4] font-cairo text-sm focus:outline-none focus:border-[#d43533] focus:ring-1 focus:ring-[#d43533]/30 transition-colors"
						/>
					</div>
				)}

				{/* Password */}
				<div>
					<label className="block font-cairo text-sm font-semibold text-[#1c1917] dark:text-[#f5f5f4] mb-1.5">
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
						className="w-full px-4 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] bg-[#fbf7f1] dark:bg-[#12110f] text-[#1c1917] dark:text-[#f5f5f4] font-inter text-sm text-left focus:outline-none focus:border-[#d43533] focus:ring-1 focus:ring-[#d43533]/30 transition-colors"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					className="w-full py-3.5 rounded-xl bg-[#d43533] hover:bg-[#b91c1c] disabled:bg-stone-300 disabled:dark:bg-stone-700 text-white font-cairo font-bold text-base transition-all hover:shadow-[0_6px_20px_rgba(212,53,51,0.3)]"
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
				<p className="text-center text-xs font-cairo text-[#a8a29e]">
					نسيت كلمة المرور؟{" "}
					<a
						href="https://wa.me/201000000000?text=نسيت كلمة المرور — رقمي:"
						target="_blank"
						rel="noopener noreferrer"
						className="text-[#d43533] hover:underline"
					>
						تواصل معنا
					</a>
				</p>
			)}
		</div>
	);
}
