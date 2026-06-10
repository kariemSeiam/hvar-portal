import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import {
	Wrench,
	RefreshCw,
	RotateCcw,
	Clock,
	Loader2,
	CheckCircle2,
	AlertCircle,
} from "lucide-react";
import { isLoggedIn, getAuthHeaders } from "../../lib/auth";

interface TicketHistoryItem {
	id: number;
	status: string;
	notes: string | null;
	createdAt: string;
}

interface TicketData {
	id: number;
	ticketCode: string;
	type: "M" | "R" | "T";
	status: string;
	contactId: number;
	transactionId: number | null;
	productName: string;
	description: string;
	createdAt: string;
	updatedAt: string;
	history: TicketHistoryItem[];
}

type TicketStatus =
	| "PENDING"
	| "HUB_RECEIVED"
	| "IN_WORKSHOP"
	| "DISPATCHED"
	| "INSPECTED"
	| "READY"
	| "REFUNDED"
	| "CLOSED"
	| "CANCELLED"
	| "FAILED";

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

const TYPE_LABELS: Record<string, string> = {
	M: "صيانة",
	R: "استبدال",
	T: "مرتجع",
};

const TERMINAL_STATUSES = new Set(["CANCELLED", "FAILED"]);

// State machine per ticket type (Wilson P10)
const TICKET_STATE_MACHINE: Record<string, TicketStatus[]> = {
	M: ["PENDING", "HUB_RECEIVED", "IN_WORKSHOP", "READY", "CLOSED"],
	R: ["PENDING", "HUB_RECEIVED", "DISPATCHED", "READY", "CLOSED"],
	T: ["PENDING", "HUB_RECEIVED", "INSPECTED", "REFUNDED", "CLOSED"],
};

const TYPE_ICONS: Record<string, typeof Wrench> = {
	M: Wrench,
	R: RefreshCw,
	T: RotateCcw,
};

const API = import.meta.env?.PUBLIC_API_URL ?? "http://localhost:5000";

export default function TicketDetail() {
	const loggedIn = useStore(isLoggedIn);
	const [ticket, setTicket] = useState<TicketData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!loggedIn) {
			window.location.href = "/login?redirect=" + window.location.pathname;
			return;
		}

		const id = window.location.pathname.split("/").pop();
		if (!id) return;

		fetch(`${API}/api/tickets/${id}`, { headers: getAuthHeaders() })
			.then((r) => {
				if (!r.ok) throw new Error("not_found");
				return r.json();
			})
			.then((d) => setTicket(d))
			.catch(() => setError("التذكرة غير موجودة"))
			.finally(() => setLoading(false));
	}, [loggedIn]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 size={24} className="animate-spin text-brand" />
			</div>
		);
	}

	if (error || !ticket) {
		return (
			<div className="text-center py-20">
				<p className="font-cairo text-lg text-muted">
					{error ?? "التذكرة غير موجودة"}
				</p>
				<a
					href="/service"
					className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-[var(--c-brand-hover)] text-white font-cairo font-bold text-sm transition-all mt-4"
				>
					العودة للتذاكر
				</a>
			</div>
		);
	}

	const TypeIcon = TYPE_ICONS[ticket.type] ?? Wrench;
	const idealSteps = TICKET_STATE_MACHINE[ticket.type] ?? [];
	const isTerminal =
		ticket.status === "CANCELLED" || ticket.status === "FAILED";
	const currentIndex = idealSteps.indexOf(ticket.status as TicketStatus);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between flex-wrap gap-3">
				<div>
					<div className="flex items-center gap-3 flex-wrap">
						<div className="flex items-center gap-2">
							<TypeIcon size={18} className="text-brand" />
							<h2 className="font-mono font-bold text-lg text-ink">
								{ticket.ticketCode}
							</h2>
						</div>
						<span className="px-2 py-0.5 rounded-md text-[10px] font-cairo font-bold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
							{TYPE_LABELS[ticket.type] ?? ticket.type}
						</span>
						<span
							className={`px-2.5 py-1 rounded-lg text-xs font-cairo font-bold ${
								STATUS_COLORS[ticket.status] ?? STATUS_COLORS.PENDING
							}`}
						>
							{STATUS_LABELS[ticket.status] ?? ticket.status}
						</span>
					</div>
					<p className="font-cairo text-xs text-muted mt-1">
						{new Date(ticket.createdAt).toLocaleDateString("ar-EG", {
							weekday: "long",
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</p>
				</div>
			</div>

			{/* Product info */}
			<section className="rounded-2xl bg-surface border border-hvar p-5">
				<h3 className="font-cairo font-bold text-sm text-ink mb-3">
					المنتج
				</h3>
				<p className="font-cairo text-base text-ink font-semibold">
					{ticket.productName}
				</p>
				{ticket.description && (
					<>
						<h4 className="font-cairo font-bold text-xs text-muted mt-4 mb-1">
							وصف المشكلة
						</h4>
						<p className="font-cairo text-sm text-muted leading-relaxed">
							{ticket.description}
						</p>
					</>
				)}
				{ticket.transactionId && (
					<a
						href={`/orders/${ticket.transactionId}`}
						className="inline-flex items-center gap-1.5 mt-4 text-xs font-cairo font-semibold text-brand hover:underline"
					>
						الطلب المرتبط #{ticket.transactionId}
					</a>
				)}
			</section>

			{/* Service stepper — unified ember brand timeline */}
			<section className="rounded-2xl bg-surface border border-hvar p-5">
				<style dangerouslySetInnerHTML={{ __html: `
					@keyframes nodeGlow {
						0%, 100% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--c-brand) 20%, transparent), 0 0 12px color-mix(in srgb, var(--c-brand) 30%, transparent); }
						50% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--c-brand) 12%, transparent), 0 0 20px color-mix(in srgb, var(--c-brand) 22%, transparent); }
					}
				` }} />
				<h3 className="font-cairo font-bold text-sm text-ink mb-6">
					حالة الطلب
				</h3>

				<div className="relative flex flex-col">
					{idealSteps.map((step, idx) => {
						const isPast = currentIndex >= 0 && idx < currentIndex;
						const isCurrent = idx === currentIndex;

						return (
							<div key={step} className="relative flex items-stretch" style={{ minHeight: "72px" }}>
								{/* Vertical connector */}
								{idx < idealSteps.length - 1 && (
									<div
										className="absolute top-8 w-[2px] h-[calc(100%-8px)]"
										style={{
											insetInlineEnd: "15px",
											background: isPast || isCurrent
												? "var(--c-brand)"
												: "var(--c-hairline)",
											opacity: isPast || isCurrent ? 0.5 : 1,
										}}
									/>
								)}

								{/* Dot */}
								<div className="flex flex-col items-center" style={{ marginInlineStart: "0.25rem", marginInlineEnd: "1rem" }}>
									<div
										className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
										style={
											isCurrent
												? {
													background: "var(--c-brand)",
													transform: "scale(1.12)",
													animation: "nodeGlow 2.4s ease-in-out infinite",
												}
												: isPast
												? { background: "var(--c-brand)" }
												: {
													background: "var(--c-surface)",
													border: "2px solid var(--c-hairline)",
												}
										}
									>
										{isPast ? (
											<CheckCircle2 size={14} color="#fff" />
										) : isCurrent ? (
											<div className="w-3 h-3 rounded-full bg-white" />
										) : (
											<div className="w-2 h-2 rounded-full" style={{ background: "var(--c-hairline)" }} />
										)}
									</div>
								</div>

								{/* Label + history date + ETA box */}
								<div className="flex-1 pb-6">
									<p
										className="font-cairo text-sm font-semibold"
										style={{
											color: isCurrent
												? "var(--c-brand)"
												: isPast
												? "var(--c-ink)"
												: "var(--c-ink-faint)",
										}}
									>
										{STATUS_LABELS[step] ?? step}
									</p>

									{ticket.history
										.filter((h) => h.status === step)
										.slice(-1)
										.map((h) => (
											<p key={h.id} className="font-cairo text-xs text-faint mt-0.5">
												{new Date(h.createdAt).toLocaleDateString("ar-EG", {
													day: "numeric",
													month: "short",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
										))}

									{isCurrent && !isTerminal && (
										<div
											className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-cairo text-xs font-semibold"
											style={{
												background: "var(--c-brand-tint)",
												color: "var(--c-brand)",
												border: "1px solid color-mix(in srgb, var(--c-brand) 22%, transparent)",
											}}
										>
											<Clock size={11} />
											الوقت المتوقع: ٢–٤ أيام عمل
										</div>
									)}
								</div>
							</div>
						);
					})}

					{/* Terminal state overlay */}
					{isTerminal && (
						<div className="relative flex items-stretch">
							<div className="flex flex-col items-center" style={{ marginInlineStart: "0.25rem", marginInlineEnd: "1rem" }}>
								<div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center bg-red-500" style={{ transform: "scale(1.1)" }}>
									<AlertCircle size={14} color="#fff" />
								</div>
							</div>
							<div className="flex-1 pb-2">
								<p className="font-cairo text-sm font-bold text-red-600 dark:text-red-400">
									{STATUS_LABELS[ticket.status] ?? ticket.status}
								</p>
								{ticket.history
									.filter((h) => h.status === ticket.status)
									.slice(-1)
									.map((h) => (
										<p key={h.id} className="font-cairo text-xs text-faint mt-0.5">
											{new Date(h.createdAt).toLocaleDateString("ar-EG", {
												day: "numeric",
												month: "short",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									))}
							</div>
						</div>
					)}
				</div>
			</section>

			{/* History log */}
			{ticket.history.length > 0 && (
				<section className="rounded-2xl bg-surface border border-hvar p-5">
					<div className="flex items-center gap-2 mb-4">
						<Clock size={16} className="text-brand" />
						<h3 className="font-cairo font-bold text-sm text-ink">
							سجل التحديثات
						</h3>
					</div>
					<div className="space-y-3">
						{[...ticket.history].reverse().map((h) => (
							<div
								key={h.id}
								className="flex gap-3 text-sm border-b border-stone-100 dark:border-stone-800 pb-3 last:border-0 last:pb-0"
							>
								<div className="flex flex-col items-center">
									<div
										className="w-2 h-2 rounded-full mt-1.5"
										style={{ background: TERMINAL_STATUSES.has(h.status) ? "#ef4444" : "var(--c-brand)", opacity: 0.7 }}
									/>
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-cairo font-semibold text-ink">
										{STATUS_LABELS[h.status] ?? h.status}
									</p>
									{h.notes && (
										<p className="font-cairo text-xs text-muted mt-0.5">
											{h.notes}
										</p>
									)}
									<p className="font-cairo text-[10px] text-faint mt-1">
										{new Date(h.createdAt).toLocaleDateString("ar-EG", {
											day: "numeric",
											month: "short",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>
							</div>
						))}
					</div>
				</section>
			)}
		</div>
	);
}
