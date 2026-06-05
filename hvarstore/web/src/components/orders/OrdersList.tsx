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
				<Loader2 size={24} className="animate-spin text-[#d43533]" />
			</div>
		);
	}

	if (orders.length === 0) {
		return (
			<div className="text-center py-20">
				<div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800 text-[#a8a29e]">
					<Package size={28} />
				</div>
				<p className="font-cairo text-lg text-[#57534e] dark:text-[#a8a29e] mb-2">
					لا يوجد طلبات
				</p>
				<a
					href="/products"
					className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#d43533] hover:bg-[#b91c1c] text-white font-cairo font-bold text-sm transition-all mt-4"
				>
					تسوق الآن
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
					className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e7e0d6] dark:border-[#2c2825] hover:border-[#d43533] transition-all group"
				>
					<div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20 text-[#d43533]">
						<Package size={18} />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<span className="font-mono text-xs font-bold text-[#1c1917] dark:text-[#f5f5f4]">
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
						<div className="flex items-center gap-3 text-xs font-cairo text-[#57534e] dark:text-[#a8a29e]">
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
						className="text-stone-300 dark:text-stone-600 group-hover:text-[#d43533] transition-colors"
					/>
				</a>
			))}
		</div>
	);
}
