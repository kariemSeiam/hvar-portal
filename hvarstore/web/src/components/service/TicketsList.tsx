import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { Wrench, ChevronLeft, Loader2 } from "lucide-react";
import { isLoggedIn, getAuthHeaders } from "../../lib/auth";

interface TicketSummary {
	id: number;
	ticketCode: string;
	type: string;
	status: string;
	productName: string;
	description: string;
	createdAt: string;
	updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
	M: "صيانة",
	R: "استبدال",
	T: "مرتجع",
};

const STATUS_LABELS: Record<string, string> = {
	PENDING: "قيد المراجعة",
	HUB_RECEIVED: "تم الاستلام في الفرع",
	IN_WORKSHOP: "في الصيانة",
	DISPATCHED: "تم الشحن",
	INSPECTED: "تم الفحص",
	READY: "جاهز للاستلام",
	REFUNDED: "تم الاسترداد",
	CLOSED: "مغلق",
	CANCELLED: "ملغي",
	FAILED: "فشل",
};

const STATUS_COLORS: Record<string, string> = {
	PENDING:
		"bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
	HUB_RECEIVED:
		"bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
	IN_WORKSHOP:
		"bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
	DISPATCHED:
		"bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
	INSPECTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
	READY: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
	REFUNDED:
		"bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
	CLOSED:
		"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
	CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
	FAILED: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

const API = import.meta.env?.PUBLIC_API_URL ?? "http://localhost:5000";

export default function TicketsList() {
	const loggedIn = useStore(isLoggedIn);
	const [tickets, setTickets] = useState<TicketSummary[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!loggedIn) {
			window.location.href = "/login?redirect=/service";
			return;
		}

		fetch(`${API}/api/tickets`, { headers: getAuthHeaders() })
			.then((r) => r.json())
			.then((d) => setTickets(d.items ?? []))
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

	if (tickets.length === 0) {
		return (
			<div className="text-center py-20">
				<div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800 text-[#a8a29e]">
					<Wrench size={28} />
				</div>
				<p className="font-cairo text-lg text-[#57534e] dark:text-[#a8a29e] mb-2">
					لا يوجد تذاكر خدمة
				</p>
				<a
					href="/service/new"
					className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#d43533] hover:bg-[#b91c1c] text-white font-cairo font-bold text-sm transition-all mt-4"
				>
					فتح تذكرة جديدة
				</a>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{tickets.map((t) => (
				<a
					key={t.id}
					href={`/service/${t.id}`}
					className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e7e0d6] dark:border-[#2c2825] hover:border-[#d43533] transition-all group"
				>
					<div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20 text-[#d43533]">
						<Wrench size={18} />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<span className="font-mono text-xs font-bold text-[#1c1917] dark:text-[#f5f5f4]">
								{t.ticketCode}
							</span>
							{TYPE_LABELS[t.type] && (
								<span className="px-2 py-0.5 rounded-md text-[10px] font-cairo font-bold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
									{TYPE_LABELS[t.type]}
								</span>
							)}
							<span
								className={`px-2 py-0.5 rounded-md text-[10px] font-cairo font-bold ${
									STATUS_COLORS[t.status] ?? STATUS_COLORS.PENDING
								}`}
							>
								{STATUS_LABELS[t.status] ?? t.status}
							</span>
						</div>
						<div className="flex items-center gap-3 text-xs font-cairo text-[#57534e] dark:text-[#a8a29e]">
							<span className="truncate">{t.productName}</span>
							<span className="shrink-0">
								{new Date(t.createdAt).toLocaleDateString("ar-EG", {
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
