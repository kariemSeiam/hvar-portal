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

	const waUrl = `https://wa.me/201204444196?text=${encodeURIComponent("مرحبا، أريد الاستفسار عن: " + product.name)}`;

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
			className="md:hidden"
			style={{
				position: "fixed",
				bottom: 0,
				insetInline: 0,
				zIndex: 60,
				backgroundColor: "var(--c-surface)",
				borderTop: "1px solid var(--c-border)",
				transform: visible ? "translateY(0)" : "translateY(110%)",
				transition: "transform 0.35s var(--ease-spring)",
				paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))",
				paddingTop: "0.75rem",
				paddingInline: "1rem",
				boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
			}}
		>
			<div style={{ display: "flex", alignItems: "stretch", gap: "0.625rem", height: "52px" }}>
				{/* WhatsApp — square tile, same height as the row */}
				<a
					href={waUrl}
					target="_blank"
					rel="noopener noreferrer"
					style={{
						flexShrink: 0,
						width: "52px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						borderRadius: "0.75rem",
						backgroundColor: "#25D366",
						color: "#fff",
						transition: "opacity 0.2s",
					}}
					aria-label="واتساب"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
					</svg>
				</a>

				{/* Add to cart — fills remaining width */}
				<button
					onClick={handleAdd}
					aria-label={added ? "تمت الإضافة" : "أضيفي للسلة"}
					style={{
						flex: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "0.5rem",
						borderRadius: "0.75rem",
						fontFamily: "var(--font-cairo, Cairo, sans-serif)",
						fontWeight: 700,
						fontSize: "0.9375rem",
						color: "#fff",
						backgroundColor: added ? "var(--c-trust)" : "var(--c-brand)",
						transition: "background-color 0.2s",
						border: "none",
						cursor: "pointer",
					}}
				>
					{added ? (
						<>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
								<polyline points="20 6 9 17 4 12" />
							</svg>
							تمت الإضافة
						</>
					) : (
						<>
							<ShoppingCart size={16} />
							أضيفي للسلة
						</>
					)}
				</button>
			</div>
		</div>
	);
}
