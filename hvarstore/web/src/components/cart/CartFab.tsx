import { useStore } from "@nanostores/react";
import { ShoppingBag } from "lucide-react";
import { cartCount } from "../../stores/cart";
import { cartDrawerOpen } from "../../stores/cartDrawer";

export default function CartFab() {
	const count = useStore(cartCount);
	const hasItems = count > 0;

	return (
		<button
			type="button"
			onClick={() => cartDrawerOpen.set(true)}
			aria-label={`السلة — ${count} ${count === 1 ? "منتج" : "منتجات"}`}
			className="fixed bottom-5 left-5 z-40 flex items-center justify-center w-14 h-14 rounded-2xl text-white transition-all duration-300 hover:-translate-y-1 active:scale-95"
			style={{
				background: hasItems
					? "linear-gradient(135deg, var(--c-brand) 0%, #a81f1d 100%)"
					: "rgba(35,27,24,0.45)",
				backdropFilter: "blur(8px)",
				WebkitBackdropFilter: "blur(8px)",
				boxShadow: hasItems
					? "0 8px 28px rgba(var(--c-brand-rgb),0.3)"
					: "0 2px 12px rgba(35,27,24,0.10)",
				paddingBottom: "calc(0px + env(safe-area-inset-bottom, 0px))",
				transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
				border: "none",
				cursor: "pointer",
			}}
		>
			<div className="relative flex items-center justify-center">
				{/* Ember glow ring when items exist */}
				{hasItems && (
					<span
						className="absolute inset-0 rounded-2xl"
						style={{
							border: "1.5px solid rgba(255,107,82,0.3)",
							animation: "fabGlow 2.4s ease-in-out infinite",
						}}
					/>
				)}

				<ShoppingBag
					size={20}
					style={{
						color: hasItems ? "#fff" : "rgba(255,255,255,0.55)",
						transition: "color 0.3s",
					}}
				/>

				{/* Badge */}
				<span
					className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold rounded-full leading-none pointer-events-none"
					style={{
						fontFamily: "'Inter', sans-serif",
						background: hasItems ? "#fff" : "transparent",
						color: hasItems ? "var(--c-brand)" : "transparent",
						transform: hasItems ? "scale(1)" : "scale(0)",
						transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
					}}
				>
					{count > 99 ? "99+" : count}
				</span>
			</div>
		</button>
	);
}
