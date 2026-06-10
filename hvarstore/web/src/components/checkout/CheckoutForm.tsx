import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import {
	MapPin,
	CreditCard,
	Banknote,
	Loader2,
	ChevronDown,
	CheckCircle2,
	LocateFixed,
} from "lucide-react";
import { cartItems, cartTotal, cartCount } from "../../stores/cart";
import {
	authUser,
	isLoggedIn,
	getAuthHeaders,
	login,
	register,
	logout,
} from "../../lib/auth";

interface Gov {
	id: number;
	nameAr: string;
}
interface Dist {
	id: number;
	nameAr: string;
}

type PaymentMethod = "cod" | "kashier_card" | "kashier_installments";

const API = import.meta.env?.PUBLIC_API_URL ?? "http://localhost:5000";
const GEO_KEY = "0ae3efb1-9685-4530-86e2-606dccecec50";

function matchAr(a: string, b: string): boolean {
	return a.includes(b) || b.includes(a);
}

/** Normalize any Egyptian mobile input to 01XXXXXXXXX, or null if invalid. */
function normalizeEgyptPhone(raw: string): string | null {
	let digits = raw.replace(/\D/g, "");
	if (digits.startsWith("20")) digits = digits.slice(2);
	if (digits.length === 10 && digits.startsWith("1")) digits = "0" + digits;
	return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}

export default function CheckoutForm() {
	const loggedIn = useStore(isLoggedIn);
	const user = useStore(authUser);
	const items = useStore(cartItems);
	const total = useStore(cartTotal);
	const count = useStore(cartCount);

	const [step, setStep] = useState<1 | 2 | 3>(1);

	const [govs, setGovs] = useState<Gov[]>([]);
	const [dists, setDists] = useState<Dist[]>([]);
	const [govId, setGovId] = useState<number | null>(null);
	const [distId, setDistId] = useState<number | null>(null);
	const [street, setStreet] = useState("");
	const [building, setBuilding] = useState("");
	const [apartment, setApartment] = useState("");
	const [shippingPhone, setShippingPhone] = useState("");
	const [notes, setNotes] = useState("");
	const [payment, setPayment] = useState<PaymentMethod>("cod");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<{
		orderId: number;
		total: number;
	} | null>(null);

	const [geoLoading, setGeoLoading] = useState(false);
	const [geoHit, setGeoHit] = useState<string | null>(null);
	const [pendingDistName, setPendingDistName] = useState<string | null>(null);

	// Inline contact/auth (phone-first — no redirect away from checkout)
	const [authMode, setAuthMode] = useState<"new" | "existing">("new");
	const [authName, setAuthName] = useState("");
	const [authPassword, setAuthPassword] = useState("");

	useEffect(() => {
		if (items.length === 0 && !success) {
			window.location.href = "/cart";
			return;
		}
		if (user?.phone) setShippingPhone(user.phone);
	}, [items.length, user?.phone]);

	useEffect(() => {
		fetch(`${API}/api/locations/governorates`)
			.then((r) => r.json())
			.then((d) => setGovs(d.items))
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (!govId) {
			setDists([]);
			setDistId(null);
			return;
		}
		setDistId(null);
		fetch(`${API}/api/locations/districts/${govId}`)
			.then((r) => r.json())
			.then((d) => setDists(d.items))
			.catch(() => {});
	}, [govId]);

	// Auto-select district once districts load after GeoLink sets the governorate
	useEffect(() => {
		if (!pendingDistName || dists.length === 0) return;
		const match = dists.find((d) => matchAr(d.nameAr, pendingDistName));
		if (match) setDistId(match.id);
		setPendingDistName(null);
	}, [dists, pendingDistName]);

	async function handleGeoLocate() {
		if (!navigator.geolocation) return;
		setGeoLoading(true);
		setGeoHit(null);
		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				try {
					const { latitude: lat, longitude: lng } = pos.coords;
					const res = await fetch(
						`https://geolink-eg.com/api/v2/reverse_geocode?latitude=${lat}&longitude=${lng}&language=ar&country=eg&key=${GEO_KEY}`,
					);
					const json = await res.json();
					if (!json.success) throw new Error(json.error ?? "GeoLink denied");

					const govName: string = json.data.address_parts?.governorate ?? "";
					const distName: string = json.data.address_parts?.district ?? "";
					const shortAddr: string =
						json.data.short_address ?? json.data.address ?? "";

					const matchedGov = govs.find((g) => matchAr(g.nameAr, govName));
					if (matchedGov) {
						setGovId(matchedGov.id);
						if (distName) setPendingDistName(distName);
						setGeoHit(shortAddr || govName);
					} else {
						setGeoHit(null);
					}
				} catch {
					// silent — user can fill manually
				} finally {
					setGeoLoading(false);
				}
			},
			() => setGeoLoading(false),
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
		);
	}

	if (success) {
		return (
			<div className="text-center py-16 space-y-4">
				<div className="w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/20 text-green-600">
					<CheckCircle2 size={32} />
				</div>
				<h2 className="font-cairo font-black text-xl text-ink">
					تم تأكيد طلبك
				</h2>
				<p className="font-cairo text-sm text-muted">
					رقم الطلب:{" "}
					<span className="font-mono font-bold text-brand">
						#{success.orderId}
					</span>
				</p>
				<p className="font-cairo text-sm text-muted">
					الإجمالي:{" "}
					<span className="font-inter font-bold">
						{success.total.toLocaleString("ar-EG")} ج.م
					</span>
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
					<a
						href={`/orders/${success.orderId}`}
						className="px-6 py-3 rounded-xl bg-brand hover:bg-[var(--c-brand-hover)] text-white font-cairo font-bold text-sm transition-all"
					>
						تتبع الطلب
					</a>
					<a
						href="/products"
						className="px-6 py-3 rounded-xl border border-hvar text-ink font-cairo font-semibold text-sm hover:border-[var(--c-brand)] transition-all"
					>
						متابعة التسوق
					</a>
				</div>
			</div>
		);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (!govId || !distId) {
			setError("اختر المحافظة والمنطقة");
			return;
		}
		if (!street.trim() || !building.trim()) {
			setError("أكمل بيانات العنوان");
			return;
		}

		setLoading(true);
		try {
			const orderPayload = {
				items: items.map((i) => ({
					productId: i.productId,
					variationId: i.variationId,
					name: i.name,
					quantity: i.quantity,
				})),
				paymentMethod: payment,
				governorateId: govId,
				districtId: distId,
				street,
				building,
				apartment: apartment || undefined,
				shippingPhone,
				notes: notes || undefined,
			};

			const res = await fetch(`${API}/api/orders`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...getAuthHeaders(),
				},
				body: JSON.stringify(orderPayload),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error ?? data.message ?? "فشل في إنشاء الطلب");
			}

			if (payment !== "cod") {
				const payRes = await fetch(`${API}/api/payments/kashier/initiate`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...getAuthHeaders(),
					},
					body: JSON.stringify({
						orderId: data.orderId,
						paymentMethod: payment,
					}),
				});
				const payData = await payRes.json();
				if (!payRes.ok) {
					throw new Error(payData.error ?? "فشل في بدء الدفع");
				}
				const { cartItems: ci } = await import("../../stores/cart");
				ci.set([]);
				window.location.href = payData.redirectUrl;
				return;
			}

			const { cartItems: ci } = await import("../../stores/cart");
			ci.set([]);
			setSuccess({ orderId: data.orderId, total: data.total });
		} catch (err) {
			setError(err instanceof Error ? err.message : "حدث خطأ");
		} finally {
			setLoading(false);
		}
	}

	const govName = govs.find((g) => g.id === govId)?.nameAr ?? "";
	const distName = dists.find((d) => d.id === distId)?.nameAr ?? "";

	const STEPS = [
		{ n: 1, label: "بياناتك وعنوانك", icon: MapPin },
		{ n: 2, label: "الدفع", icon: CreditCard },
		{ n: 3, label: "المراجعة", icon: CheckCircle2 },
	] as const;

	function StepIndicator() {
		return (
			<div className="flex items-center justify-center gap-0 mb-8">
				{STEPS.map((s, idx) => (
					<>
						<div key={s.n} className="flex flex-col items-center gap-1">
							<div
								className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 font-inter font-bold text-sm"
								style={
									step > s.n
										? { background: "var(--c-brand)", color: "#fff" }
										: step === s.n
										? { background: "var(--c-brand)", color: "#fff", boxShadow: "0 0 0 4px color-mix(in srgb, var(--c-brand) 18%, transparent)" }
										: { background: "var(--c-surface-2)", color: "var(--c-ink-faint)", border: "2px solid var(--c-hairline)" }
								}
							>
								{step > s.n ? (
									<CheckCircle2 size={16} />
								) : (
									s.n
								)}
							</div>
							<span
								className="font-cairo text-[10px] font-semibold"
								style={{ color: step === s.n ? "var(--c-brand)" : "var(--c-ink-faint)" }}
							>
								{s.label}
							</span>
						</div>
						{idx < STEPS.length - 1 && (
							<div
								className="h-[2px] w-12 mb-4 mx-1 transition-all duration-500"
								style={{ background: step > s.n ? "var(--c-brand)" : "var(--c-hairline)" }}
							/>
						)}
					</>
				))}
			</div>
		);
	}

	function validateStep1() {
		if (!normalizeEgyptPhone(shippingPhone)) {
			setError("رقم الموبايل المصري لازم يبدأ بـ 01 و يكون ١١ رقم.");
			return false;
		}
		if (!loggedIn) {
			if (authMode === "new" && !authName.trim()) { setError("اكتب اسمك"); return false; }
			if (authPassword.length < 6) { setError("كلمة السر لازم تكون ٦ حروف على الأقل"); return false; }
		}
		if (!govId || !distId) { setError("اختر المحافظة والمنطقة"); return false; }
		if (!street.trim() || !building.trim()) { setError("أكمل بيانات العنوان"); return false; }
		return true;
	}

	// Step 1 → Step 2: authenticate inline when needed, never leave /checkout
	async function handleStep1Next() {
		setError(null);
		if (!validateStep1()) return;
		const phone = normalizeEgyptPhone(shippingPhone)!;
		setShippingPhone(phone);

		if (!loggedIn) {
			setLoading(true);
			try {
				if (authMode === "new") {
					await register(phone, authName.trim(), authPassword);
				} else {
					await login(phone, authPassword);
				}
			} catch (err) {
				const msg = err instanceof Error ? err.message : "حدث خطأ";
				// Account already exists → nudge to password mode instead of failing
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
		setStep(2);
	}

	return (
		<div>
			<StepIndicator />

			{error && (
				<div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm font-cairo">
					{error}
				</div>
			)}

			{/* ── Step 1: Contact (phone-first) + Address ── */}
			{step === 1 && (
				<div className="space-y-4">
					{/* Contact — phone is identity. Inline auth, never a redirect. */}
					<section className="rounded-2xl bg-surface border border-hvar p-5 space-y-4">
						<div className="flex items-center gap-2 mb-1">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
								<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2-.5c.9.3 1.9.6 2.9.7A2 2 0 0 1 22 16.9Z"/>
							</svg>
							<h2 className="font-cairo font-bold text-sm text-ink">بياناتك</h2>
						</div>

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
									onClick={() => { logout(); setShippingPhone(""); }}
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
										value={shippingPhone}
										onChange={(e) => setShippingPhone(e.target.value)}
										placeholder="01xxxxxxxxx"
										autoComplete="tel"
										className="hvar-input w-full px-4 py-3 rounded-xl font-inter text-sm text-left transition-colors"
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
											className="hvar-input w-full px-4 py-3 rounded-xl font-cairo text-sm transition-colors"
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
										className="hvar-input w-full px-4 py-3 rounded-xl font-cairo text-sm transition-colors"
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

					<section className="rounded-2xl bg-surface border border-hvar p-5 space-y-4">
						<div className="flex items-center justify-between mb-1">
							<div className="flex items-center gap-2">
								<MapPin size={16} className="text-brand" />
								<h2 className="font-cairo font-bold text-sm text-ink">عنوان التوصيل</h2>
							</div>
							<button
								type="button"
								onClick={handleGeoLocate}
								disabled={geoLoading}
								className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-cairo font-semibold border border-hvar text-muted hover:border-[var(--c-brand)] hover:text-[var(--c-brand)] transition-all disabled:opacity-50"
							>
								{geoLoading ? <Loader2 size={12} className="animate-spin" /> : <LocateFixed size={12} />}
								تحديد موقعي
							</button>
						</div>

						{geoHit && (
							<div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30">
								<MapPin size={13} className="text-green-600 shrink-0" />
								<span className="font-cairo text-xs text-green-700 dark:text-green-400 truncate">{geoHit}</span>
								<button type="button" onClick={() => setGeoHit(null)} className="mr-auto text-green-600 hover:text-green-800 text-xs">×</button>
							</div>
						)}

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="relative">
								<label className="block font-cairo text-xs font-semibold text-muted mb-1.5">المحافظة</label>
								<div className="relative">
									<select
										value={govId ?? ""}
										onChange={(e) => setGovId(Number(e.target.value) || null)}
										className="hvar-input hvar-select w-full px-4 py-3 rounded-xl font-cairo text-sm appearance-none transition-colors"
									>
										<option value="">اختر المحافظة</option>
										{govs.map((g) => <option key={g.id} value={g.id}>{g.nameAr}</option>)}
									</select>
									<ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
								</div>
							</div>
							<div className="relative">
								<label className="block font-cairo text-xs font-semibold text-muted mb-1.5">المنطقة</label>
								<div className="relative">
									<select
										value={distId ?? ""}
										onChange={(e) => setDistId(Number(e.target.value) || null)}
										disabled={!govId}
										className="hvar-input hvar-select w-full px-4 py-3 rounded-xl font-cairo text-sm appearance-none transition-colors disabled:opacity-50"
									>
										<option value="">اختر المنطقة</option>
										{dists.map((d) => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
									</select>
									<ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
								</div>
							</div>
						</div>

						<div>
							<label className="block font-cairo text-xs font-semibold text-muted mb-1.5">الشارع</label>
							<input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="اسم الشارع" className="hvar-input w-full px-4 py-3 rounded-xl font-cairo text-sm transition-colors" />
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block font-cairo text-xs font-semibold text-muted mb-1.5">المبنى / العمارة</label>
								<input type="text" value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="رقم / اسم المبنى" className="hvar-input w-full px-4 py-3 rounded-xl font-cairo text-sm transition-colors" />
							</div>
							<div>
								<label className="block font-cairo text-xs font-semibold text-muted mb-1.5">الشقة (اختياري)</label>
								<input type="text" value={apartment} onChange={(e) => setApartment(e.target.value)} placeholder="رقم الشقة" className="hvar-input w-full px-4 py-3 rounded-xl font-cairo text-sm transition-colors" />
							</div>
						</div>

						<div>
							<label className="block font-cairo text-xs font-semibold text-muted mb-1.5">ملاحظات (اختياري)</label>
							<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="ملاحظات للتوصيل..." className="hvar-input w-full px-4 py-3 rounded-xl font-cairo text-sm transition-colors resize-none" />
						</div>
					</section>

					<button
						type="button"
						onClick={handleStep1Next}
						disabled={loading}
						className="w-full py-4 rounded-xl bg-brand hover:bg-[var(--c-brand-hover)] disabled:opacity-60 text-white font-cairo font-bold text-base flex items-center justify-center gap-2"
						style={{ transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
					>
						{loading ? (
							<><Loader2 size={18} className="animate-spin" />ثواني...</>
						) : (
							<>
								التالي — طريقة الدفع
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
							</>
						)}
					</button>
				</div>
			)}

			{/* ── Step 2: Payment ── */}
			{step === 2 && (
				<div className="space-y-4">
					<section className="rounded-2xl bg-surface border border-hvar p-5 space-y-3">
						<div className="flex items-center gap-2 mb-1">
							<CreditCard size={16} className="text-brand" />
							<h2 className="font-cairo font-bold text-sm text-ink">طريقة الدفع</h2>
						</div>

						{([
							{ value: "cod" as const, icon: Banknote, label: "الدفع عند الاستلام", desc: "كاش أو فيزا عند التسليم" },
							{ value: "kashier_card" as const, icon: CreditCard, label: "بطاقة ائتمان", desc: "فيزا / ماستركارد / ميزة" },
						] as const).map((m) => (
							<label
								key={m.value}
								className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all"
								style={{
									borderColor: payment === m.value ? "var(--c-brand)" : "var(--c-border)",
									background: payment === m.value ? "color-mix(in srgb, var(--c-brand) 6%, transparent)" : undefined,
								}}
							>
								<input type="radio" name="payment" value={m.value} checked={payment === m.value} onChange={() => setPayment(m.value)} className="sr-only" />
								<div
									className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0"
									style={{ borderColor: payment === m.value ? "var(--c-brand)" : "var(--c-hairline)" }}
								>
									{payment === m.value && <div className="w-2.5 h-2.5 rounded-full bg-brand" />}
								</div>
								<m.icon size={18} style={{ color: payment === m.value ? "var(--c-brand)" : "var(--c-ink-faint)" }} />
								<div>
									<p className="font-cairo font-bold text-sm text-ink">{m.label}</p>
									<p className="font-cairo text-xs text-muted">{m.desc}</p>
								</div>
							</label>
						))}
					</section>

					<div className="flex gap-3">
						<button
							type="button"
							onClick={() => { setError(null); setStep(1); }}
							className="flex-1 py-4 rounded-xl border border-hvar text-ink font-cairo font-semibold text-sm hover:border-[var(--c-brand)] transition-all"
						>
							رجوع
						</button>
						<button
							type="button"
							onClick={() => { setError(null); setStep(3); }}
							className="flex-[2] py-4 rounded-xl bg-brand hover:bg-[var(--c-brand-hover)] text-white font-cairo font-bold text-base flex items-center justify-center gap-2"
							style={{ transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
						>
							التالي — مراجعة الطلب
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
						</button>
					</div>
				</div>
			)}

			{/* ── Step 3: Review & Confirm ── */}
			{step === 3 && (
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Address summary */}
					<section className="rounded-2xl bg-surface border border-hvar p-5">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<MapPin size={14} className="text-brand" />
								<h3 className="font-cairo font-bold text-sm text-ink">عنوان التوصيل</h3>
							</div>
							<button type="button" onClick={() => setStep(1)} className="font-cairo text-xs text-brand hover:underline">تعديل</button>
						</div>
						<p className="font-cairo text-sm text-ink">{govName} — {distName}</p>
						<p className="font-cairo text-sm text-muted">{street}، {building}{apartment ? `، شقة ${apartment}` : ""}</p>
						<p className="font-inter text-sm text-muted mt-1" dir="ltr">{shippingPhone}</p>
						{notes && <p className="font-cairo text-xs text-faint mt-1">{notes}</p>}
					</section>

					{/* Payment summary */}
					<section className="rounded-2xl bg-surface border border-hvar p-5">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<CreditCard size={14} className="text-brand" />
								<h3 className="font-cairo font-bold text-sm text-ink">طريقة الدفع</h3>
							</div>
							<button type="button" onClick={() => setStep(2)} className="font-cairo text-xs text-brand hover:underline">تعديل</button>
						</div>
						<p className="font-cairo text-sm text-ink">
							{payment === "cod" ? "الدفع عند الاستلام" : "بطاقة ائتمان (Kashier)"}
						</p>
					</section>

					{/* Order items */}
					<section className="rounded-2xl bg-surface border border-hvar p-5 space-y-4">
						<h3 className="font-cairo font-bold text-sm text-ink">ملخص الطلب</h3>
						<div className="space-y-2">
							{items.map((item) => (
								<div key={item.variationId} className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800 last:border-0">
									<div className="flex-1 min-w-0">
										<p className="font-cairo text-sm text-ink truncate">{item.name}</p>
										<p className="font-cairo text-xs text-faint">{item.quantity} × {item.price.toLocaleString("ar-EG")} ج.م</p>
									</div>
									<p className="font-inter font-bold text-sm text-ink mr-4">{(item.price * item.quantity).toLocaleString("ar-EG")} ج.م</p>
								</div>
							))}
						</div>
						<div className="border-t border-hvar pt-3 space-y-2">
							<div className="flex justify-between">
								<span className="font-cairo text-sm text-muted">المنتجات ({count})</span>
								<span className="font-inter font-bold text-sm">{total.toLocaleString("ar-EG")} ج.م</span>
							</div>
							<div className="flex justify-between">
								<span className="font-cairo text-sm text-muted">الشحن</span>
								<span className="font-cairo text-sm text-green-600 font-semibold">مجاني</span>
							</div>
							<div className="flex justify-between pt-2 border-t border-hvar">
								<span className="font-cairo font-bold text-ink">الإجمالي</span>
								<span className="font-inter font-black text-lg text-brand">{total.toLocaleString("ar-EG")} ج.م</span>
							</div>
						</div>
					</section>

					<div className="flex gap-3">
						<button
							type="button"
							onClick={() => { setError(null); setStep(2); }}
							className="flex-1 py-4 rounded-xl border border-hvar text-ink font-cairo font-semibold text-sm hover:border-[var(--c-brand)] transition-all"
						>
							رجوع
						</button>
						<button
							type="submit"
							disabled={loading}
							className="flex-[2] py-4 rounded-xl bg-brand hover:bg-[var(--c-brand-hover)] disabled:opacity-60 text-white font-cairo font-bold text-base flex items-center justify-center gap-2"
							style={{ transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
						>
							{loading ? (
								<><Loader2 size={18} className="animate-spin" />جاري التأكيد...</>
							) : payment === "cod" ? (
								"تأكيد الطلب"
							) : (
								"الدفع الآن"
							)}
						</button>
					</div>

					<div className="trust-line justify-center">
						<span>ضمان سنتين</span>
						<span>شحن مجاني</span>
						<span>افحص قبل الدفع</span>
					</div>
				</form>
			)}
		</div>
	);
}
