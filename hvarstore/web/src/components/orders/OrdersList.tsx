import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { Package, ChevronLeft, Loader2 } from "lucide-react";
import { isLoggedIn, getAuthHeaders } from "../../lib/auth";

interface OrderSummary {
	id: number;
	paymentMethod: string;
	status: string;
	total: number;
	billCode: string | null;
	cancelledAt: string | null;
	createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
	pending: "قيد المراجعة",
	confirmed: "تم التأكيد",
	processing: "قيد التجهيز",
	shipped: "تم الشحن",
	delivered: "تم التوصيل",
	cancelled: "ملغي",
	payment_failed: "فشل الدفع",
};

const STATUS_COLORS: Record<string, string> = {
	pending:
		"bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
	confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
	processing:
		"bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
	shipped:
		"bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
	delivered:
		"bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
	cancelled: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
	payment_failed:
		"bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

const API = import.meta.env?.PUBLIC_API_URL ?? "http://localhost:5000";

export default function OrdersList() {
	const loggedIn = useStore(isLoggedIn);
	const [orders, setOrders] = useState<OrderSummary[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!loggedIn) {
			window.location.href = "/login?redirect=/orders";
			return;
		}

		fetch(`${API}/api/orders`, { headers: getAuthHeaders() })
			.then((r) => r.json())
			.then((d) => setOrders(d.items ?? []))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [loggedIn]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 size={24} className="animate-spin text-brand" />
			</div>
		);
	}

	if (orders.length === 0) {
		return (
			<div className="relative flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden">
				<div
					className="absolute inset-0 pointer-events-none"
					aria-hidden="true"
					style={{ background: "radial-gradient(ellipse 55% 50% at 50% 40%, rgba(var(--c-brand-rgb),0.06) 0%, transparent 70%)" }}
				/>
				<Package
					className="relative select-none"
					strokeWidth={0.9}
					style={{ width: "clamp(96px,18vw,150px)", height: "auto", color: "var(--c-brand)", opacity: 0.14 }}
					aria-hidden="true"
				/>
				<p className="relative font-cairo font-black text-xl sm:text-2xl mt-5" style={{ color: "var(--c-ink)" }}>
					لسه مفيش طلبات
				</p>
				<p className="relative font-cairo text-sm mt-2 mb-8" style={{ color: "var(--c-ink-muted)" }}>
					أول طلب ليكِ هيبان هنا — منتجاتنا بتستناكِ
				</p>
				<a
					href="/products"
					className="relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-cairo font-bold text-base text-white"
					style={{ background: "var(--c-brand)", transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLAnchorElement).style.background = "var(--c-brand-hover)";
						(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLAnchorElement).style.background = "var(--c-brand)";
						(e.currentTarget as HTMLAnchorElement).style.transform = "";
					}}
				>
					تسوق دلوقتي
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</a>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{orders.map((o) => (
				<a
					key={o.id}
					href={`/orders/${o.id}`}
					className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-hvar hover:border-[var(--c-brand)] transition-all group"
				>
					<div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20 text-brand">
						<Package size={18} />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<span className="font-mono text-xs font-bold text-ink">
								#{o.id}
							</span>
							<span
								className={`px-2 py-0.5 rounded-md text-[10px] font-cairo font-bold ${
									STATUS_COLORS[o.status] ?? STATUS_COLORS.pending
								}`}
							>
								{STATUS_LABELS[o.status] ?? o.status}
							</span>
						</div>
						<div className="flex items-center gap-3 text-xs font-cairo text-muted">
							<span className="font-inter font-bold tabular-nums">
								{o.total.toLocaleString("ar-EG")} ج.م
							</span>
							<span>
								{new Date(o.createdAt).toLocaleDateString("ar-EG", {
									day: "numeric",
									month: "short",
								})}
							</span>
						</div>
					</div>
					<ChevronLeft
						size={16}
						className="text-stone-300 dark:text-stone-600 group-hover:text-[var(--c-brand)] transition-colors"
					/>
				</a>
			))}
		</div>
	);
}
