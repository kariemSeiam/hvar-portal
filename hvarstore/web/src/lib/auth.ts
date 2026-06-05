import { atom, computed } from "nanostores";

export interface User {
	contactId: number;
	phone: string;
	name: string;
}

export const authToken = atom<string | null>(null);
export const authUser = atom<User | null>(null);
export const isLoggedIn = computed(authToken, (t) => t !== null);

if (typeof window !== "undefined") {
	const stored = localStorage.getItem("hvar-token");
	const storedUser = localStorage.getItem("hvar-user");
	if (stored) authToken.set(stored);
	if (storedUser) {
		try {
			authUser.set(JSON.parse(storedUser));
		} catch {
			/* corrupt */
		}
	}

	authToken.subscribe((t) => {
		if (t) localStorage.setItem("hvar-token", t);
		else localStorage.removeItem("hvar-token");
	});
	authUser.subscribe((u) => {
		if (u) localStorage.setItem("hvar-user", JSON.stringify(u));
		else localStorage.removeItem("hvar-user");
	});
}

function apiBase(): string {
	if (typeof window === "undefined") return "http://localhost:5000";
	return import.meta.env?.PUBLIC_API_URL ?? "http://localhost:5000";
}

export async function login(phone: string, password: string) {
	const res = await fetch(`${apiBase()}/api/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ phone, password }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.error ?? "خطأ في تسجيل الدخول");
	authToken.set(data.token);
	authUser.set(data.user);
	if (data.refreshToken) {
		localStorage.setItem("hvar-refresh-token", data.refreshToken);
	}
	return data;
}

export async function register(phone: string, name: string, password: string) {
	const res = await fetch(`${apiBase()}/api/auth/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ phone, name, password }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.error ?? "خطأ في التسجيل");
	authToken.set(data.token);
	authUser.set(data.user);
	if (data.refreshToken) {
		localStorage.setItem("hvar-refresh-token", data.refreshToken);
	}
	return data;
}

export function logout() {
	authToken.set(null);
	authUser.set(null);
	localStorage.removeItem("hvar-refresh-token");
}

export function getAuthHeaders(): Record<string, string> {
	const token = authToken.get();
	if (!token) return {};
	return { Authorization: `Bearer ${token}` };
}
