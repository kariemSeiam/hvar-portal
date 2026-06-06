import { useState } from "react";
import { Minus, Plus, ShoppingCart, MessageCircle } from "lucide-react";
import { addToCart } from "../../stores/cart";
import type { ProductDetail } from "../../lib/api";

interface Props {
	product: ProductDetail;
}

export default function CtaActionBar({ product }: Props) {
	const hasVariations = product.variations.length > 1;
	const [selectedVariationId, setSelectedVariationId] = useState(
		product.variationId,
	);
	const [qty, setQty] = useState(1);
	const [added, setAdded] = useState(false);

	const selectedVariation =
		product.variations.find((v) => v.id === selectedVariationId) ??
		product.variations[0];

	const price = selectedVariation?.price ?? product.price;
	const stock = selectedVariation?.stock ?? product.stock;
	const outOfStock = stock === 0;
	const isLowStock = stock > 0 && stock <= 3;
	const showInstallment = price >= 1000;

	function handleAdd() {
		if (outOfStock) return;
		for (let i = 0; i < qty; i++) {
			addToCart({
				productId: product.id,
				variationId: selectedVariationId,
				slug: product.slug,
				name: product.name,
				image: product.image,
				price,
			});
		}
		setAdded(true);
		setTimeout(() => setAdded(false), 2000);
	}

	const waInquiry = `https://wa.me/201000000000?text=${encodeURIComponent(`مرحبا، أريد الاستفسار عن: ${product.name}`)}`;
	const waNotify = `https://wa.me/201000000000?text=${encodeURIComponent(`مرحبا، أريد معرفة متى يتوفر: ${product.name}`)}`;

	return (
		<div
			id="cta-action-bar"
			data-variation-id={selectedVariationId}
			data-price={price}
			className="space-y-4"
		>
			{/* Variation selector */}
			{hasVariations && (
				<div>
					<p
						className="text-sm font-cairo font-semibold mb-2"
						style={{ color: "var(--c-ink)" }}
					>
						الاختيار:
					</p>
					<div className="flex flex-wrap gap-2">
						{product.variations.map((v) => (
							<button
								key={v.id}
								onClick={() => {
									setSelectedVariationId(v.id);
									setQty(1);
								}}
								disabled={v.stock === 0}
								className="px-3 py-1.5 rounded-lg text-sm font-cairo font-semibold border transition-all"
								style={
									v.id === selectedVariationId
										? {
												borderColor: "var(--c-brand)",
												backgroundColor: "var(--c-brand)",
												color: "#fff",
											}
										: v.stock === 0
											? {
													borderColor: "var(--c-border)",
													color: "var(--c-ink-faint)",
													cursor: "not-allowed",
												}
											: {
													borderColor: "var(--c-border)",
													color: "var(--c-ink)",
												}
								}
							>
								{v.name}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Low stock warning */}
			{isLowStock && (
				<p className="flex items-center gap-1.5 text-sm font-cairo text-amber-600 dark:text-amber-400">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M10.3 3.3L2 20h20L13.7 3.3a2 2 0 0 0-3.4 0Z" />
						<line x1="12" y1="9" x2="12" y2="13" />
						<line x1="12" y1="17" x2="12.01" y2="17" />
					</svg>
					{stock} قطع متبقية فقط
				</p>
			)}

			{/* Price */}
			<div className="flex items-baseline gap-3">
				<span
					className="font-inter font-black text-3xl"
					style={{ color: "var(--c-brand)" }}
				>
					{price.toLocaleString("ar-EG")} ج.م
				</span>
				{product.comparePrice && product.comparePrice > price && (
					<span
						className="font-inter text-lg line-through"
						style={{ color: "var(--c-ink-faint)" }}
					>
						{product.comparePrice.toLocaleString("ar-EG")}
					</span>
				)}
			</div>

			{/* Installment hint */}
			{showInstallment && (
				<p
					className="text-xs font-cairo"
					style={{ color: "var(--c-brass)" }}
				>
					أقساط تبدأ من{" "}
					<span className="font-bold">
						{Math.round(price / 12).toLocaleString("ar-EG")} ج.م/شهر
					</span>{" "}
					مع ValU · Souhoola · Aman
				</p>
			)}

			{/* Qty + Add to cart */}
			{!outOfStock && (
				<div className="flex items-center gap-3">
					{/* Qty stepper */}
					<div
						className="flex items-center rounded-xl overflow-hidden"
						style={{ border: "1px solid var(--c-border)" }}
					>
						<button
							onClick={() => setQty((q) => Math.max(1, q - 1))}
							className="w-10 h-11 flex items-center justify-center transition-colors"
							style={{ color: "var(--c-ink-muted)" }}
							aria-label="تقليل الكمية"
						>
							<Minus size={15} />
						</button>
						<span
							className="w-10 text-center font-inter font-bold text-sm"
							style={{ color: "var(--c-ink)" }}
						>
							{qty}
						</span>
						<button
							onClick={() => setQty((q) => Math.min(stock, q + 1))}
							disabled={qty >= stock}
							className="w-10 h-11 flex items-center justify-center disabled:opacity-30 transition-colors"
							style={{ color: "var(--c-ink-muted)" }}
							aria-label="زيادة الكمية"
						>
							<Plus size={15} />
						</button>
					</div>

					{/* Add to cart */}
					<button
						onClick={handleAdd}
						className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-cairo font-bold text-base text-white transition-all"
						style={{
							backgroundColor: added ? "var(--c-trust)" : "var(--c-brand)",
							transition: "all 0.3s var(--ease-spring)",
						}}
						onMouseEnter={(e) => {
							if (!added)
								(e.currentTarget as HTMLButtonElement).style.backgroundColor =
									"var(--c-brand-hover)";
						}}
						onMouseLeave={(e) => {
							if (!added)
								(e.currentTarget as HTMLButtonElement).style.backgroundColor =
									"var(--c-brand)";
						}}
					>
						<ShoppingCart size={18} />
						{added ? "تمت الإضافة ✓" : "أضف للسلة"}
					</button>
				</div>
			)}

			{/* Out of stock: disabled state + WhatsApp notify */}
			{outOfStock && (
				<div className="space-y-3">
					<button
						disabled
						className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-cairo font-bold text-base cursor-not-allowed"
						style={{
							backgroundColor: "var(--c-border)",
							color: "var(--c-ink-muted)",
						}}
					>
						<ShoppingCart size={18} />
						نفذت الكمية
					</button>
					<a
						href={waNotify}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center justify-center gap-2 w-full py-2.5 px-5 rounded-xl font-cairo font-semibold text-sm transition-all hover:opacity-90"
						style={{
							border: "1px solid rgba(37,211,102,0.35)",
							color: "#25d366",
						}}
					>
						<MessageCircle size={15} />
						أخبرني عند التوفر عبر واتساب
					</a>
				</div>
			)}

			{/* WhatsApp inquiry (in-stock only) */}
			{!outOfStock && (
				<a
					href={waInquiry}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl font-cairo font-semibold text-sm transition-all hover:opacity-90"
					style={{
						border: "1px solid rgba(37,211,102,0.3)",
						color: "#25d366",
					}}
				>
					<MessageCircle size={17} />
					اطلب عبر واتساب
				</a>
			)}

			{/* Trust line */}
			<div className="trust-line">
				<span>ضمان أصلي</span>
				<span>شحن مجاني</span>
				<span>افحص قبل الدفع</span>
			</div>
		</div>
	);
}
