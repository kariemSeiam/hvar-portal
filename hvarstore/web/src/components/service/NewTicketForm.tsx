import { useEffect, useState, type FormEvent } from "react";
import { useStore } from "@nanostores/react";
import {
	Wrench,
	RefreshCw,
	RotateCcw,
	Loader2,
	CheckCircle2,
	ChevronDown,
	Ticket,
} from "lucide-react";
import {
	isLoggedIn,
	authUser,
	getAuthHeaders,
	login,
	register,
	logout,
	normalizeEgyptPhone,
} from "../../lib/auth";

const API = import.meta.env?.PUBLIC_API_URL ?? "http://localhost:5000";

const TICKET_TYPES = [
	{
		value: "M" as const,
		label: "صيانة",
		desc: "طلب صيانة لمنتج",
		icon: Wrench,
	},
	{
		value: "R" as const,
		label: "استبدال",
		desc: "استبدال منتج معطوب",
		icon: RefreshCw,
	},
	{
		value: "T" as const,
		label: "مرتجع",
		desc: "إرجاع منتج",
		icon: RotateCcw,
	},
] as const;

type TicketType = "M" | "R" | "T";

interface Order {
	id: number;
	status: string;
	total: number;
	createdAt: string;
}

export default function NewTicketForm() {
	const loggedIn = useStore(isLoggedIn);
	const user = useStore(authUser);

	const [type, setType] = useState<TicketType>("M");
	const [transactionId, setTransactionId] = useState<number | null>(null);
	const [productName, setProductName] = useState("");
	const [description, setDescription] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<{
		ticketCode: string;
		id: number;
	} | null>(null);
	const [orders, setOrders] = useState<Order[]>([]);

	// Inline contact/auth — a customer with a broken appliance never hits a login wall
	const [authMode, setAuthMode] = useState<"new" | "existing">("new");
	const [authPhone, setAuthPhone] = useState("");
	const [authName, setAuthName] = useState("");
	const [authPassword, setAuthPassword] = useState("");

	useEffect(() => {
		if (!loggedIn) return;
		fetch(`${API}/api/orders`, {
			headers: { ...getAuthHeaders() },
		})
			.then((r) => r.json())
			.then((d) => setOrders(d.items ?? []))
			.catch(() => {});
	}, [loggedIn]);

	if (success) {
		return (
			<div className="py-4">
				<div
					className="relative overflow-hidden rounded-2xl p-8 text-center"
					style={{
						background: "linear-gradient(135deg, #130F0C 0%, #1e1208 100%)",
						border: "1px solid rgba(var(--c-brand-rgb),0.20)",
					}}
				>
					<div
						className="absolute inset-0 pointer-events-none"
						aria-hidden="true"
						style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(var(--c-brand-rgb),0.14) 0%, transparent 70%)" }}
					/>
					<div
						className="relative w-16 h-16 mx-auto flex items-center justify-center rounded-2xl mb-5"
						style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.22)" }}
					>
						<CheckCircle2 size={32} className="text-green-400" />
					</div>
					<h2 className="relative font-cairo font-black text-2xl mb-3" style={{ color: "#F5EFE6" }}>
						تم إرسال الطلب
					</h2>
					<div
						className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-4"
						style={{ background: "rgba(var(--c-brand-rgb),0.10)", border: "1px solid rgba(var(--c-brand-rgb),0.25)" }}
					>
						<Ticket size={13} style={{ color: "var(--c-brand)" }} />
						<span className="font-mono font-bold text-lg" style={{ color: "var(--c-brand)" }}>
							{success.ticketCode}
						</span>
					</div>
					<p className="relative font-cairo text-sm mb-8" style={{ color: "rgba(245,239,230,0.50)" }}>
						فريق الصيانة هيتواصل معك خلال ٢٤ ساعة
					</p>
					<div className="relative flex flex-col sm:flex-row gap-3 justify-center">
						<a
							href={`/service/${success.id}`}
							className="px-6 py-3 rounded-xl font-cairo font-bold text-sm text-white transition-all hover:opacity-90"
							style={{ background: "var(--c-brand)", transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
						>
							تتبع الطلب
						</a>
						<a
							href="/service"
							className="px-6 py-3 rounded-xl font-cairo font-semibold text-sm transition-all"
							style={{ border: "1px solid rgba(245,239,230,0.15)", color: "rgba(245,239,230,0.60)" }}
						>
							كل الطلبات
						</a>
					</div>
				</div>
			</div>
		);
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);

		// Authenticate inline first when needed — same phone-first pattern as checkout
		if (!loggedIn) {
			const phone = normalizeEgyptPhone(authPhone);
			if (!phone) {
				setError("رقم الموبايل المصري لازم يبدأ بـ 01 و يكون ١١ رقم.");
				return;
			}
			if (authMode === "new" && !authName.trim()) {
				setError("اكتبي اسمك");
				return;
			}
			if (authPassword.length < 6) {
				setError("كلمة السر لازم تكون ٦ حروف على الأقل");
				return;
			}
			setLoading(true);
			try {
				if (authMode === "new") {
					await register(phone, authName.trim(), authPassword);
				} else {
					await login(phone, authPassword);
				}
			} catch (err) {
				const msg = err instanceof Error ? err.message : "حدث خطأ";
				if (authMode === "new" && /موجود|exists|registered/i.test(msg)) {
					setAuthMode("existing");
					setError("الرقم ده متسجل عندنا — اكتبي كلمة السر للدخول");
				} else {
					setError(msg);
				}
				setLoading(false);
				return;
			}
			setLoading(false);
		}

		setLoading(true);
		try {
			const body: {
				type: TicketType;
				productName: string;
				description: string;
				transactionId?: number;
			} = {
				type,
				productName: productName.trim(),
				description: description.trim(),
			};
			if (transactionId !== null) body.transactionId = transactionId;

			const res = await fetch(`${API}/api/tickets`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...getAuthHeaders(),
				},
				body: JSON.stringify(body),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error ?? data.message ?? "فشل في إرسال الطلب");
			}

			setSuccess({ ticketCode: data.ticketCode, id: data.id });
		} catch (err) {
			setError(err instanceof Error ? err.message : "حدث خطأ");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{error && (
				<div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm font-cairo">
					{error}
				</div>
			)}

			{/* Contact — phone is identity, auth happens inline */}
			<section className="rounded-2xl bg-surface border border-hvar p-5 space-y-4">
				<h2 className="font-cairo font-bold text-sm text-ink">بياناتك</h2>

				{loggedIn && user ? (
					<div
						className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
						style={{ background: "color-mix(in srgb, var(--c-brand) 6%, transparent)", border: "1px solid var(--c-brand-line)" }}
					>
						<div className="flex items-center gap-2.5 min-w-0">
							<CheckCircle2 size={16} className="text-brand shrink-0" />
							<div className="min-w-0">
								<p className="font-cairo font-bold text-sm text-ink truncate">{user.name}</p>
								<p className="font-inter text-xs text-muted" dir="ltr">{user.phone}</p>
							</div>
						</div>
						<button
							type="button"
							onClick={() => logout()}
							className="font-cairo text-xs text-brand hover:underline shrink-0"
						>
							مش أنتِ؟
						</button>
					</div>
				) : (
					<>
						<div>
							<label className="block font-cairo text-xs font-semibold text-muted mb-1.5">رقم الموبايل</label>
							<input
								type="tel"
								dir="ltr"
								value={authPhone}
								onChange={(e) => setAuthPhone(e.target.value)}
								placeholder="01xxxxxxxxx"
								autoComplete="tel"
								className="hvar-input w-full px-4 py-3 rounded-xl font-inter text-sm text-left"
							/>
						</div>
						{authMode === "new" && (
							<div>
								<label className="block font-cairo text-xs font-semibold text-muted mb-1.5">الاسم</label>
								<input
									type="text"
									value={authName}
									onChange={(e) => setAuthName(e.target.value)}
									placeholder="اسمك الكامل"
									autoComplete="name"
									className="hvar-input w-full px-4 py-3 rounded-xl font-cairo text-sm"
								/>
							</div>
						)}
						<div>
							<label className="block font-cairo text-xs font-semibold text-muted mb-1.5">كلمة السر</label>
							<input
								type="password"
								value={authPassword}
								onChange={(e) => setAuthPassword(e.target.value)}
								placeholder={authMode === "new" ? "كلمة سر جديدة (٦ حروف على الأقل)" : "كلمة السر"}
								autoComplete={authMode === "new" ? "new-password" : "current-password"}
								className="hvar-input w-full px-4 py-3 rounded-xl font-cairo text-sm"
							/>
						</div>
						<button
							type="button"
							onClick={() => { setError(null); setAuthMode(authMode === "new" ? "existing" : "new"); }}
							className="font-cairo text-xs text-brand hover:underline"
						>
							{authMode === "new" ? "عندك حساب؟ ادخلي بكلمة السر" : "أول مرة؟ كملي ببياناتك وهنعملك حساب"}
						</button>
					</>
				)}
			</section>

			{/* Type selector */}
			<section className="rounded-2xl bg-surface border border-hvar p-5 space-y-3">
				<div className="flex items-center gap-2 mb-1">
					<Ticket size={16} className="text-brand" />
					<h2 className="font-cairo font-bold text-sm text-ink">
						نوع الطلب
					</h2>
				</div>

				{TICKET_TYPES.map((t) => (
					<label
						key={t.value}
						style={{ transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
						className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${
							type === t.value
								? "border-[var(--c-brand)] bg-red-50/50 dark:bg-red-950/10"
								: "border-hvar hover:border-stone-300 dark:hover:border-stone-600"
						}`}
					>
						<input
							type="radio"
							name="ticketType"
							value={t.value}
							checked={type === t.value}
							onChange={() => setType(t.value)}
							className="sr-only"
						/>
						<div
							className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
								type === t.value
									? "border-[var(--c-brand)]"
									: "border-stone-300 dark:border-stone-600"
							}`}
						>
							{type === t.value && (
								<div className="w-2.5 h-2.5 rounded-full bg-brand" />
							)}
						</div>
						<div
							className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
								type === t.value
									? "bg-red-100 dark:bg-red-950/30 text-brand"
									: "bg-stone-100 dark:bg-stone-800 text-stone-400"
							}`}
						>
							<t.icon size={16} />
						</div>
						<div className="flex-1">
							<p className="font-cairo font-bold text-sm text-ink">
								{t.label}
							</p>
							<p className="font-cairo text-xs text-muted">
								{t.desc}
							</p>
						</div>
					</label>
				))}
			</section>

			{/* Details */}
			<section className="rounded-2xl bg-surface border border-hvar p-5 space-y-4">
				{/* Linked order */}
				{orders.length > 0 && (
					<div>
						<label className="block font-cairo text-xs font-semibold text-muted mb-1.5">
							ربط بطلب (اختياري)
						</label>
						<div className="relative">
							<select
								value={transactionId ?? ""}
								onChange={(e) =>
									setTransactionId(Number(e.target.value) || null)
								}
								className="hvar-input hvar-select w-full px-4 py-3 rounded-xl font-cairo text-sm appearance-none text-left"
							>
								<option value="">— بدون ربط —</option>
								{orders.map((o) => (
									<option key={o.id} value={o.id}>
										طلب #{o.id} — {o.status} — {o.total.toLocaleString("ar-EG")}{" "}
										ج.م
									</option>
								))}
							</select>
							<ChevronDown
								size={14}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
							/>
						</div>
					</div>
				)}

				{/* Product name */}
				<div>
					<label className="block font-cairo text-xs font-semibold text-muted mb-1.5">
						اسم المنتج
					</label>
					<input
						type="text"
						value={productName}
						onChange={(e) => setProductName(e.target.value)}
						required
						placeholder="مثال: خلاط هفار 600 وات"
						className="hvar-input w-full px-4 py-3 rounded-xl font-cairo text-sm"
					/>
				</div>

				{/* Description */}
				<div>
					<label className="block font-cairo text-xs font-semibold text-muted mb-1.5">
						وصف المشكلة
					</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						required
						rows={4}
						placeholder="اشرح المشكلة بالتفصيل..."
						className="hvar-input w-full px-4 py-3 rounded-xl font-cairo text-sm resize-none"
					/>
				</div>
			</section>

			{/* Submit */}
			<button
				type="submit"
				disabled={loading}
				className="w-full py-4 rounded-xl bg-brand hover:bg-[var(--c-brand-hover)] disabled:bg-stone-300 disabled:dark:bg-stone-700 text-white font-cairo font-bold text-base transition-all hover:shadow-[0_6px_20px_rgba(var(--c-brand-rgb),0.3)] flex items-center justify-center gap-2"
				style={{ transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
			>
				{loading ? (
					<>
						<Loader2 size={18} className="animate-spin" />
						جاري الإرسال...
					</>
				) : (
					"إرسال الطلب"
				)}
			</button>

			<div className="trust-line justify-center">
				<span>فريق الصيانة يتواصل معك خلال ٢٤ ساعة</span>
			</div>
		</form>
	);
}
