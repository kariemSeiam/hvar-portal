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

function ApplianceIcon({ name, style }: { name: string; style?: React.CSSProperties }) {
	const n = name.toLowerCase();
	const base = { width: "100%", height: "100%", ...style };
	const s = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, style: base };

	if (n.includes("مكو") || n.includes("كوي"))
		return <svg {...s}><path d="M3 16.5c0 1.5 1.5 2.5 4 2.5h10c2.5 0 4-1 4-2.5V14c0-1.5-1-2.5-2.5-2.5H7L5 9H3v7.5Z"/><line x1="12" y1="5" x2="12" y2="9"/><circle cx="12" cy="4" r="1"/><line x1="9" y1="15" x2="9" y2="15.5"/><line x1="12" y1="15" x2="12" y2="15.5"/><line x1="15" y1="15" x2="15" y2="15.5"/></svg>;

	if (n.includes("هاند") || n.includes("بلندر"))
		return <svg {...s}><rect x="12.2" y="1.6" width="5" height="9" rx="2.2" transform="rotate(18 14.7 6.1)"/><path d="M11.6 10.5 9.2 16"/><path d="M6.8 15.4l4.9 1.6-1 3a3 3 0 0 1-3.8 1.9A3 3 0 0 1 5 18.2l1-2.8Z" transform="rotate(4 9 18)"/></svg>;

	if (n.includes("كبة") || n.includes("كبه"))
		return <svg {...s}><path d="M5 10h14l-1 7a3 3 0 0 1-3 2.6H9A3 3 0 0 1 6 17l-1-7Z"/><path d="M7 10a5 5 0 0 1 10 0"/><rect x="10" y="2.5" width="4" height="3" rx="1"/><line x1="12" y1="5.5" x2="12" y2="7.5"/></svg>;

	if (n.includes("عجان"))
		return <svg {...s}><path d="M4 21h16"/><path d="M6 21V8a2.5 2.5 0 0 1 2.5-2.5H17a2.5 2.5 0 0 1 0 5h-3"/><line x1="13" y1="10.5" x2="13" y2="13"/><path d="M9.5 13h7l-.8 5a2.5 2.5 0 0 1-2.5 2h-.4a2.5 2.5 0 0 1-2.5-2l-.8-5Z"/></svg>;

	if (n.includes("مضرب"))
		return <svg {...s}><path d="M5 4h11a3 3 0 0 1 3 3v1.5a2.5 2.5 0 0 1-2.5 2.5H5a1.5 1.5 0 0 1-1.5-1.5V5.5A1.5 1.5 0 0 1 5 4Z"/><line x1="9" y1="11" x2="9" y2="14"/><line x1="14" y1="11" x2="14" y2="14"/><path d="M9 14c-1.6 0-2.4 1.7-2.4 3.2S7.4 20.5 9 20.5s2.4-1.8 2.4-3.3S10.6 14 9 14Z"/><path d="M14 14c-1.6 0-2.4 1.7-2.4 3.2s.8 3.3 2.4 3.3 2.4-1.8 2.4-3.3S15.6 14 14 14Z"/></svg>;

	if (n.includes("مطحن") || n.includes("توابل"))
		return <svg {...s}><path d="M7 9h10v8a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V9Z"/><path d="M7.5 9a4.5 4.5 0 0 1 9 0"/><circle cx="10.5" cy="14" r="0.6"/><circle cx="13.5" cy="15.5" r="0.6"/><circle cx="12" cy="17" r="0.6"/></svg>;

	if (n.includes("خلا") || n.includes("عصا"))
		return <svg {...s}><path d="M7 4h10l-2 10H9L7 4Z"/><path d="M9 14v4h6v-4"/><line x1="8" y1="18" x2="16" y2="18"/><line x1="12" y1="18" x2="12" y2="22"/></svg>;

	if (n.includes("فرن") || n.includes("ميكر"))
		return <svg {...s}><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="6" y="9" width="12" height="9" rx="1"/><circle cx="8" cy="6" r="1"/><circle cx="12" cy="6" r="1"/><circle cx="16" cy="6" r="1"/></svg>;

	if (n.includes("مكنس"))
		return <svg {...s}><circle cx="8" cy="16" r="4"/><path d="M12 16h4a4 4 0 0 0 0-8H8"/><line x1="8" y1="8" x2="8" y2="12"/></svg>;

	if (n.includes("قلاي") || n.includes("هواء"))
		return <svg {...s}><path d="M7 4h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><circle cx="12" cy="12" r="3"/><path d="M12 6v1m0 8v1M6 12h1m8 0h1"/><line x1="9" y1="3" x2="15" y2="3"/></svg>;

	if (n.includes("كاتيل") || n.includes("سخان") || n.includes("غلاي"))
		return <svg {...s}><path d="M6 8h12l-1.5 9A2 2 0 0 1 14.5 19h-5a2 2 0 0 1-2-1.8L6 8Z"/><path d="M18 8c1.5 0 3 .5 3 2s-1.5 2-3 2"/><line x1="7" y1="5" x2="17" y2="5"/><line x1="12" y1="3" x2="12" y2="5"/></svg>;

	return <svg {...s}><path d="M13 2L4.5 13H11l-1 9L21 11H14l1-9Z"/></svg>;
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
					<div key={i} className="rounded-2xl overflow-hidden shimmer-skel" style={{ backgroundColor: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
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
						background: "radial-gradient(ellipse 55% 50% at 50% 40%, rgba(var(--c-brand-rgb),0.06) 0%, transparent 70%)",
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
							style={{ background: p.image ? "linear-gradient(160deg,#ffffff 0%,#faf6f0 100%)" : "var(--c-surface-2)" }}
							aria-label={p.name}
						>
							{p.image ? (
								<img src={p.image} alt={p.name} className="w-full h-full object-contain p-4" loading="lazy" />
							) : (
								<span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
									<span style={{ width: "45%", height: "45%", color: "var(--c-brand)", opacity: 0.30 }}>
										<ApplianceIcon name={p.name} />
									</span>
								</span>
							)}
						</a>

						{/* Remove */}
						<button
							type="button"
							onClick={() => toggleWishlist(p.id)}
							aria-label={`إزالة ${p.name} من المفضلة`}
							className="absolute top-2 end-2 flex items-center justify-center w-11 h-11 rounded-full transition-colors"
							style={{
								backgroundColor: "color-mix(in srgb, var(--c-surface) 85%, transparent)",
								border: "1px solid var(--c-border)",
								color: "var(--c-brand)",
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
										className="flex items-center justify-center w-11 h-11 rounded-full text-white transition-transform active:scale-90"
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
