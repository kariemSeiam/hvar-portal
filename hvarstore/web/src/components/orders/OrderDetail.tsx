import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import {
	Package,
	MapPin,
	Loader2,
	ExternalLink,
	Phone,
	FileText,
	CheckCircle2,
	XCircle,
} from "lucide-react";
import { isLoggedIn, getAuthHeaders } from "../../lib/auth";

interface OrderData {
	id: number;
	paymentMethod: string;
	status: string;
	subtotal: number;
	shippingFee: number;
	total: number;
	billCode: string | null;
	erpTransactionId: number | null;
	cancelledAt: string | null;
	createdAt: string;
	address: {
		governorate: string;
		district: string;
		street: string;
		building: string;
		apartment: string | null;
		phone: string;
		notes: string | null;
	};
	items: Array<{
		productId: number;
		variationId: number;
		name: string;
		sku: string | null;
		quantity: number;
		unitPrice: number;
		subtotal: number;
	}>;
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

const PAYMENT_LABELS: Record<string, string> = {
	cod: "الدفع عند الاستلام",
	kashier_card: "بطاقة ائتمان",
	kashier_installments: "تقسيط",
};

const API = import.meta.env?.PUBLIC_API_URL ?? "http://localhost:5000";

export default function OrderDetail() {
	const loggedIn = useStore(isLoggedIn);
	const [order, setOrder] = useState<OrderData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [cancelling, setCancelling] = useState(false);
	const [cancelError, setCancelError] = useState<string | null>(null);
	const [paidFlag, setPaidFlag] = useState<"success" | "failed" | null>(null);

	async function handleCancel() {
		if (!order || !confirm("هل تريد إلغاء الطلب نهائياً؟")) return;
		setCancelling(true);
		setCancelError(null);
		try {
			const res = await fetch(`${API}/api/orders/${order.id}/cancel`, {
				method: "POST",
				headers: getAuthHeaders(),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? "فشل إلغاء الطلب");
			setOrder((o) =>
				o
					? { ...o, status: "cancelled", cancelledAt: new Date().toISOString() }
					: o,
			);
		} catch (err) {
			setCancelError(err instanceof Error ? err.message : "حدث خطأ");
		} finally {
			setCancelling(false);
		}
	}

	useEffect(() => {
		if (!loggedIn) {
			window.location.href = "/login?redirect=" + window.location.pathname;
			return;
		}

		const params = new URLSearchParams(window.location.search);
		const paid = params.get("paid");
		if (paid === "1") setPaidFlag("success");
		else if (paid === "0") setPaidFlag("failed");

		const id = window.location.pathname.split("/").pop();
		if (!id) return;

		fetch(`${API}/api/orders/${id}`, { headers: getAuthHeaders() })
			.then((r) => {
				if (!r.ok) throw new Error("not_found");
				return r.json();
			})
			.then((d) => setOrder(d))
			.catch(() => setError("الطلب غير موجود"))
			.finally(() => setLoading(false));
	}, [loggedIn]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 size={24} className="animate-spin text-brand" />
			</div>
		);
	}

	if (error || !order) {
		return (
			<div className="text-center py-20">
				<p className="font-cairo text-lg text-muted">
					{error ?? "الطلب غير موجود"}
				</p>
				<a
					href="/orders"
					className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-[var(--c-brand-hover)] text-white font-cairo font-bold text-sm transition-all mt-4"
				>
					العودة لطلباتي
				</a>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{paidFlag === "success" && (
				<div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30">
					<CheckCircle2 size={20} className="text-green-600 shrink-0" />
					<div className="flex-1">
						<p className="font-cairo font-bold text-sm text-green-800 dark:text-green-300">
							تم استلام دفعتك
						</p>
						<p className="font-cairo text-xs text-green-700 dark:text-green-400">
							طلبك قيد التأكيد وسيتم شحنه قريباً
						</p>
					</div>
				</div>
			)}
			{paidFlag === "failed" && (
				<div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
					<XCircle size={20} className="text-red-600 shrink-0" />
					<div className="flex-1">
						<p className="font-cairo font-bold text-sm text-red-800 dark:text-red-300">
							فشل الدفع
						</p>
						<p className="font-cairo text-xs text-red-700 dark:text-red-400">
							يمكنك المحاولة مرة أخرى أو التواصل مع خدمة العملاء
						</p>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="flex items-center justify-between flex-wrap gap-3">
				<div>
					<div className="flex items-center gap-3">
						<h2 className="font-mono font-bold text-lg text-ink">
							#{order.id}
						</h2>
						<span
							className={`px-2.5 py-1 rounded-lg text-xs font-cairo font-bold ${
								STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
							}`}
						>
							{STATUS_LABELS[order.status] ?? order.status}
						</span>
					</div>
					<p className="font-cairo text-xs text-muted mt-1">
						{new Date(order.createdAt).toLocaleDateString("ar-EG", {
							weekday: "long",
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</p>
				</div>

				{order.status === "pending" && order.paymentMethod === "cod" && (
					<button
						onClick={handleCancel}
						disabled={cancelling}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 font-cairo font-bold text-xs hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
					>
						{cancelling && <Loader2 size={13} className="animate-spin" />}
						إلغاء الطلب
					</button>
				)}

				{cancelError && (
					<p className="w-full text-xs font-cairo text-red-600 dark:text-red-400 mt-2">
						{cancelError}
					</p>
				)}

				{order.billCode && (
					<a
						href={`https://bosta.co/ar-eg/tracking-shipments?shipment-number=${order.billCode}`}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-cairo font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
					>
						<ExternalLink size={13} />
						تتبع الشحن
					</a>
				)}
			</div>

			{/* Items */}
			<section className="rounded-2xl bg-surface border border-hvar p-5">
				<div className="flex items-center gap-2 mb-4">
					<Package size={16} className="text-brand" />
					<h3 className="font-cairo font-bold text-sm text-ink">
						المنتجات
					</h3>
				</div>
				<div className="space-y-3">
					{order.items.map((item, i) => (
						<div
							key={i}
							className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800 last:border-0"
						>
							<div className="flex-1 min-w-0">
								<p className="font-cairo text-sm text-ink">
									{item.name}
								</p>
								<p className="font-cairo text-xs text-[#a8a29e]">
									{item.quantity} x {item.unitPrice.toLocaleString("ar-EG")} ج.م
								</p>
							</div>
							<p className="font-inter font-bold text-sm text-ink mr-4">
								{item.subtotal.toLocaleString("ar-EG")} ج.م
							</p>
						</div>
					))}
				</div>
				<div className="border-t border-hvar pt-3 mt-3 space-y-2">
					<div className="flex justify-between text-sm">
						<span className="font-cairo text-muted">
							المنتجات
						</span>
						<span className="font-inter font-bold">
							{order.subtotal.toLocaleString("ar-EG")} ج.م
						</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="font-cairo text-muted">
							الشحن
						</span>
						<span className="font-cairo text-green-600 font-semibold">
							{order.shippingFee === 0
								? "مجاني"
								: `${order.shippingFee.toLocaleString("ar-EG")} ج.م`}
						</span>
					</div>
					<div className="flex justify-between pt-2 border-t border-hvar">
						<span className="font-cairo font-bold text-ink">
							الإجمالي
						</span>
						<span className="font-inter font-black text-lg text-brand">
							{order.total.toLocaleString("ar-EG")} ج.م
						</span>
					</div>
				</div>
			</section>

			{/* Address */}
			<section className="rounded-2xl bg-surface border border-hvar p-5">
				<div className="flex items-center gap-2 mb-3">
					<MapPin size={16} className="text-brand" />
					<h3 className="font-cairo font-bold text-sm text-ink">
						عنوان التوصيل
					</h3>
				</div>
				<div className="font-cairo text-sm text-muted space-y-1">
					<p>
						{order.address.building}، {order.address.street}
					</p>
					{order.address.apartment && <p>شقة {order.address.apartment}</p>}
					<p>
						{order.address.district}، {order.address.governorate}
					</p>
					<div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-stone-100 dark:border-stone-800">
						<Phone size={12} />
						<span dir="ltr" className="font-inter tabular-nums">
							{order.address.phone}
						</span>
					</div>
					{order.address.notes && (
						<div className="flex items-start gap-1.5 mt-1">
							<FileText size={12} className="mt-0.5" />
							<span>{order.address.notes}</span>
						</div>
					)}
				</div>
			</section>

			{/* Payment info */}
			<section className="rounded-2xl bg-surface border border-hvar p-5">
				<h3 className="font-cairo font-bold text-sm text-ink mb-2">
					طريقة الدفع
				</h3>
				<p className="font-cairo text-sm text-muted">
					{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
				</p>
			</section>
		</div>
	);
}
