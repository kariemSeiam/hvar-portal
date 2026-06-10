import { atom } from "nanostores";

export const wishlistIds = atom<number[]>([]);

if (typeof window !== "undefined") {
	const stored = localStorage.getItem("hvar-wishlist");
	if (stored) {
		try {
			wishlistIds.set(JSON.parse(stored));
		} catch {
			/* corrupt — start fresh */
		}
	}
	wishlistIds.subscribe((ids) => {
		localStorage.setItem("hvar-wishlist", JSON.stringify(ids));
	});
}

export function toggleWishlist(productId: number): boolean {
	const current = wishlistIds.get();
	const isOn = current.includes(productId);
	wishlistIds.set(isOn ? current.filter((id) => id !== productId) : [...current, productId]);
	return !isOn;
}
