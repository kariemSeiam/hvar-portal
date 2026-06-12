import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { addToCart } from "../../stores/cart";
import type { ProductDetail } from "../../lib/api";
import { getWarrantyText, isColorVariant, getColorHex } from "../../lib/enrichment";

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

	const warrantyText = getWarrantyText(product.sku);

	const allAreColors =
		hasVariations && product.variations.every((v) => isColorVariant(v.name));

	function handleAdd() {
		if (outOfStock) return;
		for (let i = 0; i < qty; i++) {
			addToCart({
				productId: product.id,
				variationId: selectedVariationId,
				slug: product.slug,
				sku: product.sku,
				name: product.name,
				image: product.image,
				price,
			});
		}
		setAdded(true);
		setTimeout(() => setAdded(false), 2000);
	}

	const WA_NUMBER = "201204444196";
	const waInquiry = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`مرحبا، أريد الاستفسار عن: ${product.name}`)}`;
	const waNotify = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`مرحبا، أريد معرفة متى يتوفر: ${product.name}`)}`;

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
					{allAreColors ? (
						<>
							<p
								className="text-sm font-cairo font-semibold mb-2"
								style={{ color: "var(--c-ink)" }}
							>
								اللون:{" "}
								<span style={{ color: "var(--c-flame)" }}>
									{selectedVariation?.name ?? ""}
								</span>
							</p>
							<div className="flex flex-wrap gap-2">
								{product.variations.map((v) => {
									const hex = getColorHex(v.name);
									const isSelected = v.id === selectedVariationId;
									const isUnavail = v.stock === 0;
									return (
										<button
											key={v.id}
											onClick={() => {
												setSelectedVariationId(v.id);
												setQty(1);
											}}
											disabled={isUnavail}
											title={v.name}
											aria-label={v.name}
											className="relative w-11 h-11 rounded-full transition-all"
											style={{
												/* 44px touch target; the visible swatch stays a 36px circle */
												backgroundColor: hex,
												padding: 4,
												backgroundClip: "content-box",
												outline: isSelected
													? "3px solid var(--c-brand)"
													: "2px solid var(--c-border)",
												outlineOffset: isSelected ? "0px" : "-2px",
												opacity: isUnavail ? 0.35 : 1,
												cursor: isUnavail ? "not-allowed" : "pointer",
											}}
										>
											{isUnavail && (
												<svg
													className="absolute inset-0 w-full h-full"
													viewBox="0 0 36 36"
													style={{ color: "rgba(0,0,0,0.3)" }}
												>
													<line
														x1="6"
														y1="6"
														x2="30"
														y2="30"
														stroke="currentColor"
														strokeWidth="2"
													/>
												</svg>
											)}
										</button>
									);
								})}
							</div>
						</>
					) : (
						<>
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
						</>
					)}
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

			{/* Price block */}
			<div className="flex items-baseline gap-3 flex-wrap">
				<span
					className="font-inter font-black tabular-nums"
					style={{
						fontSize: "clamp(1.75rem,5vw,2.25rem)",
						color: "var(--c-brand)",
						lineHeight: "1",
					}}
				>
					{price.toLocaleString("ar-EG")}
					<span className="font-cairo text-sm ms-1">ج.م</span>
				</span>
				{product.comparePrice && product.comparePrice > price && (
					<div className="flex items-center gap-2">
						<span
							className="font-inter text-base line-through tabular-nums"
							style={{ color: "var(--c-ink-faint)" }}
						>
							{product.comparePrice.toLocaleString("ar-EG")}
						</span>
						<span
							className="text-xs font-inter font-bold px-1.5 py-0.5 rounded-md"
							style={{ background: "var(--c-brand)", color: "#fff" }}
						>
							-{Math.round(((product.comparePrice - price) / product.comparePrice) * 100)}%
						</span>
					</div>
				)}
			</div>

			{/* Installment hint */}
			{showInstallment && (
				<p className="text-xs font-cairo" style={{ color: "var(--c-flame)" }}>
					أقساط تبدأ من{" "}
					<span className="font-bold">
						{Math.round(price / 12).toLocaleString("ar-EG")} ج.م/شهر
					</span>{" "}
					مع ValU · Souhoola · Aman
				</p>
			)}

			{/* CTA block — in stock */}
			{!outOfStock && (
				<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

					{/* Qty stepper */}
					<div className="flex items-center justify-between">
						<span
							className="text-sm font-cairo font-semibold"
							style={{ color: "var(--c-ink-secondary)" }}
						>
							الكمية
						</span>
						<div
							className="flex items-center rounded-xl overflow-hidden"
							style={{ border: "1px solid var(--c-border)" }}
							role="group"
							aria-label="الكمية"
						>
							<button
								onClick={() => setQty((q) => Math.max(1, q - 1))}
								disabled={qty <= 1}
								className="w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-30"
								style={{ color: "var(--c-ink-muted)" }}
								aria-label="تقليل الكمية"
							>
								<Minus size={14} />
							</button>
							<span
								className="w-9 text-center font-inter font-bold text-sm tabular-nums"
								style={{ color: "var(--c-ink)" }}
								aria-live="polite"
							>
								{qty}
							</span>
							<button
								onClick={() => setQty((q) => Math.min(stock, q + 1))}
								disabled={qty >= stock}
								className="w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-30"
								style={{ color: "var(--c-ink-muted)" }}
								aria-label="زيادة الكمية"
							>
								<Plus size={14} />
							</button>
						</div>
					</div>

					{/* Unified CTA row — WA tile + add-to-cart tile */}
					<div
						style={{
							display: "flex",
							borderRadius: "14px",
							overflow: "hidden",
							height: "62px",
							boxShadow: "0 4px 24px rgba(var(--c-brand-rgb), 0.20)",
						}}
					>
						{/* WhatsApp tile — compact, icon + label */}
						<a
							href={waInquiry}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="تحدث مع خبيرنا عبر واتساب"
							style={{
								width: "56px",
								flexShrink: 0,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								gap: "3px",
								background: "#25D366",
								color: "#fff",
								textDecoration: "none",
								fontSize: "10px",
								fontWeight: 700,
								fontFamily: "Cairo, sans-serif",
								letterSpacing: "0.02em",
								borderInlineEnd: "1.5px solid rgba(255,255,255,0.15)",
							}}
						>
							<svg
								width="22"
								height="22"
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
							</svg>
							<span>واتساب</span>
						</a>

						{/* Add-to-cart tile — flex 1, ember gradient */}
						<button
							onClick={handleAdd}
							aria-label={added ? "تمت الإضافة للسلة" : "أضيفي للسلة"}
							aria-live="polite"
							style={{
								flex: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								paddingInline: "1.25rem",
								background: added
									? "var(--c-trust)"
									: "linear-gradient(to left, var(--c-brand), var(--c-brand-warm))",
								color: "#fff",
								border: "none",
								cursor: "pointer",
								fontFamily: "Cairo, sans-serif",
								transition: "background 0.3s ease",
								position: "relative",
								overflow: "hidden",
							}}
						>
							{/* Grain overlay */}
							<span
								aria-hidden="true"
								style={{
									position: "absolute",
									inset: 0,
									backgroundImage:
										"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
									opacity: 0.045,
									mixBlendMode: "overlay",
									pointerEvents: "none",
								}}
							/>

							{added ? (
								<span
									style={{
										flex: 1,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										gap: "8px",
										position: "relative",
									}}
								>
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
									تمت الإضافة للسلة
								</span>
							) : (
								<>
									<span
										style={{
											fontSize: "1rem",
											fontWeight: 800,
											letterSpacing: "-0.01em",
											position: "relative",
										}}
									>
										أضيفي للسلة
									</span>
									<span
										style={{
											display: "flex",
											alignItems: "baseline",
											gap: "3px",
											fontFamily: "Inter, sans-serif",
											fontWeight: 700,
											fontSize: "0.9rem",
											opacity: 0.92,
											position: "relative",
										}}
									>
										<span className="tabular-nums">
											{(price * qty).toLocaleString("ar-EG")}
										</span>
										<span style={{ fontFamily: "Cairo, sans-serif", fontSize: "0.7rem" }}>
											ج.م
										</span>
									</span>
								</>
							)}
						</button>
					</div>
				</div>
			)}

			{/* CTA block — out of stock */}
			{outOfStock && (
				<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

					{/* Disabled state — honest, not alarming */}
					<div
						style={{
							width: "100%",
							height: "62px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "10px",
							borderRadius: "14px",
							border: "1.5px dashed var(--c-border-strong)",
							backgroundColor: "var(--c-surface-2)",
							color: "var(--c-ink-muted)",
							fontFamily: "Cairo, sans-serif",
							fontWeight: 700,
							fontSize: "0.9375rem",
							cursor: "not-allowed",
							userSelect: "none",
						}}
						aria-disabled="true"
						role="button"
					>
						<svg
							width="17"
							height="17"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.75"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
						</svg>
						غير متاح حالياً
					</div>

					{/* WA notify — more prominent card */}
					<a
						href={waNotify}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="أخبرني عند التوفر عبر واتساب"
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							height: "52px",
							paddingInline: "18px",
							borderRadius: "14px",
							border: "1px solid rgba(37,211,102,0.22)",
							backgroundColor: "rgba(37,211,102,0.07)",
							textDecoration: "none",
							transition: "background-color 0.2s",
							cursor: "pointer",
						}}
					>
						<span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="#25D366"
								aria-hidden="true"
							>
								<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
							</svg>
							<span
								style={{
									fontFamily: "Cairo, sans-serif",
									fontWeight: 700,
									fontSize: "0.9rem",
									color: "#25D366",
								}}
							>
								أخبرني فور توفره عبر واتساب
							</span>
						</span>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#25D366"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							style={{ opacity: 0.55, flexShrink: 0 }}
						>
							<path d="M15 18l-6-6 6-6" />
						</svg>
					</a>
				</div>
			)}

			{/* P9 Trust line */}
			<div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 pt-1">
				<span
					className="flex items-center gap-1.5 text-xs font-cairo"
					style={{ color: "var(--c-ink-muted)" }}
				>
					<svg
						width="13"
						height="13"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						<polyline points="9 12 11 14 15 10" />
					</svg>
					{warrantyText}
				</span>
				<span
					className="text-xs opacity-25"
					style={{ color: "var(--c-ink-muted)" }}
					aria-hidden="true"
				>
					·
				</span>
				<span
					className="flex items-center gap-1.5 text-xs font-cairo"
					style={{ color: "var(--c-ink-muted)" }}
				>
					<svg
						width="13"
						height="13"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<rect x="1" y="3" width="15" height="13" rx="1" />
						<path d="M16 8h4l3 5v3h-7V8z" />
						<circle cx="5.5" cy="18.5" r="2.5" />
						<circle cx="18.5" cy="18.5" r="2.5" />
					</svg>
					شحن مجاني
				</span>
				<span
					className="text-xs opacity-25"
					style={{ color: "var(--c-ink-muted)" }}
					aria-hidden="true"
				>
					·
				</span>
				<span
					className="flex items-center gap-1.5 text-xs font-cairo"
					style={{ color: "var(--c-ink-muted)" }}
				>
					<svg
						width="13"
						height="13"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<rect x="2" y="5" width="20" height="14" rx="2" />
						<line x1="2" y1="10" x2="22" y2="10" />
					</svg>
					ادفع لما يوصل
				</span>
			</div>
		</div>
	);
}
