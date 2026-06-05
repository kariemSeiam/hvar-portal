import { useStore } from "@nanostores/react";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import {
	cartItems,
	cartCount,
	cartTotal,
	updateQuantity,
	removeFromCart,
} from "../../stores/cart";

export default function CartView() {
	const items = useStore(cartItems);
	const count = useStore(cartCount);
	const total = useStore(cartTotal);

	if (items.length === 0) {
		return (
			<div className="text-center py-20">
				<div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800 text-[#a8a29e]">
					<ShoppingBag size={28} />
				</div>
				<p className="font-cairo text-lg text-[#57534e] dark:text-[#a8a29e] mb-2">
					السلة فاضية
				</p>
				<p className="font-cairo text-sm text-[#a8a29e] dark:text-[#57534e] mb-6">
					ابدأ التسوق وأضف منتجات للسلة
				</p>
				<a
					href="/products"
					className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#d43533] hover:bg-[#b91c1c] text-white font-cairo font-bold text-sm transition-all"
				>
					تصفح المنتجات
				</a>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Items */}
			<div className="space-y-3">
				{items.map((item) => (
					<div
						key={item.variationId}
						className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e7e0d6] dark:border-[#2c2825]"
					>
						{/* Image */}
						<a
							href={`/products/${item.slug}`}
							className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-stone-50 dark:bg-stone-900"
						>
							{item.image ? (
								<img
									src={item.image}
									alt={item.name}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center">
									<ShoppingBag
										size={20}
										className="text-stone-300 dark:text-stone-600"
									/>
								</div>
							)}
						</a>

						{/* Info */}
						<div className="flex-1 min-w-0">
							<a
								href={`/products/${item.slug}`}
								className="font-cairo font-semibold text-sm text-[#1c1917] dark:text-[#f5f5f4] hover:text-[#d43533] transition-colors line-clamp-2"
							>
								{item.name}
							</a>

							<p className="font-inter font-bold text-[#d43533] text-sm mt-1">
								{item.price.toLocaleString("ar-EG")} ج.م
							</p>

							{/* Qty controls */}
							<div className="flex items-center justify-between mt-3">
								<div className="flex items-center rounded-lg border border-[#e7e0d6] dark:border-[#2c2825] overflow-hidden">
									<button
										onClick={() =>
											updateQuantity(item.variationId, item.quantity - 1)
										}
										className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
										aria-label="تقليل"
									>
										<Minus size={13} />
									</button>
									<span className="w-8 text-center font-inter font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4]">
										{item.quantity}
									</span>
									<button
										onClick={() =>
											updateQuantity(item.variationId, item.quantity + 1)
										}
										className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
										aria-label="زيادة"
									>
										<Plus size={13} />
									</button>
								</div>

								<button
									onClick={() => removeFromCart(item.variationId)}
									className="flex items-center gap-1 text-xs font-cairo text-stone-400 hover:text-red-500 transition-colors"
								>
									<Trash2 size={13} />
									حذف
								</button>
							</div>
						</div>

						{/* Line total */}
						<div className="flex-shrink-0 text-end">
							<p className="font-inter font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4]">
								{(item.price * item.quantity).toLocaleString("ar-EG")} ج.م
							</p>
						</div>
					</div>
				))}
			</div>

			{/* Summary */}
			<div className="rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e7e0d6] dark:border-[#2c2825] p-5 space-y-4">
				<div className="flex items-center justify-between">
					<span className="font-cairo text-sm text-[#57534e] dark:text-[#a8a29e]">
						المنتجات ({count})
					</span>
					<span className="font-inter font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4]">
						{total.toLocaleString("ar-EG")} ج.م
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="font-cairo text-sm text-[#57534e] dark:text-[#a8a29e]">
						الشحن
					</span>
					<span className="font-cairo text-sm text-[#22c55e] font-semibold">
						مجاني
					</span>
				</div>
				<div className="border-t border-[#e7e0d6] dark:border-[#2c2825] pt-4 flex items-center justify-between">
					<span className="font-cairo font-bold text-[#1c1917] dark:text-[#f5f5f4]">
						الإجمالي
					</span>
					<span className="font-inter font-black text-xl text-[#d43533]">
						{total.toLocaleString("ar-EG")} ج.م
					</span>
				</div>
			</div>

			{/* Actions */}
			<div className="flex flex-col sm:flex-row gap-3">
				<a
					href="/checkout"
					className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#d43533] hover:bg-[#b91c1c] text-white font-cairo font-bold text-base transition-all hover:shadow-[0_6px_20px_rgba(212,53,51,0.3)]"
					style={{ transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
				>
					إتمام الشراء
					<ArrowLeft size={16} />
				</a>
				<a
					href="/products"
					className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl border border-[#e7e0d6] dark:border-[#2c2825] text-[#1c1917] dark:text-[#f5f5f4] font-cairo font-semibold text-sm hover:border-[#d43533] hover:text-[#d43533] transition-all"
				>
					متابعة التسوق
				</a>
			</div>

			{/* Trust line */}
			<div className="trust-line justify-center">
				<span>ضمان سنتين</span>
				<span>شحن مجاني</span>
				<span>افحص قبل الدفع</span>
			</div>
		</div>
	);
}
