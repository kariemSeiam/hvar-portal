import { useEffect, useState } from "react";
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
import { isLoggedIn, getAuthHeaders } from "../../lib/auth";

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

	useEffect(() => {
		if (!loggedIn) {
			window.location.href = "/login?redirect=/service/new";
			return;
		}
		fetch(`${API}/api/orders`, {
			headers: { ...getAuthHeaders() },
		})
			.then((r) => r.json())
			.then((d) => setOrders(d.items ?? []))
			.catch(() => {});
	}, [loggedIn]);

	if (success) {
		return (
			<div className="text-center py-16 space-y-4">
				<div className="w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/20 text-green-600">
					<CheckCircle2 size={32} />
				</div>
				<h2 className="font-cairo font-black text-xl text-[#1c1917] dark:text-[#f5f5f4]">
					تم إرسال الطلب
				</h2>
				<p className="font-cairo text-sm text-[#57534e] dark:text-[#a8a29e]">
					رقم التذكرة:{" "}
					<span className="font-mono font-bold text-[#d43533]">
						{success.ticketCode}
					</span>
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
					<a
						href={`/service/${success.id}`}
						className="px-6 py-3 rounded-xl bg-[#d43533] hover:bg-[#b91c1c] text-white font-cairo font-bold text-sm transition-all"
					>
						تتبع الطلب
					</a>
					<a
						href="/service"
						className="px-6 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] text-[#1c1917] dark:text-[#f5f5f4] font-cairo font-semibold text-sm hover:border-[#d43533] transition-all"
					>
						كل الطلبات
					</a>
				</div>
			</div>
		);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
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

			{/* Type selector */}
			<section className="rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e7e0d6] dark:border-[#2c2825] p-5 space-y-3">
				<div className="flex items-center gap-2 mb-1">
					<Ticket size={16} className="text-[#d43533]" />
					<h2 className="font-cairo font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4]">
						نوع الطلب
					</h2>
				</div>

				{TICKET_TYPES.map((t) => (
					<label
						key={t.value}
						style={{ transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
						className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${
							type === t.value
								? "border-[#d43533] bg-red-50/50 dark:bg-red-950/10"
								: "border-[#e7e0d6] dark:border-[#2c2825] hover:border-stone-300 dark:hover:border-stone-600"
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
									? "border-[#d43533]"
									: "border-stone-300 dark:border-stone-600"
							}`}
						>
							{type === t.value && (
								<div className="w-2.5 h-2.5 rounded-full bg-[#d43533]" />
							)}
						</div>
						<div
							className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
								type === t.value
									? "bg-red-100 dark:bg-red-950/30 text-[#d43533]"
									: "bg-stone-100 dark:bg-stone-800 text-stone-400"
							}`}
						>
							<t.icon size={16} />
						</div>
						<div className="flex-1">
							<p className="font-cairo font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4]">
								{t.label}
							</p>
							<p className="font-cairo text-xs text-[#57534e] dark:text-[#a8a29e]">
								{t.desc}
							</p>
						</div>
					</label>
				))}
			</section>

			{/* Details */}
			<section className="rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e7e0d6] dark:border-[#2c2825] p-5 space-y-4">
				{/* Linked order */}
				{orders.length > 0 && (
					<div>
						<label className="block font-cairo text-xs font-semibold text-[#57534e] dark:text-[#a8a29e] mb-1.5">
							ربط بطلب (اختياري)
						</label>
						<div className="relative">
							<select
								value={transactionId ?? ""}
								onChange={(e) =>
									setTransactionId(Number(e.target.value) || null)
								}
								className="w-full px-4 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] bg-[#fbf7f1] dark:bg-[#12110f] text-[#1c1917] dark:text-[#f5f5f4] font-cairo text-sm appearance-none focus:outline-none focus:border-[#d43533] focus:ring-1 focus:ring-[#d43533]/30 transition-colors"
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
					<label className="block font-cairo text-xs font-semibold text-[#57534e] dark:text-[#a8a29e] mb-1.5">
						اسم المنتج
					</label>
					<input
						type="text"
						value={productName}
						onChange={(e) => setProductName(e.target.value)}
						required
						placeholder="مثال: تلفزيون سامسونج 55 بوصة"
						className="w-full px-4 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] bg-[#fbf7f1] dark:bg-[#12110f] text-[#1c1917] dark:text-[#f5f5f4] font-cairo text-sm focus:outline-none focus:border-[#d43533] focus:ring-1 focus:ring-[#d43533]/30 transition-colors"
					/>
				</div>

				{/* Description */}
				<div>
					<label className="block font-cairo text-xs font-semibold text-[#57534e] dark:text-[#a8a29e] mb-1.5">
						وصف المشكلة
					</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						required
						rows={4}
						placeholder="اشرح المشكلة بالتفصيل..."
						className="w-full px-4 py-3 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] bg-[#fbf7f1] dark:bg-[#12110f] text-[#1c1917] dark:text-[#f5f5f4] font-cairo text-sm focus:outline-none focus:border-[#d43533] focus:ring-1 focus:ring-[#d43533]/30 transition-colors resize-none"
					/>
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
						جاري الإرسال...
					</>
				) : (
					"إرسال الطلب"
				)}
			</button>
		</form>
	);
}
