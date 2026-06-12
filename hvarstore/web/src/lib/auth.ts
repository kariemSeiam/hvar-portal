import { atom, computed } from "nanostores";

export interface User {
	contactId: number;
	phone: string;
	name: string;
	email?: string | null;
	avatar?: string | null;
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

/** Passwordless: phone is identity. Known phone logs in, new phone signs up. */
export async function loginWithPhone(phone: string, name?: string) {
	const res = await fetch(`${apiBase()}/api/auth/phone`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ phone, name }),
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

/** Read-only lookup: is this phone already a customer? Drives the phone-first
 *  flow — branch to login vs "introduce yourself" before any account is made. */
export async function checkPhone(phone: string): Promise<boolean> {
	const res = await fetch(`${apiBase()}/api/auth/phone/check`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ phone }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
	return !!data.exists;
}

export interface FacebookExchange {
	loggedIn: boolean;
	/** Set when FB succeeded but we still need a phone to finish (step 2). */
	needsPhone?: boolean;
	fbToken?: string;
	name?: string;
	email?: string | null;
}

/** Step 1: hand the FB access token to the API. Logs in or asks for a phone. */
export async function facebookExchange(
	accessToken: string,
): Promise<FacebookExchange> {
	const res = await fetch(`${apiBase()}/api/auth/facebook`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ accessToken }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.error ?? "تعذّر الدخول عبر فيسبوك");

	if (data.token) {
		authToken.set(data.token);
		authUser.set(data.user);
		if (data.refreshToken) {
			localStorage.setItem("hvar-refresh-token", data.refreshToken);
		}
		return { loggedIn: true };
	}
	return {
		loggedIn: false,
		needsPhone: true,
		fbToken: data.fbToken,
		name: data.name,
		email: data.email,
	};
}

/** Step 2: complete a Facebook signup with the phone the user just entered. */
export async function facebookComplete(
	fbToken: string,
	phone: string,
	name?: string,
) {
	const res = await fetch(`${apiBase()}/api/auth/facebook/complete`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ fbToken, phone, name }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.error ?? "خطأ في إكمال التسجيل");
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

/** Normalize any Egyptian mobile input to 01XXXXXXXXX, or null if invalid. */
export function normalizeEgyptPhone(raw: string): string | null {
	let digits = raw.replace(/\D/g, "");
	if (digits.startsWith("20")) digits = digits.slice(2);
	if (digits.length === 10 && digits.startsWith("1")) digits = "0" + digits;
	return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}
