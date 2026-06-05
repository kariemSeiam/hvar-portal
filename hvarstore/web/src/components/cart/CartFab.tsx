import { useStore } from "@nanostores/react";
import { ShoppingBag } from "lucide-react";
import { cartCount, cartTotal } from "../../stores/cart";

export default function CartFab() {
	const count = useStore(cartCount);
	const total = useStore(cartTotal);

	if (count === 0) return null;

	return (
		<a
			href="/cart"
			className="fixed bottom-5 left-5 z-40 md:hidden flex items-center gap-3 pl-4 pr-5 py-3 rounded-2xl bg-[#d43533] text-white shadow-[0_8px_30px_rgba(212,53,51,0.35)] hover:bg-[#b91c1c] transition-all"
			style={{
				paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
				transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
			}}
		>
			<div className="relative">
				<ShoppingBag size={20} />
				<span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] flex items-center justify-center bg-white text-[#d43533] text-[9px] font-bold rounded-full px-0.5 font-['Inter']">
					{count > 99 ? "99+" : count}
				</span>
			</div>
			<span className="font-inter font-bold text-sm tabular-nums">
				{total.toLocaleString("ar-EG")} ج.م
			</span>
		</a>
	);
}
