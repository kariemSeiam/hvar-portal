import * as jose from "jose";
import { loadEnv } from "../env";

const secret = new TextEncoder().encode(loadEnv().JWT_SECRET);

export interface JwtPayload {
	/** contact_id from hvar_erp.contacts */
	contactId: number;
	phone: string;
	name: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
	const jwt = await new jose.SignJWT({ ...payload })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(loadEnv().JWT_ACCESS_EXPIRY)
		.sign(secret);
	return jwt;
}

export async function signRefreshToken(payload: JwtPayload): Promise<string> {
	const jwt = await new jose.SignJWT({ ...payload })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(loadEnv().JWT_REFRESH_EXPIRY)
		.sign(secret);
	return jwt;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
	try {
		const { payload } = await jose.jwtVerify(token, secret);
		// Reject tokens that aren't full access tokens (e.g. fb_pending tickets).
		if (typeof payload.contactId !== "number") return null;
		return payload as unknown as JwtPayload;
	} catch {
		return null;
	}
}

/**
 * Short-lived ticket issued after a successful Facebook auth when we still need
 * the user's phone (FB never returns one). It carries the verified FB profile so
 * the phone-completion step is trusted without re-hitting the Graph API.
 */
export interface FbPendingPayload {
	purpose: "fb_pending";
	facebookId: string;
	name: string;
	email: string | null;
	avatar: string | null;
}

export async function signFbPending(
	p: Omit<FbPendingPayload, "purpose">,
): Promise<string> {
	return new jose.SignJWT({ ...p, purpose: "fb_pending" })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("15m")
		.sign(secret);
}

export async function verifyFbPending(
	token: string,
): Promise<FbPendingPayload | null> {
	try {
		const { payload } = await jose.jwtVerify(token, secret);
		if (payload.purpose !== "fb_pending") return null;
		return payload as unknown as FbPendingPayload;
	} catch {
		return null;
	}
}
