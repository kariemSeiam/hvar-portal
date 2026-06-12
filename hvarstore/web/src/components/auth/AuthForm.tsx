import { useEffect, useState } from "react";
import {
	loginWithPhone,
	checkPhone,
	facebookExchange,
	facebookComplete,
	normalizeEgyptPhone,
} from "../../lib/auth";
import { isFacebookEnabled, facebookLogin } from "../../lib/facebook-sdk";

// ── Intent ──────────────────────────────────────────────────────────────────
// Where the customer came from decides BOTH the greeting and where we land them
// after auth. The redirect param is the signal; we gate it to same-site paths
// (no open redirect — `?redirect=https://evil.com` is ignored).
interface Intent {
	target: string;
	eyebrow: string;
	title: string;
	sub: string;
}

const DEFAULT_INTENT: Intent = {
	target: "/",
	eyebrow: "أهلاً بيك",
	title: "أهلاً بيك في هفار",
	sub: "ادخل برقم موبايلك.",
};

function safeRedirect(): string | null {
	const raw = new URLSearchParams(window.location.search).get("redirect");
	if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
	return null;
}

function resolveIntent(): Intent {
	const target = safeRedirect();
	if (target?.startsWith("/orders"))
		return {
			target,
			eyebrow: "طلباتك",
			title: "تابع طلباتك",
			sub: "ادخل برقم موبايلك علشان نوريك طلباتك وحالتها.",
		};
	if (target?.startsWith("/account"))
		return {
			target,
			eyebrow: "حسابك",
			title: "حسابك في هفار",
			sub: "ادخل برقم موبايلك.",
		};
	if (target?.startsWith("/service"))
		return {
			target,
			eyebrow: "الدعم والصيانة",
			title: "الدعم والصيانة",
			sub: "ادخل برقم موبايلك علشان نتابع طلب الصيانة.",
		};
	if (target?.startsWith("/checkout"))
		return {
			target,
			eyebrow: "خطوة أخيرة",
			title: "خطوة وتكمل طلبك",
			sub: "ادخل برقم موبايلك علشان نكمل الطلب.",
		};
	return { ...DEFAULT_INTENT, target: target ?? "/" };
}

export default function AuthForm() {
	// Computed after mount — window isn't available during Astro's SSR pass.
	const [intent, setIntent] = useState<Intent>(DEFAULT_INTENT);
	useEffect(() => setIntent(resolveIntent()), []);

	// "phone" = ask for the number. "name" = new customer, introduce yourself.
	// "fbPhone" = Facebook succeeded, we still need a phone.
	const [phase, setPhase] = useState<"phone" | "name" | "fbPhone">("phone");
	const [phone, setPhone] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [fbLoading, setFbLoading] = useState(false);
	const [fbToken, setFbToken] = useState<string | null>(null);

	const fbEnabled = isFacebookEnabled();

	function go() {
		window.location.href = intent.target;
	}

	// Phone beat: known number logs straight in; new number reveals the name beat.
	async function handlePhoneSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		const normalized = normalizeEgyptPhone(phone);
		if (!normalized) {
			setError("رقم الموبايل المصري لازم يبدأ بـ 01 و يكون ١١ رقم.");
			return;
		}
		setLoading(true);
		try {
			const exists = await checkPhone(normalized);
			if (exists) {
				await loginWithPhone(normalized);
				go();
				return; // keep the spinner through the redirect
			}
			setPhone(normalized);
			setName("");
			setPhase("name");
			setLoading(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "حدث خطأ");
			setLoading(false);
		}
	}

	// Name beat: create the account with the name they just gave us, then route.
	async function handleNameSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (name.trim().length < 2) {
			setError("اكتب اسمك علشان نكمل — هيظهر على طلباتك.");
			return;
		}
		const normalized = normalizeEgyptPhone(phone);
		if (!normalized) {
			setError("رقم الموبايل المصري لازم يبدأ بـ 01 و يكون ١١ رقم.");
			setPhase("phone");
			return;
		}
		setLoading(true);
		try {
			await loginWithPhone(normalized, name.trim());
			go();
		} catch (err) {
			setError(err instanceof Error ? err.message : "حدث خطأ");
			setLoading(false);
		}
	}

	async function handleFacebook() {
		setError(null);
		setFbLoading(true);
		try {
			const accessToken = await facebookLogin();
			const result = await facebookExchange(accessToken);
			if (result.loggedIn) {
				go();
				return;
			}
			setFbToken(result.fbToken ?? null);
			if (result.name) setName(result.name);
			setPhase("fbPhone");
			setFbLoading(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "حدث خطأ");
			setFbLoading(false);
		}
	}

	async function handleFbComplete(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		const normalized = normalizeEgyptPhone(phone);
		if (!normalized) {
			setError("رقم الموبايل المصري لازم يبدأ بـ 01 و يكون ١١ رقم.");
			return;
		}
		if (!fbToken) {
			setError("انتهت صلاحية الجلسة — ابدأ من جديد");
			setPhase("phone");
			return;
		}
		setLoading(true);
		try {
			await facebookComplete(fbToken, normalized, name.trim() || undefined);
			go();
		} catch (err) {
			setError(err instanceof Error ? err.message : "حدث خطأ");
			setLoading(false);
		}
	}

	const errorBox = error && (
		<div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm font-cairo">
			{error}
		</div>
	);

	// ── Facebook completion: just the phone ──
	if (phase === "fbPhone") {
		return (
			<div key="fbPhone" className="auth-beat space-y-6">
				<header className="space-y-1.5">
					<p className="font-cairo font-semibold text-[10px] uppercase tracking-[0.14em] text-brand">
						خطوة أخيرة
					</p>
					<h2 className="font-cairo font-black text-2xl text-ink">
						اكتب رقم موبايلك
					</h2>
					<p className="font-cairo text-sm text-muted">
						علشان نكمّل حسابك ونوصّلك طلباتك على طول.
					</p>
				</header>

				<div className="rounded-2xl bg-surface border border-hvar p-6 space-y-5">
					{errorBox}
					<form onSubmit={handleFbComplete} className="space-y-4">
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
								autoComplete="tel"
								required
								autoFocus
								className="hvar-input w-full px-4 py-3 rounded-xl font-inter text-sm text-left transition-colors"
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="w-full py-3.5 rounded-xl bg-brand hover:bg-[var(--c-brand-hover)] disabled:bg-stone-300 disabled:dark:bg-stone-700 text-white font-cairo font-bold text-base transition-all hover:shadow-[0_6px_20px_rgba(var(--c-brand-rgb),0.3)]"
							style={{ transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
						>
							{loading ? "جاري..." : "تأكيد وإنشاء الحساب"}
						</button>
					</form>
					<button
						type="button"
						onClick={() => {
							setError(null);
							setFbToken(null);
							setPhase("phone");
						}}
						className="w-full text-center font-cairo text-xs text-muted hover:text-brand"
					>
						رجوع
					</button>
				</div>
			</div>
		);
	}

	// ── New customer: introduce yourself ──
	if (phase === "name") {
		return (
			<div key="name" className="auth-beat space-y-6">
				<header className="space-y-1.5">
					<p className="font-cairo font-semibold text-[10px] uppercase tracking-[0.14em] text-brand">
						أول مرة معانا
					</p>
					<h2 className="font-cairo font-black text-2xl text-ink">
						عرّفنا باسمك
					</h2>
					<p className="font-cairo text-sm text-muted">
						اسمك بيظهر على طلباتك وفواتيرك — وبيخلينا نكلّمك صح.
					</p>
				</header>

				<div className="rounded-2xl bg-surface border border-hvar p-6 space-y-5">
					{/* The phone they entered — visible and editable for typo recovery */}
					<div
						className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
						style={{
							background: "color-mix(in srgb, var(--c-brand) 6%, transparent)",
							border: "1px solid var(--c-brand-line)",
						}}
					>
						<div className="flex items-center gap-2.5 min-w-0">
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
								<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2-.5c.9.3 1.9.6 2.9.7A2 2 0 0 1 22 16.9Z" />
							</svg>
							<span className="font-inter text-sm text-ink truncate" dir="ltr">
								{phone}
							</span>
						</div>
						<button
							type="button"
							onClick={() => {
								setError(null);
								setPhase("phone");
							}}
							className="font-cairo text-xs text-brand hover:underline shrink-0"
						>
							تعديل
						</button>
					</div>

					{errorBox}

					<form onSubmit={handleNameSubmit} className="space-y-4">
						<div>
							<label className="block font-cairo text-sm font-semibold text-ink mb-1.5">
								الاسم
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="اسمك الكامل"
								autoComplete="name"
								required
								autoFocus
								className="hvar-input w-full px-4 py-3 rounded-xl font-cairo text-sm transition-colors"
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="w-full py-3.5 rounded-xl bg-brand hover:bg-[var(--c-brand-hover)] disabled:bg-stone-300 disabled:dark:bg-stone-700 text-white font-cairo font-bold text-base transition-all hover:shadow-[0_6px_20px_rgba(var(--c-brand-rgb),0.3)]"
							style={{ transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
						>
							{loading ? "جاري..." : "إنشاء الحساب والمتابعة"}
						</button>
					</form>
				</div>
			</div>
		);
	}

	// ── Phone beat (default): the only thing we ask first ──
	return (
		<div key="phone" className="auth-beat space-y-6">
			<header className="space-y-1.5">
				<p className="font-cairo font-semibold text-[10px] uppercase tracking-[0.14em] text-brand">
					{intent.eyebrow}
				</p>
				<h2 className="font-cairo font-black text-2xl text-ink">
					{intent.title}
				</h2>
				<p className="font-cairo text-sm text-muted">{intent.sub}</p>
			</header>

			<div className="rounded-2xl bg-surface border border-hvar p-6 space-y-5">
				{errorBox}

				<form onSubmit={handlePhoneSubmit} className="space-y-4">
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
							autoComplete="tel"
							required
							autoFocus
							className="hvar-input w-full px-4 py-3 rounded-xl font-inter text-sm text-left transition-colors"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full py-3.5 rounded-xl bg-brand hover:bg-[var(--c-brand-hover)] disabled:bg-stone-300 disabled:dark:bg-stone-700 text-white font-cairo font-bold text-base flex items-center justify-center gap-2 transition-all hover:shadow-[0_6px_20px_rgba(var(--c-brand-rgb),0.3)]"
						style={{ transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
					>
						{loading ? (
							"جاري..."
						) : (
							<>
								متابعة
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
									<path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</>
						)}
					</button>
				</form>

				{fbEnabled && (
					<>
						<div className="flex items-center gap-3">
							<span className="h-px flex-1 bg-[var(--c-hairline)]" />
							<span className="font-cairo text-xs text-faint">أو</span>
							<span className="h-px flex-1 bg-[var(--c-hairline)]" />
						</div>

						<button
							type="button"
							onClick={handleFacebook}
							disabled={fbLoading}
							className="w-full py-3.5 rounded-xl border border-hvar bg-surface hover:border-[#1877F2] text-ink font-cairo font-bold text-sm flex items-center justify-center gap-2.5 transition-all disabled:opacity-60"
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
								<path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.08 24 18.09 24 12.07Z" />
							</svg>
							{fbLoading ? "جاري فتح فيسبوك..." : "الدخول عبر فيسبوك"}
						</button>
					</>
				)}

				<p className="text-center text-xs font-cairo text-muted">
					مش لاقي حسابك؟{" "}
					<a
						href="https://wa.me/201204444196?text=محتاج مساعدة في الدخول — رقمي:"
						target="_blank"
						rel="noopener noreferrer"
						className="text-brand hover:underline"
					>
						تواصل معنا
					</a>
				</p>
			</div>
		</div>
	);
}
