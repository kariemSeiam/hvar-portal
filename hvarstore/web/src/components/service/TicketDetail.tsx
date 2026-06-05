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

const STEP_COLORS: Record<string, string> = {
	PENDING: "bg-stone-400",
	HUB_RECEIVED: "bg-blue-500",
	IN_WORKSHOP: "bg-amber-500",
	DISPATCHED: "bg-purple-500",
	INSPECTED: "bg-blue-500",
	READY: "bg-green-500",
	REFUNDED: "bg-green-500",
	CLOSED: "bg-emerald-500",
	CANCELLED: "bg-red-500",
	FAILED: "bg-red-500",
};

const STEP_BORDER: Record<string, string> = {
	PENDING: "border-stone-300 dark:border-stone-600",
	HUB_RECEIVED: "border-blue-300 dark:border-blue-700",
	IN_WORKSHOP: "border-amber-300 dark:border-amber-700",
	DISPATCHED: "border-purple-300 dark:border-purple-700",
	INSPECTED: "border-blue-300 dark:border-blue-700",
	READY: "border-green-300 dark:border-green-700",
	REFUNDED: "border-green-300 dark:border-green-700",
	CLOSED: "border-emerald-300 dark:border-emerald-700",
	CANCELLED: "border-red-300 dark:border-red-700",
	FAILED: "border-red-300 dark:border-red-700",
};

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
				<Loader2 size={24} className="animate-spin text-[#d43533]" />
			</div>
		);
	}

	if (error || !ticket) {
		return (
			<div className="text-center py-20">
				<p className="font-cairo text-lg text-[#57534e] dark:text-[#a8a29e]">
					{error ?? "التذكرة غير موجودة"}
				</p>
				<a
					href="/service"
					className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#d43533] hover:bg-[#b91c1c] text-white font-cairo font-bold text-sm transition-all mt-4"
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
							<TypeIcon size={18} className="text-[#d43533]" />
							<h2 className="font-mono font-bold text-lg text-[#1c1917] dark:text-[#f5f5f4]">
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
					<p className="font-cairo text-xs text-[#57534e] dark:text-[#a8a29e] mt-1">
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
			<section className="rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e7e0d6] dark:border-[#2c2825] p-5">
				<h3 className="font-cairo font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4] mb-3">
					المنتج
				</h3>
				<p className="font-cairo text-base text-[#1c1917] dark:text-[#f5f5f4] font-semibold">
					{ticket.productName}
				</p>
				{ticket.description && (
					<>
						<h4 className="font-cairo font-bold text-xs text-[#57534e] dark:text-[#a8a29e] mt-4 mb-1">
							وصف المشكلة
						</h4>
						<p className="font-cairo text-sm text-[#57534e] dark:text-[#a8a29e] leading-relaxed">
							{ticket.description}
						</p>
					</>
				)}
				{ticket.transactionId && (
					<a
						href={`/orders/${ticket.transactionId}`}
						className="inline-flex items-center gap-1.5 mt-4 text-xs font-cairo font-semibold text-[#d43533] hover:underline"
					>
						الطلب المرتبط #{ticket.transactionId}
					</a>
				)}
			</section>

			{/* Service stepper (Wilson P10) */}
			<section className="rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e7e0d6] dark:border-[#2c2825] p-5">
				<h3 className="font-cairo font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4] mb-6">
					حالة الطلب
				</h3>

				<div className="relative flex flex-col">
					{idealSteps.map((step, idx) => {
						const isPast = currentIndex >= 0 && idx < currentIndex;
						const isCurrent = idx === currentIndex;
						const isActive = isPast || isCurrent;

						return (
							<div
								key={step}
								className="relative flex items-stretch"
								style={{
									minHeight:
										currentIndex === idx && isTerminal ? "auto" : "72px",
								}}
							>
								{/* Vertical line (connecting dots) */}
								{idx < idealSteps.length - 1 && (
									<div
										className={`absolute right-[15px] top-8 w-[2px] h-[calc(100%-8px)] ${
											isActive
												? (STEP_COLORS[step] ??
													"bg-stone-300 dark:bg-stone-600")
												: "bg-stone-200 dark:bg-stone-700"
										}`}
									/>
								)}

								{/* Dot */}
								<div className="flex flex-col items-center ml-4">
									<div
										className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
											isCurrent
												? `${STEP_COLORS[step] ?? "bg-stone-400"} ring-4 ${
														STEP_BORDER[step] ??
														"border-stone-300 dark:border-stone-600"
													} scale-110`
												: isPast
													? `${STEP_COLORS[step] ?? "bg-stone-300"}`
													: "bg-white dark:bg-[#1c1917] border-2 border-stone-300 dark:border-stone-600"
										}`}
									>
										{isPast || isCurrent ? (
											isCurrent ? (
												<div className="w-3 h-3 rounded-full bg-white" />
											) : (
												<CheckCircle2 size={14} className="text-white" />
											)
										) : (
											<div className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-600" />
										)}
									</div>
								</div>

								{/* Label */}
								<div className="flex-1 pb-6">
									<p
										className={`font-cairo text-sm font-semibold ${
											isCurrent
												? "text-[#d43533]"
												: isPast
													? "text-[#1c1917] dark:text-[#f5f5f4]"
													: "text-stone-400 dark:text-stone-500"
										}`}
									>
										{STATUS_LABELS[step] ?? step}
									</p>

									{/* Show date/time when this step was reached from history */}
									{ticket.history
										.filter((h) => h.status === step)
										.slice(-1)
										.map((h) => (
											<p
												key={h.id}
												className="font-cairo text-xs text-[#a8a29e] mt-0.5"
											>
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
						);
					})}

					{/* Terminal state (CANCELLED / FAILED) */}
					{isTerminal && (
						<div className="relative flex items-stretch">
							<div className="flex flex-col items-center ml-4">
								<div
									className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
										STEP_COLORS[ticket.status] ?? "bg-red-500"
									} ring-4 border-red-300 dark:border-red-700 scale-110`}
								>
									<AlertCircle size={14} className="text-white" />
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
										<p
											key={h.id}
											className="font-cairo text-xs text-[#a8a29e] mt-0.5"
										>
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
				<section className="rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e7e0d6] dark:border-[#2c2825] p-5">
					<div className="flex items-center gap-2 mb-4">
						<Clock size={16} className="text-[#d43533]" />
						<h3 className="font-cairo font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4]">
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
										className={`w-2 h-2 rounded-full mt-1.5 ${
											STEP_COLORS[h.status] ?? "bg-stone-300"
										}`}
									/>
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-cairo font-semibold text-[#1c1917] dark:text-[#f5f5f4]">
										{STATUS_LABELS[h.status] ?? h.status}
									</p>
									{h.notes && (
										<p className="font-cairo text-xs text-[#57534e] dark:text-[#a8a29e] mt-0.5">
											{h.notes}
										</p>
									)}
									<p className="font-cairo text-[10px] text-[#a8a29e] mt-1">
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
