import { useState, useEffect, useRef } from "react";
import { ShoppingCart } from "lucide-react";
import { addToCart } from "../../stores/cart";
import type { ProductDetail } from "../../lib/api";

interface Props {
	product: Pick<
		ProductDetail,
		"id" | "variationId" | "name" | "slug" | "image" | "price" | "stock"
	>;
}

export default function StickyMobileCta({ product }: Props) {
	const [visible, setVisible] = useState(false);
	const [added, setAdded] = useState(false);
	const observerRef = useRef<IntersectionObserver | null>(null);

	const outOfStock = product.stock === 0;

	useEffect(() => {
		if (outOfStock) return;

		const sentinel = document.getElementById("cta-action-bar");
		if (!sentinel) return;

		observerRef.current = new IntersectionObserver(
			([entry]) => {
				// Show sticky bar when inline CTA is NOT visible
				setVisible(!entry.isIntersecting);
			},
			{ threshold: 0.1 },
		);
		observerRef.current.observe(sentinel);

		return () => observerRef.current?.disconnect();
	}, [outOfStock]);

	function handleAdd() {
		// Read current variation from the inline CTA's data attrs (avoids cross-island state)
		const bar = document.getElementById("cta-action-bar");
		const variationId = bar?.dataset.variationId
			? Number(bar.dataset.variationId)
			: product.variationId;
		const price = bar?.dataset.price
			? Number(bar.dataset.price)
			: product.price;

		addToCart({
			productId: product.id,
			variationId,
			slug: product.slug,
			name: product.name,
			image: product.image,
			price,
		});

		setAdded(true);
		setTimeout(() => setAdded(false), 1500);
	}

	if (outOfStock) return null;

	return (
		<div
			role="region"
			aria-label="إضافة للسلة"
			aria-hidden={!visible}
			className="fixed bottom-0 inset-x-0 z-[60] md:hidden"
			style={{
				backgroundColor: "var(--c-surface)",
				borderTop: "1px solid var(--c-border)",
				transform: visible ? "translateY(0)" : "translateY(110%)",
				transition: "transform 0.35s var(--ease-spring)",
				paddingBottom:
					"max(0.75rem, env(safe-area-inset-bottom, 0.75rem))",
				paddingTop: "0.75rem",
				paddingInline: "1rem",
				boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
			}}
		>
			<div className="flex items-center gap-3">
				{/* Price */}
				<div className="flex flex-col leading-tight flex-shrink-0">
					<span
						className="font-inter font-black text-xl leading-none"
						style={{ color: "var(--c-brand)" }}
					>
						{product.price.toLocaleString("ar-EG")} ج.م
					</span>
				</div>

				{/* Add button */}
				<button
					onClick={handleAdd}
					aria-label="إضافة للسلة"
					className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-cairo font-bold text-sm text-white transition-all"
					style={{
						backgroundColor: added
							? "var(--c-trust)"
							: "var(--c-brand)",
						transition: "background-color 0.25s var(--ease-spring)",
					}}
				>
					<ShoppingCart size={16} />
					{added ? "تمت الإضافة ✓" : "أضف للسلة"}
				</button>
			</div>
		</div>
	);
}
