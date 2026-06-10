import { useState, useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import {
	cartItems,
	cartTotal,
	updateQuantity,
	removeFromCart,
} from "../../stores/cart";
import { getEnrichment } from "../../lib/enrichment";

// ─── Arabic-Indic display ─────────────────────────────────────────────────────
function ar(n: number): string {
	return String(Math.round(n)).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}

function arMoney(n: number): string {
	return n.toLocaleString("ar-EG");
}

// ─── Smooth count-up hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 750): number {
	const [display, setDisplay] = useState(target);
	const prevRef = useRef(target);
	const rafRef = useRef<number>(0);

	useEffect(() => {
		const start = prevRef.current;
		if (start === target) return;
		const diff = target - start;
		const t0 = performance.now();

		const tick = (now: number) => {
			const t = Math.min((now - t0) / duration, 1);
			const eased = 1 - Math.pow(1 - t, 3);
			setDisplay(Math.round(start + diff * eased));
			if (t < 1) rafRef.current = requestAnimationFrame(tick);
			else prevRef.current = target;
		};

		cancelAnimationFrame(rafRef.current);
		rafRef.current = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafRef.current);
	}, [target, duration]);

	return display;
}

// ─── Power tier ───────────────────────────────────────────────────────────────
function getPowerTier(watts: number): { label: string; sub: string } | null {
	if (watts >= 4200) return { label: "ترسانة هفار كاملة", sub: "مطبخك معاه كل حاجة" };
	if (watts >= 2200) return { label: "مطبخ في المستوى ده", sub: "اختيار المحترفين" };
	if (watts >= 2000) return { label: "قوة البلدوزر", sub: "أقوى كبة في مصر" };
	if (watts >= 800)  return { label: "مطبخك بيتحرك", sub: "زيد من القوة" };
	return { label: "أول خطوة", sub: "مطبخك بيكمل" };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CartView() {
	const items = useStore(cartItems);
	const total = useStore(cartTotal);

	// Wattage total — sum enrichment data across all items
	const rawWatts = items.reduce((sum, item) => {
		const e = item.sku ? getEnrichment(item.sku) : null;
		return sum + (e?.wattage ?? 0) * item.quantity;
	}, 0);

	const animatedWatts = useCountUp(rawWatts);
	const animatedTotal = useCountUp(total, 500);
	const tier = rawWatts > 0 ? getPowerTier(rawWatts) : null;

	const installmentMonthly = total >= 1000 ? Math.round(total / 12) : null;

	// ─── Empty state ──────────────────────────────────────────────────────────
	if (items.length === 0) {
		return (
			<div
				className="relative flex flex-col items-center justify-center text-center px-4 overflow-hidden"
				style={{ background: "var(--c-bg)", minHeight: "calc(100vh - 56px)" }}
			>
				{/* Ember mesh — soft warmth behind the ghost zero */}
				<div
					className="absolute inset-0 pointer-events-none"
					aria-hidden="true"
					style={{
						background:
							"radial-gradient(ellipse 60% 45% at 50% 38%, rgba(var(--c-brand-rgb),0.07) 0%, transparent 70%)",
					}}
				/>

				{/* Ghosted empty bag */}
				<svg
					className="relative select-none pointer-events-none"
					aria-hidden="true"
					width="clamp(120px,22vw,200px)"
					height="clamp(120px,22vw,200px)"
					viewBox="0 0 24 24"
					fill="none"
					stroke="var(--c-brand)"
					strokeWidth={0.9}
					strokeLinecap="round"
					strokeLinejoin="round"
					style={{ opacity: 0.14, width: "clamp(120px,22vw,200px)", height: "auto" }}
				>
					<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
					<line x1="3" y1="6" x2="21" y2="6" />
					<path d="M16 10a4 4 0 0 1-8 0" />
				</svg>

				<p
					className="relative font-cairo font-black text-2xl sm:text-3xl mt-6"
					style={{ color: "var(--c-ink)" }}
				>
					مطبخك يستاهل أكتر
				</p>
				<p
					className="relative font-cairo text-sm mt-2 mb-10"
					style={{ color: "var(--c-ink-muted)" }}
				>
					السلة فاضية — البلدوزر بيستنّاك
				</p>

				<a
					href="/products"
					className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-cairo font-bold text-base text-white"
					style={{
						background: "var(--c-brand)",
						transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
					}}
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLAnchorElement).style.background = "var(--c-brand-hover)";
						(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLAnchorElement).style.background = "var(--c-brand)";
						(e.currentTarget as HTMLAnchorElement).style.transform = "";
					}}
				>
					شوف القوة
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</a>
			</div>
		);
	}

	// ─── Filled state ─────────────────────────────────────────────────────────
	return (
		<div style={{ minHeight: "calc(100vh - 56px)" }}>

			{/* ── Power Header ─────────────────────────────────────────────── */}
			<div
				className="relative overflow-hidden"
				style={{ background: "#130F0C" }}
			>
				{/* Ember glow */}
				<div
					className="absolute inset-0 pointer-events-none"
					style={{
						background:
							"radial-gradient(ellipse 70% 120% at 15% 50%, rgba(var(--c-brand-rgb),0.13) 0%, transparent 70%)",
					}}
				/>
				{/* Grain */}
				<div
					className="absolute inset-0 pointer-events-none"
					style={{
						opacity: 0.05,
						mixBlendMode: "overlay",
						backgroundImage:
							"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
					}}
				/>

				<div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
					<div className="flex items-end justify-between gap-4">

						{/* Left: wattage + labels */}
						<div>
							<p
								className="font-cairo text-xs mb-2"
								style={{ color: "rgba(245,239,230,0.35)", letterSpacing: "0.06em" }}
							>
								سلتك
							</p>

							{/* The number — wattage when available, otherwise EGP total */}
							<div className="flex items-baseline gap-2">
								<span
									className="font-cairo font-black leading-none tabular-nums"
									style={{
										fontSize: "clamp(3rem,10vw,5.5rem)",
										color: "var(--c-brand)",
										letterSpacing: "-0.03em",
									}}
								>
									{rawWatts > 0 ? ar(animatedWatts) : arMoney(animatedTotal)}
								</span>
								<span
									className="font-cairo font-bold text-lg"
									style={{ color: "var(--c-brand)", opacity: 0.7 }}
								>
									{rawWatts > 0 ? "وات" : "ج.م"}
								</span>
							</div>

							{/* Tier label (wattage mode) or brand promise (price mode) */}
							{tier ? (
								<div className="mt-2 flex items-center gap-2">
									<span className="font-cairo font-bold text-sm" style={{ color: "var(--c-brass)" }}>
										{tier.label}
									</span>
									<span className="font-cairo text-xs" style={{ color: "rgba(245,239,230,0.30)" }}>·</span>
									<span className="font-cairo text-xs" style={{ color: "rgba(245,239,230,0.30)" }}>
										{tier.sub}
									</span>
								</div>
							) : (
								<p className="font-cairo text-sm mt-2" style={{ color: "rgba(245,239,230,0.35)" }}>
									بيتك دايما جاهز مع هفار
								</p>
							)}
						</div>

						{/* Right: decorative wattage ghost (desktop only) */}
						{rawWatts > 0 && (
							<p
								className="hidden sm:block font-cairo font-black select-none pointer-events-none leading-none flex-shrink-0"
								style={{
									fontSize: "clamp(4rem,12vw,8rem)",
									color: "var(--c-brand)",
									opacity: 0.06,
									letterSpacing: "-0.04em",
								}}
							>
								{ar(rawWatts)}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* ── Content ───────────────────────────────────────────────────── */}
			<div
				className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
				style={{ color: "var(--c-ink)" }}
			>
				<div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">

					{/* ── Items list ─────────────────────────────────────────── */}
					<div className="space-y-2">
						{items.map((item) => {
							const e = item.sku ? getEnrichment(item.sku) : null;
							const wattDisplay = e?.wattageDisplay ?? (e?.wattage ? `${ar(e.wattage)} وات` : null);

							return (
								<div
									key={item.variationId}
									className="group flex gap-4 p-4 rounded-2xl transition-all"
									style={{
										background: "var(--c-surface)",
										border: "1px solid var(--c-border)",
										transition: "border-color 0.2s ease",
									}}
									onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--c-ink-faint)")}
									onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--c-border)")}
								>
									{/* Image */}
									<a
										href={`/products/${item.slug}`}
										className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden"
										style={{ background: "var(--c-surface-2)" }}
									>
										{item.image ? (
											<img
												src={item.image}
												alt={item.name}
												className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--c-ink-faint)" }}>
													<rect x="3" y="3" width="18" height="18" rx="3" />
													<circle cx="8.5" cy="8.5" r="1.5" />
													<polyline points="21 15 16 10 5 21" />
												</svg>
											</div>
										)}
									</a>

									{/* Info */}
									<div className="flex-1 min-w-0">
										{/* Name */}
										<a
											href={`/products/${item.slug}`}
											className="font-cairo font-semibold text-sm leading-snug line-clamp-2 transition-colors"
											style={{ color: "var(--c-ink)" }}
											onMouseEnter={(e) => (e.currentTarget.style.color = "var(--c-brand)")}
											onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-ink)")}
										>
											{item.name}
										</a>

										{/* Wattage badge */}
										{wattDisplay && (
											<span
												className="inline-block font-cairo font-bold text-[10px] px-1.5 py-0.5 rounded mt-1"
												style={{
													color: "var(--c-brass)",
													background: "rgba(var(--c-brass-rgb),0.1)",
												}}
											>
												{wattDisplay}
											</span>
										)}

										{/* Unit price */}
										<p
											className="font-inter font-bold text-sm mt-1.5"
											style={{ color: "var(--c-brand)" }}
										>
											{arMoney(item.price)} ج.م
										</p>

										{/* Qty + remove row */}
										<div className="flex items-center justify-between mt-3">
											{/* Qty controls */}
											<div
												className="flex items-center rounded-lg overflow-hidden"
												style={{ border: "1px solid var(--c-border)" }}
											>
												<button
													onClick={() => updateQuantity(item.variationId, item.quantity - 1)}
													className="w-11 h-11 flex items-center justify-center transition-colors"
													style={{ color: "var(--c-ink-muted)" }}
													onMouseEnter={(e) => (e.currentTarget.style.background = "var(--c-surface-2)")}
													onMouseLeave={(e) => (e.currentTarget.style.background = "")}
													aria-label="تقليل"
												>
													<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
														<path d="M2 6h8" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
													</svg>
												</button>
												<span
													className="w-9 text-center font-inter font-bold text-sm"
													style={{ color: "var(--c-ink)" }}
												>
													{item.quantity}
												</span>
												<button
													onClick={() => updateQuantity(item.variationId, item.quantity + 1)}
													className="w-11 h-11 flex items-center justify-center transition-colors"
													style={{ color: "var(--c-ink-muted)" }}
													onMouseEnter={(e) => (e.currentTarget.style.background = "var(--c-surface-2)")}
													onMouseLeave={(e) => (e.currentTarget.style.background = "")}
													aria-label="زيادة"
												>
													<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
														<path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
													</svg>
												</button>
											</div>

											{/* Remove */}
											<button
												onClick={() => removeFromCart(item.variationId)}
												className="flex items-center gap-1 font-cairo text-xs transition-colors"
												style={{ color: "var(--c-ink-muted)" }}
												onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
												onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-ink-muted)")}
											>
												<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
													<polyline points="3 6 5 6 21 6" />
													<path d="M19 6l-1 14H6L5 6" />
													<path d="M10 11v6M14 11v6" />
													<path d="M9 6V4h6v2" />
												</svg>
												حذف
											</button>
										</div>
									</div>

									{/* Line total */}
									<div className="flex-shrink-0 text-end self-start pt-1">
										<p className="font-inter font-black text-sm" style={{ color: "var(--c-ink)" }}>
											{arMoney(item.price * item.quantity)} ج.م
										</p>
									</div>
								</div>
							);
						})}
					</div>

					{/* ── Summary ────────────────────────────────────────────── */}
					<div className="lg:sticky lg:top-20">
						<div
							className="rounded-2xl overflow-hidden"
							style={{ border: "1px solid var(--c-border)" }}
						>
							{/* Summary header */}
							<div className="px-5 py-4" style={{ background: "var(--c-surface)", borderBottom: "1px solid var(--c-border)" }}>
								<p className="font-cairo font-bold text-sm" style={{ color: "var(--c-ink)" }}>
									ملخص الطلب
								</p>
							</div>

							<div className="px-5 py-4 space-y-3" style={{ background: "var(--c-surface)" }}>
								{/* Subtotal */}
								<div className="flex items-center justify-between">
									<span className="font-cairo text-sm" style={{ color: "var(--c-ink-muted)" }}>
										المنتجات
									</span>
									<span className="font-inter font-semibold text-sm" style={{ color: "var(--c-ink)" }}>
										{arMoney(total)} ج.م
									</span>
								</div>

								{/* Shipping */}
								<div className="flex items-center justify-between">
									<span className="font-cairo text-sm" style={{ color: "var(--c-ink-muted)" }}>
										الشحن
									</span>
									<span className="font-cairo font-semibold text-sm" style={{ color: "#22c55e" }}>
										مجاني
									</span>
								</div>

								{/* Divider */}
								<div style={{ borderTop: "1px solid var(--c-border)" }} />

								{/* Total */}
								<div className="flex items-baseline justify-between pt-1">
									<span className="font-cairo font-bold" style={{ color: "var(--c-ink)" }}>
										الإجمالي
									</span>
									<span
										className="font-inter font-black tabular-nums"
										style={{
											fontSize: "clamp(1.5rem,4vw,2rem)",
											color: "var(--c-brand)",
											letterSpacing: "-0.02em",
										}}
									>
										{arMoney(animatedTotal)} ج.م
									</span>
								</div>

								{/* Installment hint */}
								{installmentMonthly && (
									<p className="font-cairo text-[11px] text-end" style={{ color: "var(--c-brass)" }}>
										أو ~ {arMoney(installmentMonthly)} ج.م/شهر مع فاليو · سهولة · أمان
									</p>
								)}
							</div>

							{/* CTA */}
							<div className="px-5 pb-5 pt-1 space-y-2.5" style={{ background: "var(--c-surface)" }}>
								<a
									href="/checkout"
									className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-cairo font-bold text-base text-white transition-all"
									style={{
										background: "var(--c-brand)",
										transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLAnchorElement).style.background = "var(--c-brand-hover)";
										(e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 24px rgba(var(--c-brand-rgb),0.32)";
										(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLAnchorElement).style.background = "var(--c-brand)";
										(e.currentTarget as HTMLAnchorElement).style.boxShadow = "";
										(e.currentTarget as HTMLAnchorElement).style.transform = "";
									}}
								>
									إتمام الشراء
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
										<path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</a>

								<a
									href="/products"
									className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-cairo font-semibold text-sm transition-all"
									style={{
										border: "1px solid var(--c-border)",
										color: "var(--c-ink-muted)",
										transition: "all 0.2s ease",
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--c-brand)";
										(e.currentTarget as HTMLAnchorElement).style.color = "var(--c-brand)";
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--c-border)";
										(e.currentTarget as HTMLAnchorElement).style.color = "var(--c-ink-muted)";
									}}
								>
									متابعة التسوق
								</a>
							</div>
						</div>

						{/* Trust row */}
						<div className="mt-4 grid grid-cols-3 gap-2">
							{[
								{
									svg: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
									text: "ضمان أصلي",
								},
								{
									svg: <><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></>,
									text: "شحن مجاني",
								},
								{
									svg: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
									text: "ادفع لما يوصل",
								},
							].map((t, i) => (
								<div
									key={i}
									className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-center"
									style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)" }}
								>
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth={1.5}
										strokeLinecap="round"
										strokeLinejoin="round"
										style={{ color: "var(--c-brand)" }}
									>
										{t.svg}
									</svg>
									<span className="font-cairo font-semibold text-[10px]" style={{ color: "var(--c-ink-muted)" }}>
										{t.text}
									</span>
								</div>
							))}
						</div>
					</div>

				</div>
			</div>
		</div>
	);
}
