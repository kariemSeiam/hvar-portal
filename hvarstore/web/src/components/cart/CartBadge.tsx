import { useStore } from "@nanostores/react";
import { ShoppingBag } from "lucide-react";
import { cartCount } from "../../stores/cart";

export default function CartBadge() {
	const count = useStore(cartCount);
	return (
		<a
			href="/cart"
			className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-red-50 transition-colors"
			aria-label={`السلة — ${count} منتج`}
		>
			<ShoppingBag size={21} className="text-stone-700 dark:text-stone-200" />
			{count > 0 && (
				<span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[#d43533] text-white text-[10px] font-bold rounded-full px-1 font-['Inter']">
					{count > 99 ? "99+" : count}
				</span>
			)}
		</a>
	);
}
