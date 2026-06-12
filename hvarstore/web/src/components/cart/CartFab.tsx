import { useStore } from "@nanostores/react";
import { ShoppingBag } from "lucide-react";
import { cartCount } from "../../stores/cart";
import { cartDrawerOpen } from "../../stores/cartDrawer";

export default function CartFab() {
	const count = useStore(cartCount);
	const hasItems = count > 0;

	const ariaLabel = `السلة — ${count} ${count === 1 ? "منتج" : "منتجات"}`;

	const notifBadge = (
		<span
			className="absolute flex items-center justify-center rounded-full font-inter font-bold leading-none pointer-events-none"
			style={{
				top: "-9px",
				insetInlineStart: "-9px",
				minWidth: "20px",
				height: "20px",
				fontSize: "10px",
				paddingInline: "3px",
				background: "#fff",
				color: "var(--c-brand)",
				border: "2px solid #c0392b",
				boxShadow: "0 2px 8px rgba(0,0,0,0.22)",
				transform: hasItems ? "scale(1)" : "scale(0)",
				transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
				zIndex: 1,
			}}
		>
			{count > 99 ? "99+" : count}
		</span>
	);

	return (
		<>
			{/* ── Mobile pill — floats above bottom nav, visible only when cart has items ── */}
			<button
				type="button"
				onClick={() => cartDrawerOpen.set(true)}
				aria-label={ariaLabel}
				className="cart-fab-pill md:hidden fixed z-50 flex items-center gap-2 font-cairo font-bold text-white rounded-2xl"
				style={{
					bottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px) + 0.625rem)",
					insetInlineEnd: "0.875rem",
					height: "48px",
					paddingInline: "0.875rem 1.125rem",
					background: "linear-gradient(135deg, var(--c-brand) 0%, #a81f1d 100%)",
					boxShadow: "0 8px 28px rgba(var(--c-brand-rgb), 0.38), 0 2px 8px rgba(0,0,0,0.14)",
					opacity: hasItems ? 1 : 0,
					pointerEvents: hasItems ? "auto" : "none",
					transform: hasItems ? "translateY(0) scale(1)" : "translateY(14px) scale(0.94)",
					transition: "opacity 0.3s cubic-bezier(0.22,1,0.36,1), transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease",
					border: "none",
					cursor: "pointer",
					fontSize: "0.875rem",
				}}
			>
				<ShoppingBag size={18} />
				<span>السلة</span>
				{notifBadge}
			</button>

			{/* ── Desktop FAB ── */}
			<button
				type="button"
				onClick={() => cartDrawerOpen.set(true)}
				aria-label={ariaLabel}
				className="hidden md:flex fixed z-40 items-center justify-center rounded-2xl text-white"
				style={{
					bottom: "1.5rem",
					insetInlineEnd: "1.25rem",
					width: "3.5rem",
					height: "3.5rem",
					background: "linear-gradient(135deg, var(--c-brand) 0%, #a81f1d 100%)",
					boxShadow: "0 8px 28px rgba(var(--c-brand-rgb),0.32), 0 2px 8px rgba(0,0,0,0.10)",
					opacity: hasItems ? 1 : 0,
					pointerEvents: hasItems ? "auto" : "none",
					transform: hasItems ? "translateY(0) scale(1)" : "translateY(14px) scale(0.92)",
					transition: "opacity 0.3s cubic-bezier(0.22,1,0.36,1), transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease",
					border: "none",
					cursor: "pointer",
				}}
			>
				{/* Glow ring when active */}
				{hasItems && (
					<span
						className="absolute inset-0 rounded-2xl pointer-events-none"
						style={{
							border: "1.5px solid rgba(255,107,82,0.32)",
							animation: "fabGlow 2.4s ease-in-out infinite",
						}}
					/>
				)}

				<ShoppingBag size={22} />
				{notifBadge}
			</button>
		</>
	);
}
