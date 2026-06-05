import { useStore } from "@nanostores/react";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { cartCount, cartTotal } from "../../stores/cart";

export default function CartFab() {
	const count = useStore(cartCount);
	const total = useStore(cartTotal);
	const hasItems = count > 0;

	return (
		<a
			href="/cart"
			className="fixed bottom-5 left-5 z-40 flex items-center gap-3 pr-5 pl-4 py-3 rounded-2xl text-white transition-all duration-300 hover:-translate-y-1"
			style={{
				background: hasItems
					? "linear-gradient(135deg, #d43533 0%, #a81f1d 100%)"
					: "linear-gradient(135deg, #5c4f48 0%, #3d332e 100%)",
				boxShadow: hasItems
					? "0 8px 30px rgba(212,53,51,0.35)"
					: "0 4px 16px rgba(35,27,24,0.12)",
				paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
				transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
			}}
		>
			{/* Icon container with pulse when items exist */}
			<div className="relative">
				<div
					className="relative w-9 h-9 flex items-center justify-center rounded-xl"
					style={{
						background: hasItems
							? "rgba(255,255,255,0.15)"
							: "rgba(255,255,255,0.08)",
					}}
				>
					{hasItems && (
						<span
							className="absolute inset-0 rounded-xl animate-ping opacity-25"
							style={{
								background:
									"radial-gradient(circle, rgba(255,107,82,0.6), transparent 70%)",
								animation: "cartPulse 2s ease-in-out infinite",
							}}
						/>
					)}
					<ShoppingBag
						size={18}
						className="relative"
						style={{
							color: hasItems ? "#fff" : "rgba(255,255,255,0.6)",
						}}
					/>
				</div>

				{/* Badge — always visible, shows count */}
				<span
					className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold rounded-full font-['Inter'] leading-none transition-all duration-300"
					style={{
						background: hasItems ? "#fff" : "rgba(255,255,255,0.2)",
						color: hasItems ? "#d43533" : "rgba(255,255,255,0.6)",
						border: hasItems
							? "2px solid #d43533"
							: "2px solid transparent",
						transform: hasItems ? "scale(1)" : "scale(0.85)",
					}}
				>
					{count > 99 ? "99+" : count}
				</span>
			</div>

			{/* Text: total when items, creative empty state */}
			<div style={{ lineHeight: 1.2 }}>
				{hasItems ? (
					<>
						<span className="font-inter font-bold text-sm tabular-nums">
							{total.toLocaleString("ar-EG")} ج.م
						</span>
						<span className="block font-cairo text-[10px] opacity-75">
							{count} منتج · اتمام ←
						</span>
					</>
				) : (
					<>
						<span className="font-cairo font-bold text-sm">سلّتك</span>
						<span className="block font-cairo text-[10px] opacity-60">
							فاضية — تسوّق الآن ←
						</span>
					</>
				)}
			</div>

			{/* Creative decorative element: little bag icon tail */}
			<span
				className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full opacity-20"
				style={{
					background: hasItems
						? "radial-gradient(circle, #ff6b52, transparent 70%)"
						: "radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%)",
					filter: "blur(2px)",
				}}
			/>
		</a>
	);
}
