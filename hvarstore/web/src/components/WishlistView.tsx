import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { wishlistIds, toggleWishlist } from "../stores/wishlist";
import { addToCart } from "../stores/cart";
import { getEnrichment, getWarrantyText } from "../lib/enrichment";

const API = import.meta.env?.PUBLIC_API_URL ?? "http://localhost:5000";

interface Product {
	id: number;
	slug: string;
	name: string;
	sku: string;
	image: string | null;
	variationId: number;
	price: number;
	stock: number;
}

export default function WishlistView() {
	const ids = useStore(wishlistIds);
	const [products, setProducts] = useState<Product[] | null>(null);
	const [addedId, setAddedId] = useState<number | null>(null);

	useEffect(() => {
		fetch(`${API}/api/products?limit=40`)
			.then((r) => r.json())
			.then((d) => setProducts(d.items ?? []))
			.catch(() => setProducts([]));
	}, []);

	const items = products?.filter((p) => ids.includes(p.id)) ?? null;

	// ── Loading skeleton ─────────────────────────────────────────────────────
	if (items === null) {
		return (
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-2xl bg-surface border border-hvar overflow-hidden shimmer-skel">
						<div className="aspect-square" style={{ backgroundColor: "var(--c-border)" }} />
						<div className="p-4 space-y-3">
							<div className="h-3 w-3/4 rounded-full" style={{ backgroundColor: "var(--c-border)" }} />
							<div className="h-3 w-1/2 rounded-full" style={{ backgroundColor: "var(--c-border)" }} />
						</div>
					</div>
				))}
			</div>
		);
	}

	// ── Empty state ──────────────────────────────────────────────────────────
	if (items.length === 0) {
		return (
			<div className="relative flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden">
				<div
					className="absolute inset-0 pointer-events-none"
					aria-hidden="true"
					style={{
						background:
							"radial-gradient(ellipse 55% 50% at 50% 40%, rgba(var(--c-brand-rgb),0.06) 0%, transparent 70%)",
					}}
				/>
				<Heart
					className="relative select-none"
					strokeWidth={0.9}
					style={{ width: "clamp(96px,18vw,150px)", height: "auto", color: "var(--c-brand)", opacity: 0.16 }}
					aria-hidden="true"
				/>
				<p className="relative font-cairo font-black text-xl sm:text-2xl mt-5" style={{ color: "var(--c-ink)" }}>
					لسه مفيش حاجة في المفضلة
				</p>
				<p className="relative font-cairo text-sm mt-2 mb-8" style={{ color: "var(--c-ink-muted)" }}>
					دوسي على القلب على أي منتج عجبك — هيستناكي هنا
				</p>
				<a
					href="/products"
					className="relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-cairo font-bold text-base text-white"
					style={{ background: "var(--c-brand)", transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
				>
					شوفي المنتجات
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</a>
			</div>
		);
	}

	// ── Grid ─────────────────────────────────────────────────────────────────
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
			{items.map((p) => {
				const e = getEnrichment(p.sku);
				const outOfStock = p.stock === 0;
				return (
					<article
						key={p.id}
						className="relative flex flex-col rounded-2xl overflow-hidden"
						style={{
							backgroundColor: "var(--c-surface)",
							border: "1px solid var(--c-border)",
							boxShadow: "var(--c-shadow-card)",
						}}
					>
						{/* Media */}
						<a
							href={`/products/${p.slug}`}
							className="relative block aspect-square overflow-hidden"
							style={{ backgroundColor: "var(--c-surface-2)" }}
							aria-label={p.name}
						>
							{p.image ? (
								<img src={p.image} alt={p.name} className="w-full h-full object-contain p-4" loading="lazy" />
							) : (
								<span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
									<span
										className="font-cairo font-black select-none"
										style={{ fontSize: "3rem", lineHeight: 1, color: "var(--c-brand)", opacity: 0.16 }}
									>
										هـ
									</span>
								</span>
							)}
						</a>

						{/* Remove */}
						<button
							type="button"
							onClick={() => toggleWishlist(p.id)}
							aria-label={`إزالة ${p.name} من المفضلة`}
							className="absolute top-2.5 end-2.5 flex items-center justify-center w-9 h-9 rounded-full transition-colors"
							style={{
								backgroundColor: "color-mix(in srgb, var(--c-surface) 85%, transparent)",
								border: "1px solid var(--c-border)",
								color: "var(--c-ink-muted)",
								backdropFilter: "blur(4px)",
							}}
						>
							<Trash2 size={14} />
						</button>

						{/* Body */}
						<div className="flex flex-col flex-1 p-3.5">
							{e?.nickname && (
								<span className="font-cairo font-bold text-xs mb-0.5" style={{ color: "var(--c-brass)" }}>
									{e.nickname}
								</span>
							)}
							<a href={`/products/${p.slug}`} className="font-cairo font-semibold text-sm leading-snug line-clamp-2" style={{ color: "var(--c-ink)" }}>
								{p.name}
							</a>

							<div className="flex items-center justify-between mt-auto pt-3">
								<div className="flex items-baseline gap-1">
									<span className="font-inter font-bold text-base" style={{ color: "var(--c-brand)" }}>
										{p.price.toLocaleString("ar-EG")}
									</span>
									<span className="font-cairo text-xs" style={{ color: "var(--c-brand)" }}>ج.م</span>
								</div>

								{!outOfStock ? (
									<button
										type="button"
										onClick={() => {
											addToCart({
												productId: p.id,
												variationId: p.variationId,
												slug: p.slug,
												sku: p.sku,
												name: p.name,
												image: p.image,
												price: p.price,
											});
											setAddedId(p.id);
											setTimeout(() => setAddedId(null), 1400);
										}}
										aria-label={addedId === p.id ? "تمت الإضافة" : `أضيفي ${p.name} للسلة`}
										className="flex items-center justify-center w-9 h-9 rounded-full text-white transition-transform active:scale-90"
										style={{ backgroundColor: addedId === p.id ? "var(--c-trust)" : "var(--c-brand)" }}
									>
										{addedId === p.id ? (
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
										) : (
											<ShoppingCart size={15} />
										)}
									</button>
								) : (
									<span className="font-cairo text-[11px] font-semibold" style={{ color: "var(--c-ink-faint)" }}>
										غير متاح
									</span>
								)}
							</div>

							<p className="font-cairo text-[11px] mt-2" style={{ color: "var(--c-ink-muted)" }}>
								{getWarrantyText(p.sku)} · شحن مجاني
							</p>
						</div>
					</article>
				);
			})}
		</div>
	);
}
