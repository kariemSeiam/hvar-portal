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
		return payload as unknown as JwtPayload;
	} catch {
		return null;
	}
}
