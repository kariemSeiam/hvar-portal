import { atom, computed } from "nanostores";

export interface CartItem {
	productId: number;
	variationId: number;
	slug: string;
	name: string;
	image: string | null;
	price: number;
	quantity: number;
}

export const cartItems = atom<CartItem[]>([]);

export const cartCount = computed(cartItems, (items) =>
	items.reduce((sum, i) => sum + i.quantity, 0),
);

export const cartTotal = computed(cartItems, (items) =>
	items.reduce((sum, i) => sum + i.price * i.quantity, 0),
);

if (typeof window !== "undefined") {
	const stored = localStorage.getItem("hvar-cart");
	if (stored) {
		try {
			cartItems.set(JSON.parse(stored));
		} catch {
			/* corrupt storage — start fresh */
		}
	}
	cartItems.subscribe((items) => {
		localStorage.setItem("hvar-cart", JSON.stringify(items));
	});
}

export function addToCart(item: Omit<CartItem, "quantity">) {
	const current = cartItems.get();
	const existing = current.find((i) => i.variationId === item.variationId);
	if (existing) {
		cartItems.set(
			current.map((i) =>
				i.variationId === item.variationId
					? { ...i, quantity: i.quantity + 1 }
					: i,
			),
		);
	} else {
		cartItems.set([...current, { ...item, quantity: 1 }]);
	}
}

export function removeFromCart(variationId: number) {
	cartItems.set(cartItems.get().filter((i) => i.variationId !== variationId));
}

export function updateQuantity(variationId: number, quantity: number) {
	if (quantity <= 0) {
		removeFromCart(variationId);
		return;
	}
	cartItems.set(
		cartItems
			.get()
			.map((i) => (i.variationId === variationId ? { ...i, quantity } : i)),
	);
}
