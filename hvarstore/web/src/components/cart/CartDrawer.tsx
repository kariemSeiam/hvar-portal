import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { cartItems, cartTotal, cartCount, updateQuantity, removeFromCart } from "../../stores/cart";
import { cartDrawerOpen } from "../../stores/cartDrawer";
import { getEnrichment } from "../../lib/enrichment";

function ar(n: number): string {
	return String(Math.round(n)).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}
function arMoney(n: number): string {
	return n.toLocaleString("ar-EG");
}

const KEYFRAMES = `
@keyframes drawerSlideIn {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
@keyframes scrimIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;

export default function CartDrawer() {
	const open = useStore(cartDrawerOpen);
	const items = useStore(cartItems);
	const total = useStore(cartTotal);
	const count = useStore(cartCount);

	const installmentMonthly = total >= 1000 ? Math.round(total / 12) : null;

	function close() {
		cartDrawerOpen.set(false);
	}

	/* Lock body scroll while open */
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => { document.body.style.overflow = ""; };
	}, [open]);

	/* Keyboard close */
	useEffect(() => {
		const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, []);

	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

			{/* Scrim */}
			<div
				aria-hidden="true"
				onClick={close}
				style={{
					position: "fixed",
					inset: 0,
					zIndex: 700,
					background: "rgba(10,6,5,0.52)",
					backdropFilter: "blur(3px)",
					WebkitBackdropFilter: "blur(3px)",
					opacity: open ? 1 : 0,
					pointerEvents: open ? "auto" : "none",
					transition: "opacity 0.3s ease",
				}}
			/>

			{/* Drawer — slides from physical right (RTL start) */}
			<aside
				role="dialog"
				aria-modal="true"
				aria-label="سلة التسوق"
				aria-hidden={!open}
				style={{
					position: "fixed",
					top: 0,
					bottom: 0,
					right: 0,
					width: "min(420px, 92vw)",
					background: "var(--c-surface)",
					zIndex: 800,
					transform: open ? "translateX(0)" : "translateX(100%)",
					transition: "transform 0.4s cubic-bezier(0.3,0.8,0.3,1)",
					display: "flex",
					flexDirection: "column",
					boxShadow: "-4px 0 60px rgba(0,0,0,0.22)",
					borderLeft: "1px solid var(--c-border)",
					overflow: "hidden",
				}}
			>
				{/* Grain texture */}
				<div
					aria-hidden="true"
					style={{
						position: "absolute",
						inset: 0,
						pointerEvents: "none",
						opacity: 0.04,
						mixBlendMode: "overlay",
						backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
					}}
				/>

				{/* Ambient ember glow */}
				<div
					aria-hidden="true"
					style={{
						position: "absolute",
						inset: 0,
						pointerEvents: "none",
						background: "radial-gradient(ellipse 80% 40% at 100% 0%, rgba(var(--c-brand-rgb, 212,53,51),0.06) 0%, transparent 60%)",
					}}
				/>

				{/* Header */}
				<div
					style={{
						position: "relative",
						zIndex: 2,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "22px 22px 18px",
						borderBottom: "1px solid var(--c-border)",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
						<h3
							style={{
								fontFamily: "'Cairo', sans-serif",
								fontWeight: 800,
								fontSize: "1.15rem",
								color: "var(--c-ink)",
							}}
						>
							سلّتك
						</h3>
						{count > 0 && (
							<span
								style={{
									fontFamily: "'Inter', sans-serif",
									fontWeight: 700,
									fontSize: "0.78rem",
									color: "var(--c-ink-faint)",
									background: "var(--c-surface-2)",
									border: "1px solid var(--c-border)",
									padding: "2px 8px",
									borderRadius: "99px",
								}}
							>
								{ar(count)}
							</span>
						)}
					</div>
					<button
						onClick={close}
						aria-label="إغلاق السلة"
						style={{
							width: 38,
							height: 38,
							borderRadius: "50%",
							border: "1px solid var(--c-border)",
							background: "var(--c-surface-2)",
							color: "var(--c-ink-muted)",
							display: "grid",
							placeItems: "center",
							cursor: "pointer",
							transition: "border-color 0.2s, color 0.2s",
							flexShrink: 0,
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.borderColor = "var(--c-brand)";
							e.currentTarget.style.color = "var(--c-brand)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.borderColor = "var(--c-border)";
							e.currentTarget.style.color = "var(--c-ink-muted)";
						}}
					>
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
							<path d="M1 1l12 12M13 1L1 13" />
						</svg>
					</button>
				</div>

				{/* Body */}
				<div
					style={{
						position: "relative",
						zIndex: 2,
						flex: 1,
						overflowY: "auto",
						padding: "16px 20px",
					}}
				>
					{items.length === 0 ? (
						/* ── Empty state ── */
						<div
							style={{
								textAlign: "center",
								padding: "50px 20px",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: "12px",
							}}
						>
							<div style={{ fontSize: "3.4rem", opacity: 0.5 }}>🛒</div>
							<h4
								style={{
									fontFamily: "'Cairo', sans-serif",
									fontWeight: 700,
									color: "var(--c-ink-muted)",
									fontSize: "1rem",
								}}
							>
								سلّتك فاضية لسه
							</h4>
							<p
								style={{
									fontFamily: "'Cairo', sans-serif",
									fontSize: "0.84rem",
									color: "var(--c-ink-faint)",
								}}
							>
								اكتشف منتجاتنا وابدأ التسوّق
							</p>
							<a
								href="/products"
								onClick={close}
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: "8px",
									marginTop: "8px",
									padding: "12px 24px",
									borderRadius: "13px",
									background: "var(--c-brand)",
									color: "#fff",
									fontFamily: "'Cairo', sans-serif",
									fontWeight: 700,
									fontSize: "0.92rem",
									textDecoration: "none",
									transition: "background 0.2s",
								}}
							>
								تصفّح المنتجات
								<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
									<path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</a>
						</div>
					) : (
						/* ── Items list ── */
						<div>
							{items.map((item, idx) => {
								const e = item.sku ? getEnrichment(item.sku) : null;
								const lineTotal = item.price * item.quantity;
								const isLast = idx === items.length - 1;
								return (
									<div
										key={item.variationId}
										style={{
											display: "flex",
											gap: "13px",
											padding: "14px 0",
											borderBottom: isLast ? "none" : "1px solid var(--c-border)",
										}}
									>
										{/* Product image */}
										<a
											href={`/products/${item.slug}`}
											onClick={close}
											style={{
												flexShrink: 0,
												width: 64,
												height: 64,
												borderRadius: "14px",
												background: "var(--c-surface-2)",
												display: "grid",
												placeItems: "center",
												overflow: "hidden",
												border: "1px solid var(--c-border)",
											}}
										>
											{item.image ? (
												<img
													src={item.image}
													alt={item.name}
													style={{ width: "100%", height: "100%", objectFit: "cover" }}
												/>
											) : (
												<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--c-ink-faint)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
													<rect x="3" y="3" width="18" height="18" rx="3" />
													<circle cx="8.5" cy="8.5" r="1.5" />
													<polyline points="21 15 16 10 5 21" />
												</svg>
											)}
										</a>

										{/* Info */}
										<div style={{ flex: 1, minWidth: 0 }}>
											<a
												href={`/products/${item.slug}`}
												onClick={close}
												style={{
													fontFamily: "'Cairo', sans-serif",
													fontWeight: 700,
													fontSize: "0.88rem",
													color: "var(--c-ink)",
													lineHeight: 1.4,
													display: "-webkit-box",
													WebkitLineClamp: 2,
													WebkitBoxOrient: "vertical",
													overflow: "hidden",
													textDecoration: "none",
												}}
											>
												{item.name}
											</a>

											{e?.wattageDisplay && (
												<span
													style={{
														display: "inline-block",
														fontFamily: "'Cairo', sans-serif",
														fontWeight: 700,
														fontSize: "0.68rem",
														color: "var(--c-brass, #c8893b)",
														background: "rgba(200,137,59,0.10)",
														padding: "2px 6px",
														borderRadius: "6px",
														marginTop: "3px",
													}}
												>
													{e.wattageDisplay}
												</span>
											)}

											<p
												style={{
													fontFamily: "'Inter', sans-serif",
													fontWeight: 800,
													fontSize: "0.88rem",
													color: "var(--c-brand)",
													marginTop: "5px",
												}}
											>
												{arMoney(item.price)} ج.م
											</p>

											{/* Qty + remove */}
											<div
												style={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
													marginTop: "10px",
												}}
											>
												<div
													style={{
														display: "inline-flex",
														alignItems: "center",
														border: "1px solid var(--c-border)",
														borderRadius: "10px",
														overflow: "hidden",
													}}
												>
													<button
														onClick={() => updateQuantity(item.variationId, item.quantity - 1)}
														aria-label="تقليل"
														style={{
															width: 30,
															height: 30,
															border: "none",
															background: "var(--c-surface-2)",
															color: "var(--c-ink-muted)",
															cursor: "pointer",
															fontSize: "1.05rem",
															fontFamily: "'Inter', sans-serif",
															transition: "background 0.15s, color 0.15s",
															display: "grid",
															placeItems: "center",
														}}
														onMouseEnter={(e) => {
															e.currentTarget.style.background = "var(--c-brand)";
															e.currentTarget.style.color = "#fff";
														}}
														onMouseLeave={(e) => {
															e.currentTarget.style.background = "var(--c-surface-2)";
															e.currentTarget.style.color = "var(--c-ink-muted)";
														}}
													>
														−
													</button>
													<span
														style={{
															minWidth: 32,
															textAlign: "center",
															fontFamily: "'Inter', sans-serif",
															fontWeight: 700,
															fontSize: "0.88rem",
															color: "var(--c-ink)",
														}}
													>
														{item.quantity}
													</span>
													<button
														onClick={() => updateQuantity(item.variationId, item.quantity + 1)}
														aria-label="زيادة"
														style={{
															width: 30,
															height: 30,
															border: "none",
															background: "var(--c-surface-2)",
															color: "var(--c-ink-muted)",
															cursor: "pointer",
															fontSize: "1.05rem",
															fontFamily: "'Inter', sans-serif",
															transition: "background 0.15s, color 0.15s",
															display: "grid",
															placeItems: "center",
														}}
														onMouseEnter={(e) => {
															e.currentTarget.style.background = "var(--c-brand)";
															e.currentTarget.style.color = "#fff";
														}}
														onMouseLeave={(e) => {
															e.currentTarget.style.background = "var(--c-surface-2)";
															e.currentTarget.style.color = "var(--c-ink-muted)";
														}}
													>
														+
													</button>
												</div>
												<button
													onClick={() => removeFromCart(item.variationId)}
													style={{
														background: "none",
														border: "none",
														color: "var(--c-ink-faint)",
														cursor: "pointer",
														fontSize: "0.78rem",
														fontFamily: "'Cairo', sans-serif",
														transition: "color 0.15s",
													}}
													onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; }}
													onMouseLeave={(e) => { e.currentTarget.style.color = "var(--c-ink-faint)"; }}
												>
													حذف
												</button>
											</div>
										</div>

										{/* Line total */}
										<div style={{ flexShrink: 0, textAlign: "end", paddingTop: "2px" }}>
											<p
												style={{
													fontFamily: "'Inter', sans-serif",
													fontWeight: 800,
													fontSize: "0.88rem",
													color: "var(--c-ink)",
												}}
											>
												{arMoney(lineTotal)} ج.م
											</p>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Footer — only when items exist */}
				{items.length > 0 && (
					<div
						style={{
							position: "relative",
							zIndex: 2,
							padding: "18px 22px 22px",
							borderTop: "1px solid var(--c-border)",
							background: "var(--c-surface-2)",
						}}
					>
						{/* Summary rows */}
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: "8px",
								fontSize: "0.9rem",
							}}
						>
							<span style={{ fontFamily: "'Cairo', sans-serif", color: "var(--c-ink-muted)" }}>
								المجموع الفرعي
							</span>
							<span
								style={{
									fontFamily: "'Inter', sans-serif",
									fontWeight: 700,
									color: "var(--c-ink)",
								}}
							>
								{arMoney(total)} ج.م
							</span>
						</div>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: "10px",
								fontSize: "0.9rem",
							}}
						>
							<span style={{ fontFamily: "'Cairo', sans-serif", color: "var(--c-ink-muted)" }}>
								الشحن
							</span>
							<span
								style={{
									fontFamily: "'Cairo', sans-serif",
									fontWeight: 700,
									color: "#22c55e",
								}}
							>
								مجاني
							</span>
						</div>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								paddingTop: "10px",
								marginBottom: installmentMonthly ? "8px" : "16px",
								borderTop: "1px dashed var(--c-border)",
							}}
						>
							<span
								style={{
									fontFamily: "'Cairo', sans-serif",
									fontWeight: 800,
									fontSize: "1.05rem",
									color: "var(--c-ink)",
								}}
							>
								الإجمالي
							</span>
							<span
								style={{
									fontFamily: "'Inter', sans-serif",
									fontWeight: 800,
									fontSize: "1.22rem",
									color: "var(--c-brand)",
									letterSpacing: "-0.02em",
								}}
							>
								{arMoney(total)} ج.م
							</span>
						</div>

						{installmentMonthly && (
							<p
								style={{
									fontFamily: "'Cairo', sans-serif",
									fontSize: "0.72rem",
									color: "var(--c-brass, #c8893b)",
									textAlign: "end",
									marginBottom: "14px",
								}}
							>
								أو ~ {arMoney(installmentMonthly)} ج.م/شهر بالتقسيط
							</p>
						)}

						{/* Primary CTA */}
						<a
							href="/checkout"
							onClick={close}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "9px",
								width: "100%",
								padding: "15px",
								borderRadius: "13px",
								background: "linear-gradient(135deg, var(--c-brand) 0%, #a81f1d 100%)",
								color: "#fff",
								fontFamily: "'Cairo', sans-serif",
								fontWeight: 700,
								fontSize: "1rem",
								textDecoration: "none",
								boxShadow: "0 12px 26px -12px rgba(212,53,51,0.55)",
								transition: "all 0.22s cubic-bezier(0.2,0.7,0.2,1)",
							}}
							onMouseEnter={(e) => {
								(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
								(e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 18px 34px -12px rgba(212,53,51,0.6)";
							}}
							onMouseLeave={(e) => {
								(e.currentTarget as HTMLAnchorElement).style.transform = "";
								(e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 26px -12px rgba(212,53,51,0.55)";
							}}
						>
							متابعة للدفع
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
								<path d="M14 5l-7 7 7 7" />
							</svg>
						</a>

						{/* Secondary — view full cart */}
						<a
							href="/cart"
							onClick={close}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: "100%",
								padding: "10px",
								marginTop: "8px",
								borderRadius: "12px",
								border: "1px solid var(--c-border)",
								background: "none",
								color: "var(--c-ink-muted)",
								fontFamily: "'Cairo', sans-serif",
								fontWeight: 600,
								fontSize: "0.86rem",
								textDecoration: "none",
								transition: "border-color 0.2s, color 0.2s",
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
							عرض السلة كاملةً
						</a>
					</div>
				)}
			</aside>
		</>
	);
}
