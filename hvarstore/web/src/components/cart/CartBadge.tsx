import { useStore } from "@nanostores/react";
import { ShoppingBag } from "lucide-react";
import { cartCount } from "../../stores/cart";
import { cartDrawerOpen } from "../../stores/cartDrawer";

export default function CartBadge() {
	const count = useStore(cartCount);
	return (
		<button
			type="button"
			onClick={() => cartDrawerOpen.set(true)}
			aria-label={`السلة — ${count} ${count === 1 ? "منتج" : "منتجات"}`}
			className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
			style={{ background: "none", border: "none", cursor: "pointer" }}
		>
			<ShoppingBag size={21} className="text-stone-700 dark:text-stone-200" />
			{count > 0 && (
				<span
					className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-brand text-white text-[10px] font-bold rounded-full px-1"
					style={{ fontFamily: "'Inter', sans-serif" }}
				>
					{count > 99 ? "99+" : count}
				</span>
			)}
		</button>
	);
}
