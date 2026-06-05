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
import { authUser, isLoggedIn, getAuthHeaders } from "../../lib/auth";

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

export default function CheckoutForm() {
	const loggedIn = useStore(isLoggedIn);
	const user = useStore(authUser);
	const items = useStore(cartItems);
	const total = useStore(cartTotal);
	const count = useStore(cartCount);

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

	useEffect(() => {
		if (!loggedIn) {
			window.location.href = "/login?redirect=/checkout";
			return;
		}
		if (items.length === 0 && !success) {
			window.location.href = "/cart";
			return;
		}
		if (user?.phone) setShippingPhone(user.phone);
	}, [loggedIn, items.length]);

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
				<h2 className="font-cairo font-black text-xl text-[#1c1917] dark:text-[#f5f5f4]">
					تم تأكيد طلبك
				</h2>
				<p className="font-cairo text-sm text-[#57534e] dark:text-[#a8a29e]">
					رقم الطلب:{" "}
					<span className="font-mono font-bold text-[#d43533]">
						#{success.orderId}
					</span>
				</p>
				<p className="font-cairo text-sm text-[#57534e] dark:text-[#a8a29e]">
					الإجمالي:{" "}
					<span className="font-inter font-bold">
						{success.total.toLocaleString("ar-EG")} ج.م
					</span>
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
					<a
						href={`/orders/${success.orderId}`}
						className="px-6 py-3 rounded-xl bg-[#d43533] hover:bg-[#b91c1c] text-white font-cairo font-bold text-sm transition-all"
					>
						تتبع الطلب
					</a>
					<a
						href="/products"
						className="px-6 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] text-[#1c1917] dark:text-[#f5f5f4] font-cairo font-semibold text-sm hover:border-[#d43533] transition-all"
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

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{error && (
				<div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm font-cairo">
					{error}
				</div>
			)}

			{/* Address section */}
			<section className="rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e7e0d6] dark:border-[#2c2825] p-5 space-y-4">
				<div className="flex items-center justify-between mb-1">
					<div className="flex items-center gap-2">
						<MapPin size={16} className="text-[#d43533]" />
						<h2 className="font-cairo font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4]">
							عنوان التوصيل
						</h2>
					</div>
					<button
						type="button"
						onClick={handleGeoLocate}
						disabled={geoLoading}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-cairo font-semibold border border-[#e7e0d6] dark:border-[#2c2825] text-[#57534e] dark:text-[#a8a29e] hover:border-[#d43533] hover:text-[#d43533] transition-all disabled:opacity-50"
					>
						{geoLoading ? (
							<Loader2 size={12} className="animate-spin" />
						) : (
							<LocateFixed size={12} />
						)}
						تحديد موقعي
					</button>
				</div>

				{geoHit && (
					<div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30">
						<MapPin size={13} className="text-green-600 shrink-0" />
						<span className="font-cairo text-xs text-green-700 dark:text-green-400 truncate">
							{geoHit}
						</span>
						<button
							type="button"
							onClick={() => setGeoHit(null)}
							className="mr-auto text-green-600 hover:text-green-800 text-xs font-cairo"
						>
							×
						</button>
					</div>
				)}

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{/* Governorate */}
					<div className="relative">
						<label className="block font-cairo text-xs font-semibold text-[#57534e] dark:text-[#a8a29e] mb-1.5">
							المحافظة
						</label>
						<div className="relative">
							<select
								value={govId ?? ""}
								onChange={(e) => setGovId(Number(e.target.value) || null)}
								required
								className="w-full px-4 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] bg-[#fbf7f1] dark:bg-[#12110f] text-[#1c1917] dark:text-[#f5f5f4] font-cairo text-sm appearance-none focus:outline-none focus:border-[#d43533] focus:ring-1 focus:ring-[#d43533]/30 transition-colors"
							>
								<option value="">اختر المحافظة</option>
								{govs.map((g) => (
									<option key={g.id} value={g.id}>
										{g.nameAr}
									</option>
								))}
							</select>
							<ChevronDown
								size={14}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
							/>
						</div>
					</div>

					{/* District */}
					<div className="relative">
						<label className="block font-cairo text-xs font-semibold text-[#57534e] dark:text-[#a8a29e] mb-1.5">
							المنطقة
						</label>
						<div className="relative">
							<select
								value={distId ?? ""}
								onChange={(e) => setDistId(Number(e.target.value) || null)}
								required
								disabled={!govId}
								className="w-full px-4 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] bg-[#fbf7f1] dark:bg-[#12110f] text-[#1c1917] dark:text-[#f5f5f4] font-cairo text-sm appearance-none focus:outline-none focus:border-[#d43533] focus:ring-1 focus:ring-[#d43533]/30 transition-colors disabled:opacity-50"
							>
								<option value="">اختر المنطقة</option>
								{dists.map((d) => (
									<option key={d.id} value={d.id}>
										{d.nameAr}
									</option>
								))}
							</select>
							<ChevronDown
								size={14}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
							/>
						</div>
					</div>
				</div>

				<div>
					<label className="block font-cairo text-xs font-semibold text-[#57534e] dark:text-[#a8a29e] mb-1.5">
						الشارع
					</label>
					<input
						type="text"
						value={street}
						onChange={(e) => setStreet(e.target.value)}
						required
						placeholder="اسم الشارع"
						className="w-full px-4 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] bg-[#fbf7f1] dark:bg-[#12110f] text-[#1c1917] dark:text-[#f5f5f4] font-cairo text-sm focus:outline-none focus:border-[#d43533] focus:ring-1 focus:ring-[#d43533]/30 transition-colors"
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block font-cairo text-xs font-semibold text-[#57534e] dark:text-[#a8a29e] mb-1.5">
							المبنى / العمارة
						</label>
						<input
							type="text"
							value={building}
							onChange={(e) => setBuilding(e.target.value)}
							required
							placeholder="رقم / اسم المبنى"
							className="w-full px-4 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] bg-[#fbf7f1] dark:bg-[#12110f] text-[#1c1917] dark:text-[#f5f5f4] font-cairo text-sm focus:outline-none focus:border-[#d43533] focus:ring-1 focus:ring-[#d43533]/30 transition-colors"
						/>
					</div>
					<div>
						<label className="block font-cairo text-xs font-semibold text-[#57534e] dark:text-[#a8a29e] mb-1.5">
							الشقة (اختياري)
						</label>
						<input
							type="text"
							value={apartment}
							onChange={(e) => setApartment(e.target.value)}
							placeholder="رقم الشقة"
							className="w-full px-4 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] bg-[#fbf7f1] dark:bg-[#12110f] text-[#1c1917] dark:text-[#f5f5f4] font-cairo text-sm focus:outline-none focus:border-[#d43533] focus:ring-1 focus:ring-[#d43533]/30 transition-colors"
						/>
					</div>
				</div>

				<div>
					<label className="block font-cairo text-xs font-semibold text-[#57534e] dark:text-[#a8a29e] mb-1.5">
						رقم موبايل الشحن
					</label>
					<input
						type="tel"
						dir="ltr"
						value={shippingPhone}
						onChange={(e) => setShippingPhone(e.target.value)}
						required
						placeholder="01xxxxxxxxx"
						className="w-full px-4 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] bg-[#fbf7f1] dark:bg-[#12110f] text-[#1c1917] dark:text-[#f5f5f4] font-inter text-sm text-left focus:outline-none focus:border-[#d43533] focus:ring-1 focus:ring-[#d43533]/30 transition-colors"
					/>
				</div>

				<div>
					<label className="block font-cairo text-xs font-semibold text-[#57534e] dark:text-[#a8a29e] mb-1.5">
						ملاحظات (اختياري)
					</label>
					<textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={2}
						placeholder="ملاحظات للتوصيل..."
						className="w-full px-4 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] bg-[#fbf7f1] dark:bg-[#12110f] text-[#1c1917] dark:text-[#f5f5f4] font-cairo text-sm focus:outline-none focus:border-[#d43533] focus:ring-1 focus:ring-[#d43533]/30 transition-colors resize-none"
					/>
				</div>
			</section>

			{/* Payment method */}
			<section className="rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e7e0d6] dark:border-[#2c2825] p-5 space-y-3">
				<div className="flex items-center gap-2 mb-1">
					<CreditCard size={16} className="text-[#d43533]" />
					<h2 className="font-cairo font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4]">
						طريقة الدفع
					</h2>
				</div>

				{(
					[
						{
							value: "cod" as const,
							icon: Banknote,
							label: "الدفع عند الاستلام",
							desc: "كاش أو فيزا عند التسليم",
						},
						{
							value: "kashier_card" as const,
							icon: CreditCard,
							label: "بطاقة ائتمان",
							desc: "فيزا / ماستركارد / ميزة",
						},
					] as const
				).map((m) => (
					<label
						key={m.value}
						className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
							payment === m.value
								? "border-[#d43533] bg-red-50/50 dark:bg-red-950/10"
								: "border-[#e7e0d6] dark:border-[#2c2825] hover:border-stone-300 dark:hover:border-stone-600"
						}`}
					>
						<input
							type="radio"
							name="payment"
							value={m.value}
							checked={payment === m.value}
							onChange={() => setPayment(m.value)}
							className="sr-only"
						/>
						<div
							className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
								payment === m.value
									? "border-[#d43533]"
									: "border-stone-300 dark:border-stone-600"
							}`}
						>
							{payment === m.value && (
								<div className="w-2.5 h-2.5 rounded-full bg-[#d43533]" />
							)}
						</div>
						<m.icon
							size={18}
							className={
								payment === m.value ? "text-[#d43533]" : "text-stone-400"
							}
						/>
						<div>
							<p className="font-cairo font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4]">
								{m.label}
							</p>
							<p className="font-cairo text-xs text-[#57534e] dark:text-[#a8a29e]">
								{m.desc}
							</p>
						</div>
					</label>
				))}
			</section>

			{/* Order summary */}
			<section className="rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e7e0d6] dark:border-[#2c2825] p-5 space-y-4">
				<h2 className="font-cairo font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4]">
					ملخص الطلب
				</h2>

				<div className="space-y-2">
					{items.map((item) => (
						<div
							key={item.variationId}
							className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800 last:border-0"
						>
							<div className="flex-1 min-w-0">
								<p className="font-cairo text-sm text-[#1c1917] dark:text-[#f5f5f4] truncate">
									{item.name}
								</p>
								<p className="font-cairo text-xs text-[#a8a29e]">
									{item.quantity} x {item.price.toLocaleString("ar-EG")} ج.م
								</p>
							</div>
							<p className="font-inter font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4] mr-4">
								{(item.price * item.quantity).toLocaleString("ar-EG")} ج.م
							</p>
						</div>
					))}
				</div>

				<div className="border-t border-[#e7e0d6] dark:border-[#2c2825] pt-3 space-y-2">
					<div className="flex justify-between">
						<span className="font-cairo text-sm text-[#57534e] dark:text-[#a8a29e]">
							المنتجات ({count})
						</span>
						<span className="font-inter font-bold text-sm">
							{total.toLocaleString("ar-EG")} ج.م
						</span>
					</div>
					<div className="flex justify-between">
						<span className="font-cairo text-sm text-[#57534e] dark:text-[#a8a29e]">
							الشحن
						</span>
						<span className="font-cairo text-sm text-green-600 font-semibold">
							مجاني
						</span>
					</div>
					<div className="flex justify-between pt-2 border-t border-[#e7e0d6] dark:border-[#2c2825]">
						<span className="font-cairo font-bold text-[#1c1917] dark:text-[#f5f5f4]">
							الإجمالي
						</span>
						<span className="font-inter font-black text-lg text-[#d43533]">
							{total.toLocaleString("ar-EG")} ج.م
						</span>
					</div>
				</div>
			</section>

			{/* Submit */}
			<button
				type="submit"
				disabled={loading}
				className="w-full py-4 rounded-xl bg-[#d43533] hover:bg-[#b91c1c] disabled:bg-stone-300 disabled:dark:bg-stone-700 text-white font-cairo font-bold text-base transition-all hover:shadow-[0_6px_20px_rgba(212,53,51,0.3)] flex items-center justify-center gap-2"
				style={{ transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
			>
				{loading ? (
					<>
						<Loader2 size={18} className="animate-spin" />
						جاري التأكيد...
					</>
				) : payment === "cod" ? (
					"تأكيد الطلب — الدفع عند الاستلام"
				) : (
					"الدفع الآن"
				)}
			</button>

			<div className="trust-line justify-center">
				<span>ضمان سنتين</span>
				<span>شحن مجاني</span>
				<span>افحص قبل الدفع</span>
			</div>
		</form>
	);
}
