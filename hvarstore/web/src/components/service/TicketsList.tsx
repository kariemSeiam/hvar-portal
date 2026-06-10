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
				<Loader2 size={24} className="animate-spin text-brand" />
			</div>
		);
	}

	if (tickets.length === 0) {
		return (
			<div className="relative flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden">
				<div
					className="absolute inset-0 pointer-events-none"
					aria-hidden="true"
					style={{ background: "radial-gradient(ellipse 55% 50% at 50% 40%, rgba(var(--c-brass-rgb),0.07) 0%, transparent 70%)" }}
				/>
				<Wrench
					className="relative select-none"
					strokeWidth={0.9}
					style={{ width: "clamp(80px,15vw,120px)", height: "auto", color: "var(--c-brass)", opacity: 0.18 }}
					aria-hidden="true"
				/>
				<p className="relative font-cairo font-black text-xl sm:text-2xl mt-5" style={{ color: "var(--c-ink)" }}>
					مفيش طلبات خدمة
				</p>
				<p className="relative font-cairo text-sm mt-2 mb-8" style={{ color: "var(--c-ink-muted)" }}>
					لو عندك منتج محتاج صيانة أو استبدال — افتحي تذكرة وفريقنا هيرد خلال ٢٤ ساعة
				</p>
				<a
					href="/service/new"
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
					<Wrench size={16} />
					افتحي طلب خدمة
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
					className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-hvar hover:border-[var(--c-brand)] transition-all group"
				>
					<div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20 text-brand">
						<Wrench size={18} />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<span className="font-mono text-xs font-bold text-ink">
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
						<div className="flex items-center gap-3 text-xs font-cairo text-muted">
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
						className="text-stone-300 dark:text-stone-600 group-hover:text-[var(--c-brand)] transition-colors"
					/>
				</a>
			))}
		</div>
	);
}
